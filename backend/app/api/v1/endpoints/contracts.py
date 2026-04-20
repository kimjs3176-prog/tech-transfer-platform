from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import io

from app.core.database import get_db
from app.models.contract import Contract, ContractStatus
from app.schemas.contract import ContractCreate, ContractUpdate, ContractResponse
from app.services.contract_generator import generate_contract_pdf
from app.services.blob_storage import upload_pdf

router = APIRouter()


def _generate_contract_no() -> str:
    return f"CON-{datetime.now().strftime('%Y%m%d%H%M%S')}"


@router.post("/", response_model=ContractResponse, status_code=201)
async def create_contract(payload: ContractCreate, db: AsyncSession = Depends(get_db)):
    contract = Contract(
        contract_no=_generate_contract_no(),
        **payload.model_dump(),
    )
    db.add(contract)
    await db.flush()
    await db.refresh(contract)
    return contract


@router.get("/", response_model=list[ContractResponse])
async def list_contracts(
    status: ContractStatus | None = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    q = select(Contract).offset(skip).limit(limit).order_by(Contract.created_at.desc())
    if status:
        q = q.where(Contract.status == status)
    result = await db.scalars(q)
    return result.all()


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(contract_id: int, db: AsyncSession = Depends(get_db)):
    contract = await db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="계약서를 찾을 수 없습니다.")
    return contract


@router.patch("/{contract_id}", response_model=ContractResponse)
async def update_contract(contract_id: int, payload: ContractUpdate, db: AsyncSession = Depends(get_db)):
    contract = await db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="계약서를 찾을 수 없습니다.")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(contract, field, value)
    await db.flush()
    await db.refresh(contract)
    return contract


@router.get("/{contract_id}/download")
async def download_contract(contract_id: int, db: AsyncSession = Depends(get_db)):
    contract = await db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="계약서를 찾을 수 없습니다.")

    pdf_bytes = await generate_contract_pdf(contract)
    filename = f"{contract.contract_no}.pdf"

    # Vercel Blob에 업로드 후 URL 반환 (로컬은 스트리밍)
    file_url = await upload_pdf(filename, pdf_bytes)

    contract.published_at = datetime.utcnow()
    contract.status = ContractStatus.PUBLISHED
    contract.file_path = file_url

    if file_url.startswith("http"):
        return RedirectResponse(url=file_url)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
