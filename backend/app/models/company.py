from datetime import datetime, date
from sqlalchemy import String, DateTime, Date, Text, Boolean, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from decimal import Decimal

from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_name: Mapped[str] = mapped_column(String(200), index=True)
    business_reg_no: Mapped[str | None] = mapped_column(String(20))
    corp_reg_no: Mapped[str | None] = mapped_column(String(20))
    representative: Mapped[str | None] = mapped_column(String(100))
    established_date: Mapped[date | None] = mapped_column(Date)
    biz_type: Mapped[str | None] = mapped_column(String(100))   # 업태
    industry: Mapped[str | None] = mapped_column(String(100))   # 업종
    hq_address: Mapped[str | None] = mapped_column(Text)
    company_phone: Mapped[str | None] = mapped_column(String(20))
    company_fax: Mapped[str | None] = mapped_column(String(20))
    homepage: Mapped[str | None] = mapped_column(String(200))
    products: Mapped[str | None] = mapped_column(Text)          # 생산품목
    employee_count: Mapped[int | None] = mapped_column(Integer)  # 임직원수
    capital: Mapped[Decimal | None] = mapped_column(Numeric(15, 0))  # 자본금
    annual_revenue: Mapped[Decimal | None] = mapped_column(Numeric(15, 0))  # 연매출
    memo: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
