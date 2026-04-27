from fastapi import APIRouter, Query, HTTPException

from app.services.kipris import search_patents, fetch_patent_by_number

router = APIRouter()


@router.get("/search")
async def search_patent(
    q: str = Query(..., min_length=1, description="검색 키워드 (발명의 명칭)"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
):
    """KIPRIS API로 특허 키워드 검색"""
    result = await search_patents(q, page=page, per_page=per_page)
    return result


@router.get("/{patent_no}")
async def get_patent(patent_no: str):
    """출원번호/등록번호로 특허 상세 정보 조회"""
    data = await fetch_patent_by_number(patent_no)
    if data is None:
        raise HTTPException(status_code=404, detail="해당 특허를 찾을 수 없습니다.")
    return {"data": data}
