from datetime import datetime
from pydantic import BaseModel
from app.models.approval import ApprovalStep, ApprovalResult


class ApprovalActionRequest(BaseModel):
    result: ApprovalResult          # approved / rejected
    comment: str | None = None


class InventorOpinionRequest(BaseModel):
    opinion: str                    # 발명자 의견 본문


class ApprovalStepResponse(BaseModel):
    id: int
    step: ApprovalStep
    step_order: int
    step_label: str
    result: ApprovalResult
    approver_id: int | None
    comment: str | None
    processed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkflowResponse(BaseModel):
    contract_id: int
    contract_status: str
    steps: list[ApprovalStepResponse]
    current_step: ApprovalStep | None   # 현재 대기 중인 단계
