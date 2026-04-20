import os
from pydantic_settings import BaseSettings


def _db_url() -> str:
    """Vercel Postgres(POSTGRES_URL) 또는 로컬 DATABASE_URL 자동 감지"""
    url = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL", "")
    if not url:
        return "postgresql+asyncpg://postgres:postgres@localhost:5432/tech_transfer"
    # Vercel Postgres는 postgres:// 스킴 → asyncpg용으로 변환
    url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    # Vercel Postgres 풀링 파라미터 추가
    if "sslmode" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}ssl=require"
    return url


class Settings(BaseSettings):
    PROJECT_NAME: str = "기술이전계약관리 플랫폼"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # DB — Vercel: POSTGRES_URL / 로컬: DATABASE_URL
    DATABASE_URL: str = _db_url()

    # Redis — Vercel KV: KV_URL / 로컬: REDIS_URL
    REDIS_URL: str = os.getenv("KV_URL") or os.getenv("REDIS_URL", "redis://localhost:6379/0")

    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8

    # Vercel Blob — 파일 저장 (MinIO 대체)
    BLOB_READ_WRITE_TOKEN: str = os.getenv("BLOB_READ_WRITE_TOKEN", "")

    # 특허청 KIPRIS API
    KIPRIS_API_KEY: str = os.getenv("KIPRIS_API_KEY", "")
    KIPRIS_API_URL: str = "http://plus.kipris.or.kr/openapi/rest"

    class Config:
        env_file = ".env"


settings = Settings()
