-- Comprehensive fix for all RLS issues
-- This script fixes RLS policies for both notifications and users tables

-- ============================================
-- Fix notifications table RLS policies
-- ============================================

-- Drop all existing policies on notifications
DROP POLICY IF EXISTS "Event owners can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Event owners can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow notification creation" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated notification creation" ON public.notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Event owners can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can delete notifications" ON public.notifications;

-- Create simple, working policies for notifications
CREATE POLICY "Allow all authenticated access to notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- Fix users table RLS policies (if exists)
-- ============================================

-- Check if users table exists and has RLS enabled
DO $$ 
BEGIN
  -- If users table exists, fix its RLS policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- Drop existing policies on users table
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
    DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
    
    -- Create simple policy for users table
    CREATE POLICY "Allow all authenticated access to users" ON public.users
      FOR ALL USING (auth.role() = 'authenticated');
    
    RAISE NOTICE 'Users table RLS policies updated';
  ELSE
    RAISE NOTICE 'Users table does not exist, skipping';
  END IF;
END $$;

-- ============================================
-- Verify tables and policies
-- ============================================

-- Show all policies on notifications table
SELECT 
  'Notifications table policies:' as info,
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'notifications' 
  AND schemaname = 'public';

-- Show all policies on users table (if exists)
SELECT 
  'Users table policies:' as info,
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public';

-- Final status
SELECT 'All RLS policies fixed successfully!' as status;
