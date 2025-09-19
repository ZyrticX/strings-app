-- Debug events table RLS policies

-- 1. Check if events table exists and has RLS enabled
SELECT 
  'Events table info:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'events' 
  AND schemaname = 'public';

-- 2. Check all RLS policies on events table
SELECT 
  'Events RLS policies:' as info,
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'events' 
  AND schemaname = 'public';

-- 3. Check the specific event that's failing
SELECT 
  'Event details:' as info,
  id,
  name,
  created_by,
  created_at,
  advance_payment_status
FROM public.events 
WHERE id = '29e3bb88-ab84-4600-9bf3-b80b3133b771';

-- 4. Check current user context (this will show the authenticated user)
SELECT 
  'Current auth context:' as info,
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 5. Test if the user can select the event
SELECT 
  'Can current user see this event?' as test,
  COUNT(*) as count
FROM public.events 
WHERE id = '29e3bb88-ab84-4600-9bf3-b80b3133b771';

-- 6. Test if the user can update (dry run)
-- This will show what happens when we try to update
SELECT 
  'Testing update permissions...' as test;

-- Show events the current user can see vs all events
SELECT 
  'Events visible to current user:' as info,
  COUNT(*) as visible_count
FROM public.events;

-- Show total events (bypassing RLS if possible)
SELECT 
  'Total events in database:' as info,
  COUNT(*) as total_count
FROM public.events;
