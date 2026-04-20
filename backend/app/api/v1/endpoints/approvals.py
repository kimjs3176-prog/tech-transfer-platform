from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.contract import Contract, ContractStatus
from app.models.approval import ApprovalStep, ApprovalResult
from app.models.invention import Invention
from app.schemas.approval import (
    ApprovalActionRequest,
    InventorOpinionRequest,
    ApprovalStepResponse,
    WorkflowResponse,
)
from app.services.approval_workflow import (
    STEP_LABELS,
    start_approval_workflow,
    get_current_step,
    get_all_steps,
    process_step,
)
from app.services.notifications import send_approval_notification

router = APIRouter()


def _to_step_response(approval) -> ApprovalStepResponse:
    return ApprovalStepResponse(
        id=approval.id,
        step=approval.step,
        step_order=approval.step_order,
        step_label=STEP_LABELS[approval.step],
        result=approval.result,
        approver_id=approval.approver_id,
        comment=approval.comment,
        processed_at=approval.processed_at,
        created_at=approval.created_at,
    )


# ── 워크플로 조회 ────────────────────────────────────────────────

@router.get("/contracts/{contract_id}/workflow", response_model=WorkflowResponse)
async def get_workflow(contract_id: int, db: AsyncSession = Depends(get_db)):
    contract = await db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="계약서를 찾을 수 없습니다.")

    steps = await get_all_steps(contract_id, db)
    current = await get_current_step(contract_id, db)

    return WorkflowResponse(
        contract_id=contract_id,
        contract_status=contract.status,
        steps=[_to_step_response(s) for s in steps],
        current_step=current.step if current else None,
    )


# ── 워크플로 시작 (담당자) ──────────────────────────────────────

@router.post("/contracts/{contract_id}/workflow/start", response_model=WorkflowResponse)
async def start_workflow(
    contract_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_roles(UserRole.MANAGER, UserRole.ADMIN)),
):
    contract = await db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="계약서를 찾을 수 없습니다.")
    if contract.status != ContractStatus.DRAFT:
        raise HTTPException(status_code=400, detail="작성 중(DRAFT) 상태의 계약서만 워크플로를 시작할 수 있습니다.")

    steps = await start_approval_workflow(contract, db)

    if contract.invention_id:
        invention = await db.get(Invention, contract.invention_id)
        if invention:
            inventor = await db.get(User, invention.inventor_id)
            if inventor:
                background_tasks.add_task(
                    send_approval_notification, contract_id, "inventor_opinion", inventor.email
                )

    return WorkflowResponse(
        contract_id=contract_id,
        contract_status=contract.status,
        steps=[_to_step_response(s) for s in steps],
        current_step=ApprovalStep.INVENTOR_OPINION,
    )


# ── 1단계: 발명자 의견 작성 ─────────────────────────────────────

@router.post("/contracts/{contract_id}/workflow/inventor-opinion", response_model=WorkflowResponse)
async def submit_inventor_opinion(
    contract_id: int,
    payload: InventorOpinionRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_roles(UserRole.INVENTOR, UserRole.ADMIN)),
):
    contract = await db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="계약서를 찾을 수 없습니다.")

    if contract.invention_id:
        invention = await db.get(Invention, contract.invention_id)
        if invention:
            from datetime import datetime
            invention.inventor_opinion = payload.opinion
            invention.opinion_submitted_at = datetime.utcnow()

    await process_step(
        contract_id=contract_id,
        step=ApprovalStep.INVENTOR_OPINION,
        result=ApprovalResult.APPROVED,
        actor=actor,
        comment=payload.opinion,
        db=db,
    )

    background_tasks.add_task(
        send_approval_notification, contract_id, "opinion_review", "manager@rda.go.kr"
    )

    steps = await get_all_steps(contract_id, db)
    current = await get_current_step(contract_id, db)
    return WorkflowResponse(
        contract_id=contract_id,
        contract_status=contract.status,
        steps=[_to_step_response(s) for s in steps],
        current_step=current.step if current else None,
    )


# ── 2단계: 담당자 의견 검토 ─────────────────────────────────────

@router.post("/contracts/{contract_id}/workflow/review", response_model=WorkflowResponse)
async def review_opinion(
    contract_id: int,
    payload: ApprovalActionRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_roles(UserRole.MANAGER, UserRole.ADMIN)),
):
    contract = await db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="계약서를 찾을 수 없습니다.")

    await process_step(
        contract_id=contract_id,
        step=ApprovalStep.OPINION_REVIEW,
        result=payload.result,
        actor=actor,
        comment=payload.comment,
        db=db,
    )

    if payload.result == ApprovalResult.APPROVED:
        background_tasks.add_task(
            send_approval_notification, contract_id, "dept_head", "depthead@rda.go.kr"
        )
    else:
        background_tasks.add_task(
            send_approval_notification, contract_id, "inventor_opinion_retry", "inventor@rda.go.kr"
        )

    steps = await get_all_steps(contract_id, db)
    current = await get_current_step(contract_id, db)
    return WorkflowResponse(
        contract_id=contract_id,
        contract_status=contract.status,
        steps=[_to_step_response(s) for s in steps],
        current_step=current.step if current else None,
    )


# ── 3단계: 부서장 결재 ──────────────────────────────────────────

@router.post("/contracts/{contract_id}/workflow/dept-approval", response_model=WorkflowResponse)
async def dept_approval(
    contract_id: int,
    payload: ApprovalActionRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_roles(UserRole.DEPT_HEAD, UserRole.ADMIN)),
):
    contract = await db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="계약서를 찾을 수 없습니다.")
    if contract.status != ContractStatus.DEPT_APPROVAL:
        raise HTTPException(status_code=400, detail="부서장 결재 대기 상태가 아닙니다.")

    await process_step(
        contract_id=contract_id,
        step=ApprovalStep.DEPT_HEAD,
        result=payload.result,
        actor=actor,
        comment=payload.comment,
        db=db,
    )

    if payload.result == ApprovalResult.APPROVED:
        background_tasks.add_task(
            send_approval_notification, contract_id, "registered", "applicant@example.com"
        )
    else:
        background_tasks.add_task(
            send_approval_notification, contract_id, "review_retry", "manager@rda.go.kr"
        )

    steps = await get_all_steps(contract_id, db)
    current = await get_current_step(contract_id, db)
    return WorkflowResponse(
        contract_id=contract_id,
        contract_status=contract.status,
        steps=[_to_step_response(s) for s in steps],
        current_step=current.step if current else None,
    )


# ── 워크플로 이력 조회 ──────────────────────────────────────────

@router.get("/contracts/{contract_id}/workflow/history", response_model=list[ApprovalStepResponse])
async def get_workflow_history(contract_id: int, db: AsyncSession = Depends(get_db)):
    steps = await get_all_steps(contract_id, db)
    if not steps:
        raise HTTPException(status_code=404, detail="결재 이력이 없습니다.")
    return [_to_step_response(s) for s in steps]
