import enum
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ApprovalStep(str, enum.Enum):
    INVENTOR_OPINION = "inventor_opinion"   # 발명자 의견 작성
    OPINION_REVIEW = "opinion_review"       # 의견 검토
    DEPT_HEAD = "dept_head"                 # 부서장 결재
    FINAL = "final"                         # 최종 승인


class ApprovalResult(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"))
    step: Mapped[ApprovalStep] = mapped_column(String(30))
    step_order: Mapped[int] = mapped_column(Integer)
    approver_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    result: Mapped[ApprovalResult] = mapped_column(String(20), default=ApprovalResult.PENDING)
    comment: Mapped[str | None] = mapped_column(Text)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    contract: Mapped["Contract"] = relationship(back_populates="approvals")
