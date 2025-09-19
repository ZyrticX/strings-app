-- Fix RLS policies for notifications table to allow admins to view all notifications
-- This fixes the issue where admin users can't see notifications in AdminNotifications page

-- Drop existing policy
DROP POLICY IF EXISTS "Event owners can view notifications" ON public.notifications;

-- Create new policies for notifications table
-- Policy 1: Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy 2: Event owners can view notifications related to their events
CREATE POLICY "Event owners can view their notifications" ON public.notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = notifications.event_id 
      AND events.created_by = auth.uid()
    )
  );

-- Policy 3: Allow anyone to create notifications (for system operations)
CREATE POLICY "Allow notification creation" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Policy 4: Admins can update notifications (mark as read, etc.)
CREATE POLICY "Admins can update notifications" ON public.notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy 5: Event owners can update notifications related to their events
CREATE POLICY "Event owners can update their notifications" ON public.notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = notifications.event_id 
      AND events.created_by = auth.uid()
    )
  );

-- Policy 6: Admins can delete notifications
CREATE POLICY "Admins can delete notifications" ON public.notifications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Verify the policies were created
SELECT 'Notifications RLS policies updated successfully' as status;
