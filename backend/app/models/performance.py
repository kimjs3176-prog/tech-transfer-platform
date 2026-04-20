from datetime import datetime, date
from sqlalchemy import String, DateTime, ForeignKey, Date, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal

from app.core.database import Base


class PerformanceReport(Base):
    __tablename__ = "performance_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"))
    submitted_by: Mapped[int] = mapped_column(ForeignKey("users.id"))

    report_year: Mapped[int] = mapped_column(Integer)
    report_half: Mapped[int] = mapped_column(Integer)   # 1: 상반기, 2: 하반기

    sales_amount: Mapped[Decimal | None] = mapped_column(Numeric(15, 0))   # 매출액
    royalty_amount: Mapped[Decimal | None] = mapped_column(Numeric(15, 0)) # 실시료
    report_date: Mapped[date] = mapped_column(Date)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    contract: Mapped["Contract"] = relationship(back_populates="performance_reports")
