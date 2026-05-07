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


@router.get("/init-tables")
async def init_tables():
    """신규 테이블(companies 등) 생성 — 최초 1회 실행"""
    from app.core.database import Base
    import app.models.company  # noqa: ensure model is registered
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)
    return {"ok": True, "message": "테이블 생성 완료"}


@router.get("/query-test")
async def debug_query_test():
    """applications/contracts 쿼리 직접 실행해서 오류 메시지 반환"""
    results = {}
    queries = {
        "applications_raw": "SELECT id, application_no, status FROM applications LIMIT 1",
        "contracts_raw": "SELECT id, contract_no, status FROM contracts LIMIT 1",
        "users_raw": "SELECT id, email, role FROM users LIMIT 1",
        "enum_types": (
            "SELECT typname, enumlabel FROM pg_type "
            "JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid ORDER BY typname, enumsortorder"
        ),
    }
    async with engine.connect() as conn:
        for name, sql in queries.items():
            try:
                r = await conn.execute(text(sql))
                rows = [dict(row._mapping) for row in r.fetchall()]
                results[name] = {"ok": True, "rows": rows}
            except Exception as e:
                results[name] = {"ok": False, "error": str(e)}
    return results


@router.get("/register-test")
async def debug_register_test():
    """사용자 등록 500 오류 원인 파악"""
    import traceback
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import sessionmaker
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash

    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with AsyncSessionLocal() as session:
            user = User(
                email="test-debug@test.kr",
                name="디버그테스트",
                hashed_password=get_password_hash("Test1234!"),
                role=UserRole.ADMIN,
                organization="NATI",
            )
            session.add(user)
            await session.flush()
            await session.refresh(user)
            await session.commit()
            return {"ok": True, "id": user.id, "role": user.role}
    except Exception as e:
        return {"ok": False, "error": str(e), "trace": traceback.format_exc()[-1000:]}


@router.get("/orm-test")
async def debug_orm_test():
    """SQLAlchemy ORM으로 직접 쿼리 실행"""
    import traceback
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select
    from app.models.application import Application
    from app.models.contract import Contract

    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    results = {}
    async with AsyncSessionLocal() as session:
        for name, Model in [("application", Application), ("contract", Contract)]:
            try:
                r = await session.execute(select(Model).limit(1))
                rows = r.scalars().all()
                results[name] = {"ok": True, "count": len(rows)}
            except Exception as e:
                results[name] = {"ok": False, "error": str(e), "trace": traceback.format_exc()[-800:]}
    return results
