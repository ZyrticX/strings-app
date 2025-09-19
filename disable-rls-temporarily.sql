-- TEMPORARY: Disable RLS on problematic tables
-- Use this ONLY for testing - not recommended for production

-- Disable RLS on notifications table
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Disable RLS on users table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled on users table';
  ELSE
    RAISE NOTICE 'Users table does not exist';
  END IF;
END $$;

-- Show status
SELECT 'RLS temporarily disabled - REMEMBER TO RE-ENABLE FOR PRODUCTION!' as warning;
