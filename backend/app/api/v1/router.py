from fastapi import APIRouter

from app.api.v1.endpoints import auth, applications, contracts, dashboard, approvals, debug, patents, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["인증"])
api_router.include_router(applications.router, prefix="/applications", tags=["신청 관리"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["계약 관리"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["결재 워크플로"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["대시보드"])
api_router.include_router(patents.router, prefix="/patents", tags=["특허 검색 (KIPRIS)"])
api_router.include_router(users.router, prefix="/users", tags=["사용자 관리"])
api_router.include_router(debug.router, prefix="/debug", tags=["디버그"])
