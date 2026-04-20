import httpx
from app.core.config import settings


async def fetch_patent_info(patent_no: str) -> dict | None:
    """특허청 KIPRIS API로 특허 정보 조회"""
    if not settings.KIPRIS_API_KEY:
        return None

    url = f"{settings.KIPRIS_API_URL}/patUtiModInfoSearchSevice/patentUtilityInfo"
    params = {
        "applicationNumber": patent_no,
        "ServiceKey": settings.KIPRIS_API_KEY,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError:
            return None
