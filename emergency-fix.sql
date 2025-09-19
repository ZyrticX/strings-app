-- EMERGENCY: Quick fix for deadlock
-- This completely disables RLS - use for testing only

ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Check if users table exists and disable RLS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled on users table';
  END IF;
END $$;

SELECT 'Emergency fix applied - RLS disabled' as status;
