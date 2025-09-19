-- Complete fix for all database issues
-- Run this in Supabase SQL Editor

-- 1. Add missing columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS event_date DATE,
ADD COLUMN IF NOT EXISTS start_time TEXT,
ADD COLUMN IF NOT EXISTS location_text TEXT,
ADD COLUMN IF NOT EXISTS bracelets_count INTEGER,
ADD COLUMN IF NOT EXISTS guest_count_estimate INTEGER,
ADD COLUMN IF NOT EXISTS organizer_phone_number TEXT,
ADD COLUMN IF NOT EXISTS welcome_message TEXT,
ADD COLUMN IF NOT EXISTS guest_thank_you_message TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS allow_video_uploads BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_approve_media BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS total_deal_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS advance_payment_fixed_amount DECIMAL(10,2) DEFAULT 500.00,
ADD COLUMN IF NOT EXISTS user_agreed_to_payment_terms BOOLEAN DEFAULT false;

-- 2. Add icon_name column to highlight_categories
ALTER TABLE public.highlight_categories 
ADD COLUMN IF NOT EXISTS icon_name TEXT;

-- 3. Add missing columns to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS notification_type TEXT,
ADD COLUMN IF NOT EXISTS event_name TEXT,
ADD COLUMN IF NOT EXISTS organizer_name TEXT,
ADD COLUMN IF NOT EXISTS organizer_email TEXT,
ADD COLUMN IF NOT EXISTS organizer_phone TEXT,
ADD COLUMN IF NOT EXISTS event_details JSONB,
ADD COLUMN IF NOT EXISTS access_code TEXT;

-- 4. Fix RLS policies for highlight_categories
DROP POLICY IF EXISTS "Anyone can view highlight categories" ON public.highlight_categories;
DROP POLICY IF EXISTS "Authenticated users can create highlight categories" ON public.highlight_categories;
DROP POLICY IF EXISTS "Event creators can update their highlight categories" ON public.highlight_categories;
DROP POLICY IF EXISTS "Event creators can delete their highlight categories" ON public.highlight_categories;

-- More permissive policies for highlight_categories
CREATE POLICY "Anyone can view highlight categories" ON public.highlight_categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage highlight categories" ON public.highlight_categories
  FOR ALL USING (auth.role() = 'authenticated');

-- 5. Fix RLS policies for media_items  
DROP POLICY IF EXISTS "Anyone can view media items" ON public.media_items;
DROP POLICY IF EXISTS "Authenticated users can create media items" ON public.media_items;
DROP POLICY IF EXISTS "Event creators can update their media items" ON public.media_items;
DROP POLICY IF EXISTS "Event creators can delete their media items" ON public.media_items;

CREATE POLICY "Anyone can view media items" ON public.media_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage media items" ON public.media_items
  FOR ALL USING (auth.role() = 'authenticated');

-- 6. Fix RLS policies for notifications
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'authenticated');

-- 7. Update constraints for notifications
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('new_media', 'payment_reminder', 'event_update', 'new_event'));

-- 8. Create guest_wishes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.guest_wishes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  guest_name TEXT,
  guest_email TEXT,
  wish_message TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for guest_wishes
ALTER TABLE public.guest_wishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved guest wishes" ON public.guest_wishes
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can create guest wishes" ON public.guest_wishes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can manage guest wishes" ON public.guest_wishes
  FOR ALL USING (auth.role() = 'authenticated');

-- 9. Verify final structure
SELECT 'events' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
UNION ALL
SELECT 'highlight_categories' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'highlight_categories' AND table_schema = 'public'
UNION ALL
SELECT 'notifications' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' AND table_schema = 'public'
UNION ALL
SELECT 'guest_wishes' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'guest_wishes' AND table_schema = 'public'
ORDER BY table_name, column_name;
