"""임시 디버그 엔드포인트 — 배포 안정화 후 제거"""
import os
from fastapi import APIRouter
from sqlalchemy import text

from app.core.database import engine
from app.core.config import settings

router = APIRouter()


@router.get("/db")
async def debug_db():
    """DB 연결 상태 및 오류 메시지 반환"""
    raw = (
        os.getenv("POSTGRES_URL_NON_POOLING")
        or os.getenv("POSTGRES_URL")
        or "NOT_SET"
    )
    # URL 마스킹 (비밀번호 숨김)
    masked = raw[:30] + "***" if len(raw) > 30 else raw

    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT current_database(), version()"))
            row = result.fetchone()
            return {
                "status": "connected",
                "database": row[0],
                "pg_version": row[1][:40],
                "url_prefix": masked,
                "final_url": settings.DATABASE_URL[:50] + "***",
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "url_prefix": masked,
            "final_url": settings.DATABASE_URL[:50] + "***",
        }


@router.get("/tables")
async def debug_tables():
    """생성된 테이블 목록 확인"""
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema='public' ORDER BY table_name"
            ))
            tables = [r[0] for r in result.fetchall()]
            return {"tables": tables, "count": len(tables)}
    except Exception as e:
        return {"error": str(e)}
