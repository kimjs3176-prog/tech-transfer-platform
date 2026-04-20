from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.contract import Contract, ContractStatus

router = APIRouter()


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """절차도 수치 기반 대시보드 통계"""

    app_counts = await db.execute(
        select(Application.status, func.count()).group_by(Application.status)
    )
    contract_counts = await db.execute(
        select(Contract.status, func.count()).group_by(Contract.status)
    )

    apps = {row[0]: row[1] for row in app_counts}
    cons = {row[0]: row[1] for row in contract_counts}

    return {
        "applications": {
            "waiting": apps.get(ApplicationStatus.WAITING, 0),
            "received": apps.get(ApplicationStatus.RECEIVED, 0),
            "rejected": apps.get(ApplicationStatus.REJECTED, 0),
            "total": sum(apps.values()),
        },
        "contracts": {
            "draft": cons.get(ContractStatus.DRAFT, 0),
            "registered": cons.get(ContractStatus.REGISTERED, 0),
            "published": cons.get(ContractStatus.PUBLISHED, 0),
            "total": sum(cons.values()),
        },
    }
