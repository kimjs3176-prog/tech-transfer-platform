"""
Vercel Blob 파일 저장 서비스 (MinIO 대체)
로컬 개발 시에는 /tmp 임시 저장소 사용
"""
import os
import httpx
from app.core.config import settings


async def upload_pdf(filename: str, content: bytes) -> str:
    """PDF를 Vercel Blob에 업로드하고 URL 반환"""
    token = settings.BLOB_READ_WRITE_TOKEN

    if not token:
        # 로컬 개발: /tmp 에 저장
        path = f"/tmp/{filename}"
        with open(path, "wb") as f:
            f.write(content)
        return path

    async with httpx.AsyncClient() as client:
        resp = await client.put(
            f"https://blob.vercel-storage.com/{filename}",
            content=content,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/pdf",
                "x-content-type": "application/pdf",
            },
        )
        resp.raise_for_status()
        return resp.json()["url"]


async def get_download_url(file_path: str) -> str:
    """저장된 파일의 다운로드 URL 반환"""
    if file_path.startswith("/tmp"):
        return file_path
    return file_path  # Vercel Blob URL은 그대로 공개 URL
