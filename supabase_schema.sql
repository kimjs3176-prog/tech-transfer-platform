-- 기술이전계약관리 플랫폼 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. ENUM 타입
CREATE TYPE user_role AS ENUM ('applicant','manager','institution','dept_head','inventor','admin');
CREATE TYPE application_status AS ENUM ('waiting','received','reviewing','patent_check','approved','rejected','contract_draft','completed');
CREATE TYPE contract_status AS ENUM ('draft','inventor_review','dept_approval','registered','published');
CREATE TYPE approval_step AS ENUM ('inventor_opinion','opinion_review','dept_head','final');
CREATE TYPE approval_result AS ENUM ('pending','approved','rejected');

-- 2. 사용자
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role        user_role NOT NULL DEFAULT 'applicant',
    organization VARCHAR(200),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

-- 3. 발명 정보
CREATE TABLE IF NOT EXISTS inventions (
    id          SERIAL PRIMARY KEY,
    inventor_id INTEGER NOT NULL REFERENCES users(id),
    patent_no   VARCHAR(100),
    title       VARCHAR(500) NOT NULL,
    abstract    TEXT,
    kipris_data TEXT,
    inventor_opinion TEXT,
    opinion_submitted_at TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_inventions_patent_no ON inventions(patent_no);

-- 4. 신청서
CREATE TABLE IF NOT EXISTS applications (
    id              SERIAL PRIMARY KEY,
    application_no  VARCHAR(30) UNIQUE NOT NULL,
    applicant_id    INTEGER NOT NULL REFERENCES users(id),
    status          application_status NOT NULL DEFAULT 'waiting',
    technology_name VARCHAR(500) NOT NULL,
    patent_no       VARCHAR(100),
    transfer_type   VARCHAR(50) NOT NULL,
    purpose         TEXT NOT NULL,
    extra_data      JSONB,
    rejection_reason TEXT,
    manager_id      INTEGER REFERENCES users(id),
    -- 발명자 배정 (KIPRIS 발명인 기준 회원 검색 후 배정)
    assigned_inventor_id INTEGER REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
-- 기존 테이블에 컬럼 추가 (이미 생성된 경우)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS assigned_inventor_id INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS ix_applications_application_no ON applications(application_no);

-- 5. 계약서
CREATE TABLE IF NOT EXISTS contracts (
    id              SERIAL PRIMARY KEY,
    contract_no     VARCHAR(30) UNIQUE NOT NULL,
    application_id  INTEGER UNIQUE NOT NULL REFERENCES applications(id),
    invention_id    INTEGER REFERENCES inventions(id),
    status          contract_status NOT NULL DEFAULT 'draft',
    contract_period_start DATE,
    contract_period_end   DATE,
    royalty_rate    NUMERIC(5,2),
    lump_sum        NUMERIC(15,0),
    file_path       VARCHAR(500),
    published_at    TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_contracts_contract_no ON contracts(contract_no);

-- 6. 결재
CREATE TABLE IF NOT EXISTS approvals (
    id          SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    step        approval_step NOT NULL,
    step_order  INTEGER NOT NULL,
    approver_id INTEGER REFERENCES users(id),
    result      approval_result NOT NULL DEFAULT 'pending',
    comment     TEXT,
    processed_at TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 7. 실적 보고
CREATE TABLE IF NOT EXISTS performance_reports (
    id          SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    submitted_by INTEGER NOT NULL REFERENCES users(id),
    report_year  INTEGER NOT NULL,
    report_half  INTEGER NOT NULL,
    sales_amount NUMERIC(15,0),
    royalty_amount NUMERIC(15,0),
    report_date  DATE NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 완료 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
