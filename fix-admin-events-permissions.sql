-- Fix admin permissions for events table
-- This allows admins to view, update, and delete all events
-- Run this in Supabase SQL Editor

-- Drop existing policies for events table
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Event creators can update their events" ON public.events;
DROP POLICY IF EXISTS "Event creators can delete their events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;

-- Policy 1: Anyone can view events (for guest access)
CREATE POLICY "Anyone can view events" ON public.events
  FOR SELECT USING (true);

-- Policy 2: Authenticated users can create events
CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Event creators can update their events
CREATE POLICY "Event creators can update their events" ON public.events
  FOR UPDATE USING (auth.uid() = created_by);

-- Policy 4: ADMINS can update ALL events (this is the new one!)
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

-- Verify the policies were created
SELECT 
  'Events table policies:' as info,
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'events' 
  AND schemaname = 'public'
ORDER BY policyname;

-- Test admin access (this should show events if you're an admin)
SELECT 
  'Testing admin access:' as test,
  COUNT(*) as events_visible_to_current_user
FROM public.events;
