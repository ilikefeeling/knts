-- 보조원 업무 배정 이력 관리 테이블
CREATE TABLE IF NOT EXISTS assignment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES task_ledger(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- 'ASSIGN', 'UNASSIGN', 'REASSIGN'
    previous_worker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    remarks TEXT
);

-- RLS 정책 설정
ALTER TABLE assignment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own assignment logs" ON assignment_logs
    FOR SELECT USING (auth.uid() = admin_id);

CREATE POLICY "Admins can insert assignment logs" ON assignment_logs
    FOR INSERT WITH CHECK (auth.uid() = admin_id);
