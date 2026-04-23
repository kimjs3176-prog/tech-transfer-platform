import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router
import app.models  # noqa: F401 — 모든 모델 임포트 (create_all 인식용)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작 시 테이블 자동 생성
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[startup] DB 테이블 생성 완료")
    except Exception as e:
        # 연결 실패 시에도 앱은 기동 — 개별 요청에서 에러 반환
        print("[startup] DB 연결 실패 (요청 시 재시도):", e)
    yield


app = FastAPI(
    lifespan=lifespan,
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
)

# experimentalServices: 프론트(/)와 백엔드(/_/backend)는 동일 도메인
# → 브라우저 same-origin 요청이므로 CORS 불필요
# 로컬 개발 및 외부 클라이언트를 위해 허용 목록 유지
_vercel_url = os.getenv("VERCEL_URL", "")
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    f"https://{_vercel_url}" if _vercel_url else "",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ALLOWED_ORIGINS if o],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.VERSION}
