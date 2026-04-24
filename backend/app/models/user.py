import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    APPLICANT = "applicant"        # 신청자 (NATI)
    MANAGER = "manager"            # 한국농업기술진흥원 담당자
    INSTITUTION = "institution"    # 소속기관 담당자
    DEPT_HEAD = "dept_head"        # 부서장
    INVENTOR = "inventor"          # 발명자
    ADMIN = "admin"                # 시스템 관리자


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(String(20), default=UserRole.APPLICANT)
    organization: Mapped[str | None] = mapped_column(String(200))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    applications: Mapped[list["Application"]] = relationship(back_populates="applicant")
    inventions: Mapped[list["Invention"]] = relationship(back_populates="inventor")
