from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core.database import get_db
from app.models.application import Application, ApplicationStatus
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse

router = APIRouter()


def _generate_application_no() -> str:
    return f"APP-{datetime.now().strftime('%Y%m%d%H%M%S')}"


@router.post("/", response_model=ApplicationResponse, status_code=201)
async def create_application(payload: ApplicationCreate, db: AsyncSession = Depends(get_db)):
    app = Application(
        application_no=_generate_application_no(),
        applicant_id=1,  # TODO: 실제 인증 사용자로 교체
        **payload.model_dump(),
    )
    db.add(app)
    await db.flush()
    await db.refresh(app)
    return app


@router.get("/", response_model=list[ApplicationResponse])
async def list_applications(
    status: ApplicationStatus | None = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    q = select(Application).offset(skip).limit(limit).order_by(Application.created_at.desc())
    if status:
        q = q.where(Application.status == status)
    result = await db.scalars(q)
    return result.all()


@router.get("/{app_id}", response_model=ApplicationResponse)
async def get_application(app_id: int, db: AsyncSession = Depends(get_db)):
    app = await db.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="신청서를 찾을 수 없습니다.")
    return app


@router.patch("/{app_id}", response_model=ApplicationResponse)
async def update_application(app_id: int, payload: ApplicationUpdate, db: AsyncSession = Depends(get_db)):
    app = await db.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="신청서를 찾을 수 없습니다.")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(app, field, value)
    await db.flush()
    await db.refresh(app)
    return app


@router.post("/{app_id}/reject", response_model=ApplicationResponse)
async def reject_application(app_id: int, reason: str, db: AsyncSession = Depends(get_db)):
    app = await db.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="신청서를 찾을 수 없습니다.")
    app.status = ApplicationStatus.REJECTED
    app.rejection_reason = reason
    await db.flush()
    await db.refresh(app)
    return app
