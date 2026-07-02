-- Supabase SQL Editor에서 실행해 주세요
-- profiles 테이블에 가이드 수료 시간을 저장하는 컬럼 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guide_completed_at TIMESTAMP WITH TIME ZONE;
