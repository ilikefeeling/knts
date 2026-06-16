-- 1. records 테이블 생성
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  contact TEXT,
  address TEXT,
  "debtAmount" TEXT,
  "debtPeriod" TEXT,
  notes TEXT,
  "nextVisitDate" TEXT,
  "nextVisitTime" TEXT,
  "lastVisitResult" TEXT,
  "lastVisitDate" TEXT,
  "lastVisitSummary" TEXT,
  "lastVisitPhotos" JSONB DEFAULT '[]'::jsonb,
  "visitCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS(Row Level Security) 활성화 (보안을 위해 필수)
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- 3. 자신의 데이터만 읽고 쓸 수 있도록 정책(Policy) 추가
CREATE POLICY "Users can view their own records"
ON records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own records"
ON records FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records"
ON records FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own records"
ON records FOR DELETE
USING (auth.uid() = user_id);

-- 4. Storage 버킷 설정 (photos)
-- 'photos' 라는 이름의 버킷을 생성합니다 (public 버킷)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: 누구나 이미지를 볼 수 있음 (Public 버킷이므로 읽기는 허용)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'photos' );

-- Storage Policy: 로그인한 사용자만 이미지 업로드 가능
CREATE POLICY "Authenticated users can upload photos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'photos' AND 
  auth.role() = 'authenticated'
);

-- 5. shared_texts 테이블 생성 (단축어 공유 데이터 임시 저장)
CREATE TABLE shared_texts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  text TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 누구나 생성할 수 있도록 하되, 본인 것만 조회/삭제할 수 있도록 RLS 설정
ALTER TABLE shared_texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert shared texts"
ON shared_texts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own shared texts"
ON shared_texts FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own shared texts"
ON shared_texts FOR DELETE
USING (auth.uid() = user_id OR user_id IS NULL);
