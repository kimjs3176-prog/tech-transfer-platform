import os
from pydantic_settings import BaseSettings


def _clean_db_url(url: str) -> str:
    """asyncpg 비호환 파라미터 제거 및 스킴/SSL 정규화"""
    from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

    # 스킴 변환
    url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    parsed = urlparse(url)
    params = parse_qs(parsed.query, keep_blank_values=True)

    # asyncpg 비호환 파라미터 모두 제거 (SSL은 connect_args로 별도 처리)
    for bad in ("pgbouncer", "sslmode", "ssl", "connect_timeout"):
        params.pop(bad, None)

    new_query = urlencode({k: v[0] for k, v in params.items()})
    clean = urlunparse(parsed._replace(query=new_query))
    return clean


def _db_url() -> str:
    """Supabase / Vercel Postgres / 로컬 DATABASE_URL 자동 감지"""
    # NON_POOLING 우선 (pgbouncer 없는 직접 연결 — asyncpg 호환)
    raw = (
        os.getenv("POSTGRES_URL_NON_POOLING")
        or os.getenv("POSTGRES_URL")
        or os.getenv("DATABASE_URL", "")
    )
    if not raw:
        return "postgresql+asyncpg://postgres:postgres@localhost:5432/tech_transfer"
    return _clean_db_url(raw)


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
