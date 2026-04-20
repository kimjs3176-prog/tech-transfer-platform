from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel
from app.models.contract import ContractStatus


class ContractCreate(BaseModel):
    application_id: int
    invention_id: int | None = None
    contract_period_start: date | None = None
    contract_period_end: date | None = None
    royalty_rate: Decimal | None = None
    lump_sum: Decimal | None = None


class ContractUpdate(BaseModel):
    status: ContractStatus | None = None
    contract_period_start: date | None = None
    contract_period_end: date | None = None
    royalty_rate: Decimal | None = None
    lump_sum: Decimal | None = None


class ContractResponse(BaseModel):
    id: int
    contract_no: str
    status: ContractStatus
    application_id: int
    contract_period_start: date | None
    contract_period_end: date | None
    royalty_rate: Decimal | None
    lump_sum: Decimal | None
    file_path: str | None
    published_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
