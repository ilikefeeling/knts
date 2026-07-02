-- profiles 테이블에 pin_hash 컬럼 추가 (이미 존재하지 않는 경우만)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin_hash TEXT;
