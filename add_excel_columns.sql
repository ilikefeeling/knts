-- 1. master_ledger 테이블 컬럼 추가
ALTER TABLE public.master_ledger 
ADD COLUMN IF NOT EXISTS management_num VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS taxpayer_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS id_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR(100);

-- 2. task_ledger 테이블 컬럼 추가
-- (기존에 추가되었던 arrears_amount, tax_item, occurred_date가 없으면 추가합니다)
ALTER TABLE public.task_ledger 
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS tax_item VARCHAR(255),
ADD COLUMN IF NOT EXISTS occurred_date VARCHAR(50),
ADD COLUMN IF NOT EXISTS arrears_amount VARCHAR(50),
ADD COLUMN IF NOT EXISTS arrears_count VARCHAR(20),
ADD COLUMN IF NOT EXISTS seizure_details TEXT,
ADD COLUMN IF NOT EXISTS notice_sent VARCHAR(20),
ADD COLUMN IF NOT EXISTS installment_status VARCHAR(20);

-- 추가적인 인덱스 생성 (고유 관리 번호로 빠른 검색을 위해)
CREATE INDEX IF NOT EXISTS idx_master_ledger_management_num ON public.master_ledger(management_num);
