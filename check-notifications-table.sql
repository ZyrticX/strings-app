-- Check notifications table structure and policies
SELECT 'Checking notifications table structure...' as status;

-- Show table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'notifications';

-- Show sample data (if any)
SELECT COUNT(*) as notification_count FROM public.notifications;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications' AND schemaname = 'public';
