# 기술이전계약관리 플랫폼

한국농업기술진흥원 기술이전 계약 통합 관리 시스템

## 빠른 시작

```bash
# 전체 서비스 실행
docker-compose up -d

# DB 마이그레이션
docker-compose exec backend alembic revision --autogenerate -m "init"
docker-compose exec backend alembic upgrade head
```

| 서비스 | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/v1/docs |
| MinIO | http://localhost:9001 |

## 프로젝트 구조

```
tech-transfer-platform/
├── backend/           # FastAPI (Python 3.12)
│   ├── app/
│   │   ├── api/       # REST 엔드포인트
│   │   ├── models/    # SQLAlchemy 모델
│   │   ├── schemas/   # Pydantic 스키마
│   │   ├── services/  # 비즈니스 로직 (PDF생성, KIPRIS)
│   │   └── workers/   # Celery 비동기 작업
│   └── alembic/       # DB 마이그레이션
├── frontend/          # Next.js 14 (TypeScript)
│   ├── app/           # App Router 페이지
│   ├── components/    # 공통 컴포넌트
│   └── lib/           # API 클라이언트, Zustand 스토어
└── docker-compose.yml
```

## 주요 기능

- 신청서 온라인 접수 / 반려 처리
- 계약서 자동 생성 및 PDF 출력
- 결재 워크플로 (발명자 의견 → 부서장 결재)
- 특허청 KIPRIS API 연동
- 실적 보고 대시보드
