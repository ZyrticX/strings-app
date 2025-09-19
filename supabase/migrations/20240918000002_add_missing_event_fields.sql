-- Add missing fields to events table to match the application code

-- Add missing columns to events table
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

-- Update advance_payment_status to include more options
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_advance_payment_status_check;

ALTER TABLE public.events 
ADD CONSTRAINT events_advance_payment_status_check 
CHECK (advance_payment_status IN ('pending', 'pending_payment', 'paid', 'failed'));

-- Add check constraint for event_type
ALTER TABLE public.events 
ADD CONSTRAINT events_event_type_check 
CHECK (event_type IN ('wedding', 'corporate', 'birthday', 'bar_mitzvah', 'bat_mitzvah', 'bachelor_party', 'henna', 'party', 'other'));

-- Update existing records to have default values for new fields
UPDATE public.events 
SET 
  event_type = 'other',
  allow_video_uploads = true,
  auto_approve_media = true,
  advance_payment_fixed_amount = 500.00,
  user_agreed_to_payment_terms = false
WHERE event_type IS NULL;

-- Add icon_name column to highlight_categories table
ALTER TABLE public.highlight_categories 
ADD COLUMN IF NOT EXISTS icon_name TEXT;

-- Add notification_type and related fields to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS notification_type TEXT,
ADD COLUMN IF NOT EXISTS event_name TEXT,
ADD COLUMN IF NOT EXISTS organizer_name TEXT,
ADD COLUMN IF NOT EXISTS organizer_email TEXT,
ADD COLUMN IF NOT EXISTS organizer_phone TEXT,
ADD COLUMN IF NOT EXISTS event_details JSONB,
ADD COLUMN IF NOT EXISTS access_code TEXT,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Update notifications table type constraint
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('new_media', 'payment_reminder', 'event_update', 'new_event'));

-- Update notifications table notification_type constraint
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_notification_type_check 
CHECK (notification_type IN ('new_event', 'payment_update', 'media_upload', 'system_alert'));
