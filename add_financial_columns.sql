ALTER TABLE public.task_ledger
ADD COLUMN arrears_amount INTEGER DEFAULT 0,
ADD COLUMN paid_amount INTEGER DEFAULT 0;

ALTER TABLE public.master_ledger
ADD COLUMN arrears_amount INTEGER DEFAULT 0,
ADD COLUMN is_intensive BOOLEAN DEFAULT false;
