import enum
from datetime import datetime, date
from sqlalchemy import String, DateTime, ForeignKey, Text, Date, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal

from app.core.database import Base


class ContractStatus(str, enum.Enum):
    DRAFT = "draft"                  # 계약서 작성
    INVENTOR_REVIEW = "inventor_review"  # 발명자 의견 검토
    DEPT_APPROVAL = "dept_approval"  # 부서장 결재
    REGISTERED = "registered"        # 계약서 등록
    PUBLISHED = "published"          # 계약서 출력 완료


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_no: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), unique=True)
    invention_id: Mapped[int | None] = mapped_column(ForeignKey("inventions.id"))
    status: Mapped[ContractStatus] = mapped_column(String(30), default=ContractStatus.DRAFT)

    # 계약 조건
    contract_period_start: Mapped[date | None] = mapped_column(Date)
    contract_period_end: Mapped[date | None] = mapped_column(Date)
    royalty_rate: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))   # 실시료율 (%)
    lump_sum: Mapped[Decimal | None] = mapped_column(Numeric(15, 0))      # 일시불

    # 파일 저장 (MinIO)
    file_path: Mapped[str | None] = mapped_column(String(500))
    published_at: Mapped[datetime | None] = mapped_column(DateTime)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    application: Mapped["Application"] = relationship(back_populates="contract")
    invention: Mapped["Invention | None"] = relationship()
    approvals: Mapped[list["Approval"]] = relationship(back_populates="contract")
    performance_reports: Mapped[list["PerformanceReport"]] = relationship(back_populates="contract")
