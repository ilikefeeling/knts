-- 1. SECURITY DEFINER 함수 생성 (RLS 무한 루프 방지)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. 기존 무한 루프 유발 정책 삭제
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage target_ledger" ON target_ledger;
DROP POLICY IF EXISTS "Admins can manage visit_records" ON visit_records;

-- 3. 새로운 함수(is_admin)를 사용한 정책 생성
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  public.is_admin()
);

CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (
  public.is_admin()
);

CREATE POLICY "Admins can manage target_ledger" ON target_ledger FOR ALL USING (
  public.is_admin()
);

CREATE POLICY "Admins can manage visit_records" ON visit_records FOR ALL USING (
  public.is_admin()
);
