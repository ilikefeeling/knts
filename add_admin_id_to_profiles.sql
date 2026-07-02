-- 1. profiles 테이블에 admin_id 컬럼 추가
-- 기존에 등록된 보조원들은 admin_id가 없으므로 NULL 허용으로 추가합니다.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. (선택사항) 기존에 등록된 보조원들에게 임시로 특정 관리자 ID를 매핑하고 싶다면 주석을 풀고 실행하세요.
-- UPDATE public.profiles SET admin_id = '관리자 UUID' WHERE role = 'WORKER' AND admin_id IS NULL;

-- 3. RLS 정책 업데이트 (필요한 경우)
-- 관리자는 자신이 생성한 보조원만 조회할 수 있도록 RLS를 강화할 수 있습니다.
-- DROP POLICY IF EXISTS "Admins can view their workers" ON profiles;
-- CREATE POLICY "Admins can view their workers" ON profiles FOR SELECT USING (role = 'WORKER' AND admin_id = auth.uid());
