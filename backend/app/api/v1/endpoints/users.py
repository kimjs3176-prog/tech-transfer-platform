from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse

router = APIRouter()


@router.get("/search", response_model=list[UserResponse])
async def search_users(
    name: str = Query(..., min_length=1, description="이름 검색어"),
    role: UserRole | None = Query(None, description="역할 필터 (예: INVENTOR)"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """이름으로 사용자 검색 (발명자 배정용)"""
    q = select(User).where(
        User.is_active == True,
        User.name.ilike(f"%{name}%"),
    )
    if role:
        q = q.where(User.role == role)
    q = q.order_by(User.name).limit(limit)
    result = await db.scalars(q)
    return result.all()


@router.get("/inventors", response_model=list[UserResponse])
async def list_inventors(
    names: str = Query(..., description="발명자 이름 목록 (쉼표 구분)"),
    db: AsyncSession = Depends(get_db),
):
    """KIPRIS 발명인 이름 목록 기반으로 가입된 회원 검색"""
    name_list = [n.strip() for n in names.split(",") if n.strip()]
    if not name_list:
        return []

    # 각 이름에 대해 LIKE 조건 OR 검색
    from sqlalchemy import or_
    conditions = [User.name.ilike(f"%{n}%") for n in name_list]
    q = (
        select(User)
        .where(User.is_active == True, or_(*conditions))
        .order_by(User.name)
        .limit(50)
    )
    result = await db.scalars(q)
    return result.all()
