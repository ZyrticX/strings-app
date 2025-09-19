-- Debug RLS policies and permissions
-- Run this in Supabase SQL Editor to understand why some events can't be deleted

-- 1. Check current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('events', 'media_items', 'highlight_categories', 'notifications', 'guest_wishes')
ORDER BY tablename, policyname;

-- 2. Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('events', 'media_items', 'highlight_categories', 'notifications', 'guest_wishes');

-- 3. Check current user context (when authenticated)
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    current_user as postgres_user;

-- 4. Test event visibility with current user
SELECT 
    id,
    name,
    created_by,
    organizer_email,
    created_at
FROM events 
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check foreign key constraints
SELECT
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND (tc.table_name IN ('media_items', 'highlight_categories', 'notifications', 'guest_wishes')
         OR ccu.table_name = 'events');
