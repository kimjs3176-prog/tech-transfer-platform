from datetime import datetime
from pydantic import BaseModel
from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    technology_name: str
    patent_no: str | None = None
    transfer_type: str
    purpose: str
    extra_data: dict | None = None
    assigned_inventor_id: int | None = None


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus | None = None
    rejection_reason: str | None = None
    manager_id: int | None = None
    assigned_inventor_id: int | None = None


class ApplicationResponse(BaseModel):
    id: int
    application_no: str
    status: ApplicationStatus
    technology_name: str
    patent_no: str | None
    transfer_type: str
    purpose: str
    rejection_reason: str | None
    assigned_inventor_id: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
