import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    APPLICANT = "APPLICANT"
    MANAGER = "MANAGER"
    INSTITUTION = "INSTITUTION"
    DEPT_HEAD = "DEPT_HEAD"
    INVENTOR = "INVENTOR"
    ADMIN = "ADMIN"


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

    applications: Mapped[list["Application"]] = relationship(
        back_populates="applicant",
        foreign_keys="Application.applicant_id",
    )
    inventions: Mapped[list["Invention"]] = relationship(back_populates="inventor")
