import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router


app = FastAPI(
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
