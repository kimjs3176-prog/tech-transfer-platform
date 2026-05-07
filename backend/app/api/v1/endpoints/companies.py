from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from datetime import datetime, date
from decimal import Decimal
from typing import Optional

from app.core.database import get_db
from app.models.company import Company

router = APIRouter()


# ── 스키마 ──
class CompanyCreate(BaseModel):
    company_name: str
    business_reg_no: Optional[str] = None
    corp_reg_no: Optional[str] = None
    representative: Optional[str] = None
    established_date: Optional[date] = None
    biz_type: Optional[str] = None
    industry: Optional[str] = None
    hq_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_fax: Optional[str] = None
    homepage: Optional[str] = None
    products: Optional[str] = None
    employee_count: Optional[int] = None
    capital: Optional[Decimal] = None
    annual_revenue: Optional[Decimal] = None
    memo: Optional[str] = None


class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    business_reg_no: Optional[str] = None
    corp_reg_no: Optional[str] = None
    representative: Optional[str] = None
    established_date: Optional[date] = None
    biz_type: Optional[str] = None
    industry: Optional[str] = None
    hq_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_fax: Optional[str] = None
    homepage: Optional[str] = None
    products: Optional[str] = None
    employee_count: Optional[int] = None
    capital: Optional[Decimal] = None
    annual_revenue: Optional[Decimal] = None
    memo: Optional[str] = None
    is_active: Optional[bool] = None


class CompanyResponse(BaseModel):
    id: int
    company_name: str
    business_reg_no: Optional[str]
    corp_reg_no: Optional[str]
    representative: Optional[str]
    established_date: Optional[date]
    biz_type: Optional[str]
    industry: Optional[str]
    hq_address: Optional[str]
    company_phone: Optional[str]
    company_fax: Optional[str]
    homepage: Optional[str]
    products: Optional[str]
    employee_count: Optional[int]
    capital: Optional[Decimal]
    annual_revenue: Optional[Decimal]
    memo: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── 엔드포인트 ──
@router.get("/", response_model=list[CompanyResponse])
async def list_companies(
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """업체 목록 (키워드 검색 지원)"""
    q = select(Company).where(Company.is_active == True).offset(skip).limit(limit)
    if keyword:
        q = q.where(Company.company_name.ilike(f"%{keyword}%"))
    q = q.order_by(Company.created_at.desc())
    result = await db.scalars(q)
    return result.all()


@router.get("/stats")
async def company_stats(db: AsyncSession = Depends(get_db)):
    """업체 통계"""
    total = await db.scalar(select(func.count()).select_from(Company).where(Company.is_active == True))
    return {"total": total or 0}


@router.post("/", response_model=CompanyResponse, status_code=201)
async def create_company(payload: CompanyCreate, db: AsyncSession = Depends(get_db)):
    """업체 등록"""
    company = Company(**payload.model_dump())
    db.add(company)
    await db.flush()
    await db.refresh(company)
    return company


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: int, db: AsyncSession = Depends(get_db)):
    """업체 상세"""
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="업체를 찾을 수 없습니다.")
    return company


@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: int, payload: CompanyUpdate, db: AsyncSession = Depends(get_db)
):
    """업체 정보 수정"""
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="업체를 찾을 수 없습니다.")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(company, field, value)
    company.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(company)
    return company


@router.delete("/{company_id}", status_code=204)
async def delete_company(company_id: int, db: AsyncSession = Depends(get_db)):
    """업체 비활성화 (소프트 삭제)"""
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="업체를 찾을 수 없습니다.")
    company.is_active = False
    company.updated_at = datetime.utcnow()
    await db.flush()
