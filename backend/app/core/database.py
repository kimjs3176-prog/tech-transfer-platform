import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Supabase / Vercel Postgres: asyncpg는 SSL을 connect_args로 전달
_is_remote = any(
    os.getenv(k) for k in ("POSTGRES_URL", "POSTGRES_URL_NON_POOLING", "DATABASE_URL")
    if os.getenv(k, "").startswith(("postgres://", "postgresql://"))
)
_connect_args = {"ssl": "require"} if _is_remote else {}

engine = create_async_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,
    connect_args=_connect_args,
    echo=False,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
