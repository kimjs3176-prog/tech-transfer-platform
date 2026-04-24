import enum
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ApplicationStatus(str, enum.Enum):
    WAITING = "WAITING"
    RECEIVED = "RECEIVED"
    REVIEWING = "REVIEWING"
    PATENT_CHECK = "PATENT_CHECK"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CONTRACT_DRAFT = "CONTRACT_DRAFT"
    COMPLETED = "COMPLETED"


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_no: Mapped[str] = mapped_column(String(30), unique=True, index=True)  # 접수번호
    applicant_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[ApplicationStatus] = mapped_column(String(30), default=ApplicationStatus.WAITING)

    # 기술이전 신청 내용
    technology_name: Mapped[str] = mapped_column(String(500))
    patent_no: Mapped[str | None] = mapped_column(String(100))        # 특허번호
    transfer_type: Mapped[str] = mapped_column(String(50))            # 전용실시/통상실시/양도
    purpose: Mapped[str] = mapped_column(Text)
    extra_data: Mapped[dict | None] = mapped_column(JSON)             # 유연한 추가 항목

    rejection_reason: Mapped[str | None] = mapped_column(Text)
    manager_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applicant: Mapped["User"] = relationship(back_populates="applications", foreign_keys=[applicant_id])
    contract: Mapped["Contract | None"] = relationship(back_populates="application")
