from app.workers.celery_app import celery_app

STEP_MESSAGES = {
    "inventor_opinion":       ("기술이전 계약 의견 작성 요청", "기술이전 계약서에 대한 발명자 의견을 작성해주세요."),
    "inventor_opinion_retry": ("기술이전 의견 재작성 요청",   "담당자 검토 결과 의견 재작성이 필요합니다."),
    "opinion_review":         ("발명자 의견 검토 요청",        "발명자 의견이 제출되었습니다. 검토 후 부서장 결재를 요청해주세요."),
    "review_retry":           ("계약서 의견 재검토 요청",      "부서장 반려 처리로 의견 재검토가 필요합니다."),
    "dept_head":              ("기술이전 계약 부서장 결재 요청", "계약서 검토가 완료되었습니다. 최종 결재를 진행해주세요."),
    "registered":             ("기술이전 계약 등록 완료",       "계약서 결재가 완료되어 등록되었습니다. 계약서를 출력하실 수 있습니다."),
}


@celery_app.task(name="send_approval_notification")
def send_approval_notification(contract_id: int, step: str, recipient_email: str):
    subject, body = STEP_MESSAGES.get(step, ("결재 알림", "결재 상태가 변경되었습니다."))
    # TODO: uWise 메일 API 연동
    print(f"[메일발송] To={recipient_email} | Subject={subject} | Contract={contract_id}")
    print(f"          Body: {body}")


@celery_app.task(name="generate_performance_summary")
def generate_performance_summary(year: int, half: int):
    print(f"[실적집계] {year}년 {half}반기 집계 시작")
