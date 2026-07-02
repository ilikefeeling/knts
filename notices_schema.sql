-- 공지사항 테이블 (notices)
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 관리자는 자신이 작성한 공지사항만 조회, 생성, 수정, 삭제 가능
CREATE POLICY "Admins can view their own notices" ON notices FOR SELECT USING (auth.uid() = admin_id);
CREATE POLICY "Admins can insert notices" ON notices FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "Admins can update their own notices" ON notices FOR UPDATE USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "Admins can delete their own notices" ON notices FOR DELETE USING (auth.uid() = admin_id);

-- 보조원은 모든 공지사항을 조회 가능하도록 설정 (단, 필요시 assigned admin_id 조건 추가 가능하나 여기선 공통으로 처리)
CREATE POLICY "Workers can view all notices" ON notices FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'WORKER')
);

-- 보조원 공지사항 읽음 처리 테이블 (notice_reads)
CREATE TABLE notice_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id UUID REFERENCES notices(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES auth.users(id) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notice_id, worker_id)
);

ALTER TABLE notice_reads ENABLE ROW LEVEL SECURITY;

-- 보조원은 자신의 읽음 기록만 조회/생성 가능
CREATE POLICY "Workers can view their own reads" ON notice_reads FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "Workers can insert their own reads" ON notice_reads FOR INSERT WITH CHECK (auth.uid() = worker_id);
-- 관리자는 자신이 쓴 공지사항에 달린 읽음 기록 조회 가능
CREATE POLICY "Admins can view reads for their notices" ON notice_reads FOR SELECT USING (
  EXISTS (SELECT 1 FROM notices WHERE notices.id = notice_reads.notice_id AND notices.admin_id = auth.uid())
);
