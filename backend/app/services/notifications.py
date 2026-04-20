"""
알림 서비스 — Celery 대신 FastAPI BackgroundTasks 사용
Vercel 서버리스에서는 별도 워커 프로세스를 띄울 수 없으므로
동일 요청 수명주기 안에서 백그라운드 작업으로 처리
"""
import httpx
from app.core.config import settings

STEP_MESSAGES = {
    "inventor_opinion":       ("기술이전 계약 의견 작성 요청",    "기술이전 계약서에 대한 발명자 의견을 작성해주세요."),
    "inventor_opinion_retry": ("기술이전 의견 재작성 요청",       "담당자 검토 결과 의견 재작성이 필요합니다."),
    "opinion_review":         ("발명자 의견 검토 요청",           "발명자 의견이 제출되었습니다. 검토 후 부서장 결재를 요청해주세요."),
    "review_retry":           ("계약서 의견 재검토 요청",         "부서장 반려 처리로 의견 재검토가 필요합니다."),
    "dept_head":              ("기술이전 계약 부서장 결재 요청",   "계약서 검토가 완료되었습니다. 최종 결재를 진행해주세요."),
    "registered":             ("기술이전 계약 등록 완료",          "계약서 결재가 완료되어 등록되었습니다. 계약서를 출력하실 수 있습니다."),
}


async def send_approval_notification(contract_id: int, step: str, recipient_email: str):
    """결재 단계 변경 알림 (비동기 백그라운드 실행)"""
    subject, body = STEP_MESSAGES.get(step, ("결재 알림", "결재 상태가 변경되었습니다."))

    # TODO: 실제 메일 발송 API 연동 (uWise / SendGrid 등)
    print(f"[알림] To={recipient_email} | {subject} | Contract={contract_id}")
    print(f"       {body}")
