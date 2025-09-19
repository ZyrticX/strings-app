-- Final fix for RLS policies
-- Run this in Supabase SQL Editor

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can manage notifications" ON public.notifications;

-- Create simple, permissive policies for development
CREATE POLICY "Allow all for authenticated users on notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'authenticated');

-- Also fix highlight_categories RLS
DROP POLICY IF EXISTS "Anyone can view highlight categories" ON public.highlight_categories;
DROP POLICY IF EXISTS "Authenticated users can manage highlight categories" ON public.highlight_categories;

CREATE POLICY "Allow all for authenticated users on highlight_categories" ON public.highlight_categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Fix media_items RLS
DROP POLICY IF EXISTS "Anyone can view media items" ON public.media_items;
DROP POLICY IF EXISTS "Authenticated users can manage media items" ON public.media_items;

CREATE POLICY "Allow all for authenticated users on media_items" ON public.media_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow public viewing for certain tables (for guest access)
CREATE POLICY "Allow public view on events" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Allow public view on highlight_categories" ON public.highlight_categories
  FOR SELECT USING (true);

CREATE POLICY "Allow public view on media_items" ON public.media_items
  FOR SELECT USING (true);

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
