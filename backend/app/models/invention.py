from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Invention(Base):
    __tablename__ = "inventions"

    id: Mapped[int] = mapped_column(primary_key=True)
    inventor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    patent_no: Mapped[str | None] = mapped_column(String(100), index=True)
    title: Mapped[str] = mapped_column(String(500))
    abstract: Mapped[str | None] = mapped_column(Text)

    # 특허청 KIPRIS 연동 데이터 (JSON 캐시)
    kipris_data: Mapped[str | None] = mapped_column(Text)

    # 발명자 의견 (계약 조건에 대한)
    inventor_opinion: Mapped[str | None] = mapped_column(Text)
    opinion_submitted_at: Mapped[datetime | None] = mapped_column(DateTime)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    inventor: Mapped["User"] = relationship(back_populates="inventions")
