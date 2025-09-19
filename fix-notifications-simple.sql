-- Simple fix for notifications RLS policies
-- This allows authenticated users to view and manage notifications

-- Drop all existing policies
DROP POLICY IF EXISTS "Event owners can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Event owners can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow notification creation" ON public.notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Event owners can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;

-- Simple policies that work for all authenticated users
-- Policy 1: All authenticated users can view notifications
CREATE POLICY "Authenticated users can view notifications" ON public.notifications
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: All authenticated users can create notifications
CREATE POLICY "Authenticated users can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: All authenticated users can update notifications
CREATE POLICY "Authenticated users can update notifications" ON public.notifications
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy 4: All authenticated users can delete notifications
CREATE POLICY "Authenticated users can delete notifications" ON public.notifications
  FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the policies were created
SELECT 'Simple notifications RLS policies updated successfully' as status;
