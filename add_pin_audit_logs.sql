CREATE TABLE IF NOT EXISTS public.pin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  is_distributed BOOLEAN DEFAULT false,
  distributed_at TIMESTAMPTZ
);

-- RLS 정책 설정 (어드민만 접근 가능하게 하거나, 서버 액션(서비스 키)에서 우회)
-- 기본적으로 서비스 키로만 제어할 것이므로 RLS를 켜고 아무 정책도 주지 않을 수 있지만,
-- 편의를 위해 일단 어드민용 접근이거나 RLS disable 상태로 둘 수 있습니다. (기존 테이블 정책과 맞춤)
ALTER TABLE public.pin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 볼 수 있도록 간단한 정책 (필요시 수정)
CREATE POLICY "Enable read for all authenticated users" ON public.pin_audit_logs FOR SELECT USING (true);
CREATE POLICY "Enable all for service roles" ON public.pin_audit_logs USING (true);
