-- 1. 캠페인(작업 원장) 테이블 생성
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 통합 원장(마스터) 테이블 생성
CREATE TABLE master_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL, -- 암호화된 이름
    phone TEXT, -- 전화번호 (검색용, 로그인 ID 등)
    address TEXT, -- 암호화된 주소
    detail_address TEXT, -- 암호화된 상세 주소
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 관리 대장(할당 작업) 테이블 생성
CREATE TABLE task_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    master_id UUID NOT NULL REFERENCES master_ledger(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    assigned_worker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    current_status TEXT DEFAULT 'UNASSIGNED',
    failed_visit_count INTEGER DEFAULT 0,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_ledger ENABLE ROW LEVEL SECURITY;

-- 관리자 RLS: 자신의 데이터만 접근 가능
CREATE POLICY "Admins can view their own campaigns" ON campaigns FOR ALL USING (auth.uid() = admin_id);
CREATE POLICY "Admins can view their own master ledger" ON master_ledger FOR ALL USING (auth.uid() = admin_id);
CREATE POLICY "Admins can view their own task ledger" ON task_ledger FOR ALL USING (auth.uid() = admin_id);

-- 보조원 RLS: 자신에게 배정된 task_ledger만 접근 가능
CREATE POLICY "Workers can view assigned tasks" ON task_ledger FOR SELECT USING (auth.uid() = assigned_worker_id);
CREATE POLICY "Workers can update assigned tasks" ON task_ledger FOR UPDATE USING (auth.uid() = assigned_worker_id);

-- 보조원은 master_ledger를 직접 볼 수 없으나, task_ledger를 조회할 때 join을 위해 권한 부여 필요
-- (단, 자신에게 배정된 task_ledger를 통해서만 볼 수 있도록 필터링)
CREATE POLICY "Workers can view assigned master info" ON master_ledger FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM task_ledger 
    WHERE task_ledger.master_id = master_ledger.id 
    AND task_ledger.assigned_worker_id = auth.uid()
  )
);
