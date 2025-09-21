-- Complete fix for admin permissions and user status
-- Run this in Supabase SQL Editor

-- STEP 1: Make sure you are an admin user
-- Fix auth.users metadata
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'role', 'admin',
    'full_name', 'evgeniy orel',
    'name', 'evgeniy orel'
)
WHERE email = 'evgeniyphotos1@gmail.com';

-- Ensure user exists in public.users with admin role
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    'evgeniyphotos1@gmail.com',
    'evgeniy orel',
    'admin',
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'evgeniyphotos1@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin',
    full_name = 'evgeniy orel',
    updated_at = NOW();

-- STEP 2: Fix events table RLS policies to allow admins
-- Drop existing policies for events table
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Event creators can update their events" ON public.events;
DROP POLICY IF EXISTS "Event creators can delete their events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
DROP POLICY IF EXISTS "Admins can update all events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete all events" ON public.events;

-- Create new comprehensive policies
-- Policy 1: Anyone can view events (for guest access)
CREATE POLICY "Anyone can view events" ON public.events
  FOR SELECT USING (true);

-- Policy 2: Authenticated users can create events
CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Event creators can update their events
CREATE POLICY "Event creators can update their events" ON public.events
  FOR UPDATE USING (auth.uid() = created_by);

-- Policy 4: ADMINS can update ALL events
CREATE POLICY "Admins can update all events" ON public.events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin'
        OR 
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE public.users.id = auth.uid() 
          AND public.users.role = 'admin'
        )
      )
    )
  );

-- Policy 5: Event creators can delete their events
CREATE POLICY "Event creators can delete their events" ON public.events
  FOR DELETE USING (auth.uid() = created_by);

-- Policy 6: ADMINS can delete ALL events
CREATE POLICY "Admins can delete all events" ON public.events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin'
        OR 
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE public.users.id = auth.uid() 
          AND public.users.role = 'admin'
        )
      )
    )
  );

-- STEP 3: Verify everything is working
-- Check admin user status
SELECT 
    'ADMIN STATUS CHECK:' as check_type,
    au.email,
    au.raw_user_meta_data->>'role' as auth_role,
    pu.role as public_role,
    au.raw_user_meta_data->>'full_name' as auth_name,
    pu.full_name as public_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'evgeniyphotos1@gmail.com';

-- Check events table policies
SELECT 
  'EVENTS POLICIES:' as check_type,
  schemaname, 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'events' 
  AND schemaname = 'public'
ORDER BY policyname;

-- Test admin access to events
SELECT 
  'ADMIN EVENT ACCESS TEST:' as check_type,
  COUNT(*) as events_visible_to_current_user
FROM public.events;

-- Show current user context
SELECT 
    'CURRENT USER CONTEXT:' as check_type,
    auth.uid() as current_user_id,
    auth.role() as current_role;
