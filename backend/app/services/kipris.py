import httpx
import xml.etree.ElementTree as ET
from app.core.config import settings


def _parse_xml_items(xml_text: str) -> list[dict]:
    """KIPRIS XML 응답 → 딕셔너리 리스트 파싱"""
    try:
        root = ET.fromstring(xml_text)
        items: list[dict] = []
        for item in root.iter("item"):
            data: dict[str, str | None] = {}
            for child in item:
                data[child.tag] = child.text
            if data:
                items.append(data)
        return items
    except ET.ParseError:
        return []


def _normalize_patent(raw: dict) -> dict:
    """KIPRIS 원시 필드 → 플랫폼 표준 필드로 정규화"""
    # 발명자는 세미콜론 또는 쉼표로 구분된 문자열인 경우가 많음
    inventors_raw = raw.get("inventorName") or raw.get("inventor") or ""
    inventors = [n.strip() for n in inventors_raw.replace(";", ",").split(",") if n.strip()]

    return {
        "application_number": raw.get("applicationNumber") or raw.get("applno"),
        "registration_number": raw.get("registerNumber") or raw.get("regNo"),
        "title": raw.get("inventionTitle") or raw.get("title") or "",
        "applicant": raw.get("applicantName") or raw.get("applicant") or "",
        "inventors": inventors,
        "inventors_raw": inventors_raw,
        "application_date": raw.get("applicationDate") or raw.get("applDate"),
        "registration_date": raw.get("registerDate") or raw.get("regDate"),
        "ipc": raw.get("ipcNumber") or raw.get("ipc") or "",
        "abstract": raw.get("astrtCont") or raw.get("abstract") or "",
        "status": raw.get("applicationStatus") or "",
    }


async def search_patents(keyword: str, page: int = 1, per_page: int = 10) -> dict:
    """KIPRIS 키워드/제목 특허 검색"""
    if not settings.KIPRIS_API_KEY:
        return {"results": [], "total": 0, "error": "KIPRIS API 키가 설정되지 않았습니다."}

    url = f"{settings.KIPRIS_API_URL}/patUtiModInfoSearchSevice/wordSearchInfo"
    params = {
        "word": keyword,
        "ServiceKey": settings.KIPRIS_API_KEY,
        "numOfRows": per_page,
        "pageNo": page,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            raw_items = _parse_xml_items(resp.text)
            normalized = [_normalize_patent(item) for item in raw_items]

            # 전체 건수 추출
            try:
                root = ET.fromstring(resp.text)
                total_el = root.find(".//totalCount")
                total = int(total_el.text) if total_el is not None and total_el.text else len(raw_items)
            except Exception:
                total = len(raw_items)

            return {"results": normalized, "total": total}
        except httpx.HTTPError as e:
            return {"results": [], "total": 0, "error": str(e)}


async def fetch_patent_by_number(patent_no: str) -> dict | None:
    """출원번호 또는 등록번호로 특허 상세 정보 조회"""
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
            items = _parse_xml_items(resp.text)
            if not items:
                return None
            return _normalize_patent(items[0])
        except httpx.HTTPError:
            return None


# 하위 호환 유지
async def fetch_patent_info(patent_no: str) -> dict | None:
    return await fetch_patent_by_number(patent_no)
