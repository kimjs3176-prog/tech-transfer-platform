"""
결재 워크플로 상태머신

절차도 기반 단계:
  DRAFT
    └─(발명자 배정)──▶ INVENTOR_REVIEW  : 발명자가 의견 작성 (30건)
                          └─(의견 제출)──▶ OPINION_REVIEW  : 담당자 의견 검토 (2건)
                                             └─(검토 완료)──▶ DEPT_APPROVAL   : 부서장 결재 (10건)
                                                                └─(결재 승인)──▶ REGISTERED     : 계약서 등록 (1010건)
                                                                └─(결재 반려)──▶ OPINION_REVIEW  (재검토)
"""

from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.contract import Contract, ContractStatus
from app.models.approval import Approval, ApprovalStep, ApprovalResult
from app.models.user import User, UserRole


# 단계 순서 정의
STEP_ORDER: dict[ApprovalStep, int] = {
    ApprovalStep.INVENTOR_OPINION: 1,
    ApprovalStep.OPINION_REVIEW:   2,
    ApprovalStep.DEPT_HEAD:        3,
    ApprovalStep.FINAL:            4,
}

# 계약 상태 ↔ 결재 단계 매핑
STATUS_TO_STEP: dict[ContractStatus, ApprovalStep] = {
    ContractStatus.INVENTOR_REVIEW: ApprovalStep.INVENTOR_OPINION,
    ContractStatus.DEPT_APPROVAL:   ApprovalStep.DEPT_HEAD,
}

# 각 단계에서 처리할 수 있는 역할
STEP_ALLOWED_ROLES: dict[ApprovalStep, list[UserRole]] = {
    ApprovalStep.INVENTOR_OPINION: [UserRole.INVENTOR],
    ApprovalStep.OPINION_REVIEW:   [UserRole.MANAGER],
    ApprovalStep.DEPT_HEAD:        [UserRole.DEPT_HEAD],
    ApprovalStep.FINAL:            [UserRole.MANAGER, UserRole.ADMIN],
}

# 단계 완료 후 다음 계약 상태
NEXT_CONTRACT_STATUS: dict[ApprovalStep, ContractStatus] = {
    ApprovalStep.INVENTOR_OPINION: ContractStatus.DEPT_APPROVAL,   # 의견 제출 → 담당자 검토 대기
    ApprovalStep.OPINION_REVIEW:   ContractStatus.DEPT_APPROVAL,   # 검토 완료 → 부서장 결재 대기
    ApprovalStep.DEPT_HEAD:        ContractStatus.REGISTERED,      # 부서장 승인 → 등록 완료
    ApprovalStep.FINAL:            ContractStatus.REGISTERED,
}

STEP_LABELS: dict[ApprovalStep, str] = {
    ApprovalStep.INVENTOR_OPINION: "발명자 의견 작성",
    ApprovalStep.OPINION_REVIEW:   "의견 검토",
    ApprovalStep.DEPT_HEAD:        "부서장 결재",
    ApprovalStep.FINAL:            "최종 승인",
}


async def start_approval_workflow(contract: Contract, db: AsyncSession) -> list[Approval]:
    """계약서 결재 워크플로 시작 — 4단계 결재 레코드를 한 번에 생성"""
    existing = await db.scalar(select(Approval).where(Approval.contract_id == contract.id))
    if existing:
        raise HTTPException(status_code=400, detail="이미 결재 워크플로가 시작된 계약서입니다.")

    steps = [
        Approval(
            contract_id=contract.id,
            step=step,
            step_order=order,
            result=ApprovalResult.PENDING,
        )
        for step, order in STEP_ORDER.items()
    ]
    for s in steps:
        db.add(s)

    contract.status = ContractStatus.INVENTOR_REVIEW
    await db.flush()
    return steps


async def get_current_step(contract_id: int, db: AsyncSession) -> Approval | None:
    """현재 진행 중인(PENDING) 결재 단계 반환 — 순서가 가장 낮은 것"""
    result = await db.scalars(
        select(Approval)
        .where(Approval.contract_id == contract_id, Approval.result == ApprovalResult.PENDING)
        .order_by(Approval.step_order)
    )
    return result.first()


async def get_all_steps(contract_id: int, db: AsyncSession) -> list[Approval]:
    result = await db.scalars(
        select(Approval)
        .where(Approval.contract_id == contract_id)
        .order_by(Approval.step_order)
    )
    return list(result.all())


async def process_step(
    contract_id: int,
    step: ApprovalStep,
    result: ApprovalResult,
    actor: User,
    comment: str | None,
    db: AsyncSession,
) -> Approval:
    """결재 단계 처리 (승인 / 반려)"""
    # 권한 검사
    allowed = STEP_ALLOWED_ROLES.get(step, [])
    if actor.role not in allowed and actor.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail=f"'{STEP_LABELS[step]}' 단계는 {[r.value for r in allowed]} 역할만 처리할 수 있습니다.",
        )

    # 현재 단계 조회
    approval = await db.scalar(
        select(Approval).where(
            Approval.contract_id == contract_id,
            Approval.step == step,
            Approval.result == ApprovalResult.PENDING,
        )
    )
    if not approval:
        raise HTTPException(status_code=404, detail="처리 가능한 결재 단계를 찾을 수 없습니다.")

    contract = await db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="계약서를 찾을 수 없습니다.")

    approval.result = result
    approval.approver_id = actor.id
    approval.comment = comment
    approval.processed_at = datetime.utcnow()

    if result == ApprovalResult.APPROVED:
        await _on_approved(approval, contract, db)
    else:
        await _on_rejected(approval, contract, db)

    await db.flush()
    await db.refresh(approval)
    return approval


async def _on_approved(approval: Approval, contract: Contract, db: AsyncSession):
    """승인 처리 — 다음 단계로 전진"""
    next_status = NEXT_CONTRACT_STATUS.get(approval.step)
    if next_status:
        contract.status = next_status

    # 부서장 결재 승인이면 나머지 FINAL 단계도 자동 승인
    if approval.step == ApprovalStep.DEPT_HEAD:
        final = await db.scalar(
            select(Approval).where(
                Approval.contract_id == contract.id,
                Approval.step == ApprovalStep.FINAL,
                Approval.result == ApprovalResult.PENDING,
            )
        )
        if final:
            final.result = ApprovalResult.APPROVED
            final.processed_at = datetime.utcnow()
            final.comment = "부서장 결재 완료로 자동 승인"


async def _on_rejected(approval: Approval, contract: Contract, db: AsyncSession):
    """반려 처리 — 이전 단계로 되돌리기"""
    if approval.step == ApprovalStep.DEPT_HEAD:
        # 부서장 반려 → 의견 검토 단계로 복귀
        contract.status = ContractStatus.INVENTOR_REVIEW
        prev = await db.scalar(
            select(Approval).where(
                Approval.contract_id == contract.id,
                Approval.step == ApprovalStep.OPINION_REVIEW,
            )
        )
        if prev:
            prev.result = ApprovalResult.PENDING
            prev.processed_at = None
            prev.comment = None
    elif approval.step == ApprovalStep.OPINION_REVIEW:
        # 담당자 반려 → 발명자 의견 재작성
        contract.status = ContractStatus.INVENTOR_REVIEW
        prev = await db.scalar(
            select(Approval).where(
                Approval.contract_id == contract.id,
                Approval.step == ApprovalStep.INVENTOR_OPINION,
            )
        )
        if prev:
            prev.result = ApprovalResult.PENDING
            prev.processed_at = None
            prev.comment = None
