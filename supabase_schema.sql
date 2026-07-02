-- ============================================================================
-- KNTS (국세외수입 체납관리단) 통합 데이터베이스 스키마
-- (해당 코드를 복사하여 Supabase SQL Editor에서 한 번에 실행하시면 됩니다)
-- ============================================================================

-- --------------------------------------------------------
-- 1. 프로필 (Profiles) 테이블 - 보조원 및 관리자 계정 정보
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'WORKER' CHECK (role IN ('ADMIN', 'WORKER')),
  name TEXT,
  phone TEXT,
  status TEXT DEFAULT 'ACTIVE',
  cumulative_processed_count INTEGER DEFAULT 0,
  is_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- 2. 체납 원장 (Target Ledger) 테이블
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.target_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  detail_address TEXT,
  current_status TEXT DEFAULT 'UNASSIGNED',
  assigned_worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  failed_visit_count INTEGER DEFAULT 0,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.target_ledger ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- 3. 방문 기록 (Visit Records) 테이블
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.visit_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ledger_id UUID REFERENCES public.target_ledger(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES auth.users(id) NOT NULL,
  scheduled_date DATE,
  status TEXT DEFAULT 'UNVISITED',
  unvisited_reason TEXT,
  worker_memo TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.visit_records ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- 4. 공지사항 (Notices) 및 읽음 확인 (Notice Reads) 테이블
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notice_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id UUID REFERENCES public.notices(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES auth.users(id) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notice_id, worker_id)
);

ALTER TABLE public.notice_reads ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- 5. 단축어 공유 (Shared Texts) 임시 저장 테이블
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shared_texts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  text TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.shared_texts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 보안 정책 (Row Level Security & Functions)
-- ============================================================================

-- RLS 무한 루프 방지를 위한 관리자 확인 함수
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profiles 정책
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Target Ledger 정책
CREATE POLICY "Admins can manage target_ledger" ON public.target_ledger FOR ALL USING (public.is_admin());
CREATE POLICY "Workers can view assigned targets" ON public.target_ledger FOR SELECT USING (assigned_worker_id = auth.uid());
CREATE POLICY "Workers can update assigned targets" ON public.target_ledger FOR UPDATE USING (assigned_worker_id = auth.uid());

-- Visit Records 정책
CREATE POLICY "Admins can manage visit_records" ON public.visit_records FOR ALL USING (public.is_admin());
CREATE POLICY "Workers can view own records" ON public.visit_records FOR SELECT USING (worker_id = auth.uid());
CREATE POLICY "Workers can insert own records" ON public.visit_records FOR INSERT WITH CHECK (worker_id = auth.uid());

-- Notices 정책
CREATE POLICY "Admins can manage notices" ON public.notices FOR ALL USING (public.is_admin());
CREATE POLICY "Workers can view all notices" ON public.notices FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'WORKER')
);

-- Notice Reads 정책
CREATE POLICY "Workers can manage own reads" ON public.notice_reads FOR ALL USING (auth.uid() = worker_id);
CREATE POLICY "Admins can view reads" ON public.notice_reads FOR SELECT USING (public.is_admin());

-- Shared Texts 정책
CREATE POLICY "Public can insert shared texts" ON public.shared_texts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own shared texts" ON public.shared_texts FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can delete own shared texts" ON public.shared_texts FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 스토리지 (Storage) 버킷 설정
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Authenticated users can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
