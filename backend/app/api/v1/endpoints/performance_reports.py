from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from datetime import datetime, date
from decimal import Decimal
from typing import Optional

from app.core.database import get_db
from app.models.performance import PerformanceReport
from app.models.contract import Contract

router = APIRouter()


class ReportCreate(BaseModel):
    contract_id: int
    report_year: int
    report_half: int           # 1=상반기, 2=하반기
    sales_amount: Optional[Decimal] = None
    royalty_amount: Optional[Decimal] = None
    report_date: date


class ReportResponse(BaseModel):
    id: int
    contract_id: int
    submitted_by: int
    report_year: int
    report_half: int
    sales_amount: Optional[Decimal]
    royalty_amount: Optional[Decimal]
    report_date: date
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[ReportResponse])
async def list_reports(
    contract_id: Optional[int] = None,
    year: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    q = select(PerformanceReport).offset(skip).limit(limit).order_by(
        PerformanceReport.report_year.desc(),
        PerformanceReport.report_half.desc(),
    )
    if contract_id:
        q = q.where(PerformanceReport.contract_id == contract_id)
    if year:
        q = q.where(PerformanceReport.report_year == year)
    result = await db.scalars(q)
    return result.all()


@router.get("/stats")
async def report_stats(db: AsyncSession = Depends(get_db)):
    """기술료 합계 통계"""
    total_royalty = await db.scalar(
        select(func.sum(PerformanceReport.royalty_amount))
    )
    total_sales = await db.scalar(
        select(func.sum(PerformanceReport.sales_amount))
    )
    count = await db.scalar(select(func.count()).select_from(PerformanceReport))
    return {
        "total_reports": count or 0,
        "total_royalty": float(total_royalty or 0),
        "total_sales": float(total_sales or 0),
    }


@router.post("/", response_model=ReportResponse, status_code=201)
async def create_report(payload: ReportCreate, db: AsyncSession = Depends(get_db)):
    report = PerformanceReport(
        **payload.model_dump(),
        submitted_by=1,  # TODO: 실제 인증 사용자
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int, db: AsyncSession = Depends(get_db)):
    report = await db.get(PerformanceReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="보고서를 찾을 수 없습니다.")
    return report
