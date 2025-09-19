-- Debug notifications table issues

-- 1. Check if notifications table exists
SELECT 'Checking if notifications table exists...' as status;

SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'notifications' 
  AND table_schema = 'public';

-- 2. Check table structure
SELECT 'Notifications table structure:' as info;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 'RLS policies on notifications table:' as info;

SELECT 
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

-- 4. Try a simple SELECT to see if it works
SELECT 'Testing simple SELECT on notifications...' as test;

SELECT COUNT(*) as total_notifications 
FROM public.notifications;

-- 5. Show sample data (if any)
SELECT 'Sample notifications data:' as info;

SELECT 
  id,
  type,
  title,
  event_name,
  created_at,
  is_read
FROM public.notifications
ORDER BY created_at DESC
LIMIT 3;
