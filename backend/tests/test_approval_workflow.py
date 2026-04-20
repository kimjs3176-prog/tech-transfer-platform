"""
결재 워크플로 상태머신 단위 테스트
pytest -q tests/test_approval_workflow.py
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.models.approval import Approval, ApprovalStep, ApprovalResult
from app.models.contract import Contract, ContractStatus
from app.models.user import User, UserRole
from app.services.approval_workflow import (
    start_approval_workflow,
    process_step,
    get_current_step,
    STEP_ORDER,
)


def make_contract(status=ContractStatus.DRAFT) -> Contract:
    c = Contract()
    c.id = 1
    c.status = status
    c.invention_id = None
    return c


def make_user(role: UserRole) -> User:
    u = User()
    u.id = 99
    u.role = role
    return u


def make_pending_approval(step: ApprovalStep) -> Approval:
    a = Approval()
    a.id = STEP_ORDER[step]
    a.contract_id = 1
    a.step = step
    a.step_order = STEP_ORDER[step]
    a.result = ApprovalResult.PENDING
    a.comment = None
    a.processed_at = None
    return a


# ── start_approval_workflow ──────────────────────────────────────

@pytest.mark.asyncio
async def test_start_workflow_creates_four_steps():
    contract = make_contract()
    db = AsyncMock()
    db.scalar.return_value = None   # 기존 워크플로 없음
    db.add = MagicMock()
    db.flush = AsyncMock()

    steps = await start_approval_workflow(contract, db)

    assert len(steps) == 4
    assert {s.step for s in steps} == set(ApprovalStep)
    assert contract.status == ContractStatus.INVENTOR_REVIEW


@pytest.mark.asyncio
async def test_start_workflow_raises_if_already_started():
    from fastapi import HTTPException
    contract = make_contract()
    db = AsyncMock()
    db.scalar.return_value = make_pending_approval(ApprovalStep.INVENTOR_OPINION)

    with pytest.raises(HTTPException) as exc:
        await start_approval_workflow(contract, db)
    assert exc.value.status_code == 400


# ── process_step 권한 검사 ───────────────────────────────────────

@pytest.mark.asyncio
async def test_process_step_wrong_role_raises_403():
    from fastapi import HTTPException
    db = AsyncMock()
    actor = make_user(UserRole.APPLICANT)  # 신청자는 의견 작성 불가

    with pytest.raises(HTTPException) as exc:
        await process_step(1, ApprovalStep.INVENTOR_OPINION, ApprovalResult.APPROVED, actor, None, db)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_process_any_step():
    db = AsyncMock()
    actor = make_user(UserRole.ADMIN)
    approval = make_pending_approval(ApprovalStep.INVENTOR_OPINION)
    contract = make_contract(ContractStatus.INVENTOR_REVIEW)

    db.scalar.return_value = approval
    db.get.return_value = contract
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    result = await process_step(1, ApprovalStep.INVENTOR_OPINION, ApprovalResult.APPROVED, actor, "테스트", db)
    assert result.result == ApprovalResult.APPROVED


# ── 반려 시 이전 단계 복귀 ────────────────────────────────────────

@pytest.mark.asyncio
async def test_dept_head_rejection_reverts_to_inventor_review():
    db = AsyncMock()
    actor = make_user(UserRole.DEPT_HEAD)
    approval = make_pending_approval(ApprovalStep.DEPT_HEAD)
    contract = make_contract(ContractStatus.DEPT_APPROVAL)
    prev_review = make_pending_approval(ApprovalStep.OPINION_REVIEW)
    prev_review.result = ApprovalResult.APPROVED  # 이미 완료된 상태

    db.scalar.side_effect = [approval, prev_review]
    db.get.return_value = contract
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    await process_step(1, ApprovalStep.DEPT_HEAD, ApprovalResult.REJECTED, actor, "수정 필요", db)

    assert contract.status == ContractStatus.INVENTOR_REVIEW
    assert prev_review.result == ApprovalResult.PENDING  # 복귀 확인


# ── 부서장 승인 시 FINAL 자동 승인 ──────────────────────────────

@pytest.mark.asyncio
async def test_dept_head_approval_auto_approves_final():
    db = AsyncMock()
    actor = make_user(UserRole.DEPT_HEAD)
    approval = make_pending_approval(ApprovalStep.DEPT_HEAD)
    contract = make_contract(ContractStatus.DEPT_APPROVAL)
    final_step = make_pending_approval(ApprovalStep.FINAL)

    db.scalar.side_effect = [approval, final_step]
    db.get.return_value = contract
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    await process_step(1, ApprovalStep.DEPT_HEAD, ApprovalResult.APPROVED, actor, None, db)

    assert contract.status == ContractStatus.REGISTERED
    assert final_step.result == ApprovalResult.APPROVED
