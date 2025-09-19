-- Quick fix for events table - run this in Supabase SQL Editor

-- First, let's see what columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add the missing columns one by one (if they don't exist)
DO $$
BEGIN
    -- Add event_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'event_type') THEN
        ALTER TABLE public.events ADD COLUMN event_type TEXT;
    END IF;
    
    -- Add event_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'event_date') THEN
        ALTER TABLE public.events ADD COLUMN event_date DATE;
    END IF;
    
    -- Add start_time if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'start_time') THEN
        ALTER TABLE public.events ADD COLUMN start_time TEXT;
    END IF;
    
    -- Add location_text if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location_text') THEN
        ALTER TABLE public.events ADD COLUMN location_text TEXT;
    END IF;
    
    -- Add bracelets_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'bracelets_count') THEN
        ALTER TABLE public.events ADD COLUMN bracelets_count INTEGER;
    END IF;
    
    -- Add guest_count_estimate if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'guest_count_estimate') THEN
        ALTER TABLE public.events ADD COLUMN guest_count_estimate INTEGER;
    END IF;
    
    -- Add organizer_phone_number if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'organizer_phone_number') THEN
        ALTER TABLE public.events ADD COLUMN organizer_phone_number TEXT;
    END IF;
    
    -- Add welcome_message if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'welcome_message') THEN
        ALTER TABLE public.events ADD COLUMN welcome_message TEXT;
    END IF;
    
    -- Add guest_thank_you_message if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'guest_thank_you_message') THEN
        ALTER TABLE public.events ADD COLUMN guest_thank_you_message TEXT;
    END IF;
    
    -- Add cover_image_url if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'cover_image_url') THEN
        ALTER TABLE public.events ADD COLUMN cover_image_url TEXT;
    END IF;
    
    -- Add allow_video_uploads if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'allow_video_uploads') THEN
        ALTER TABLE public.events ADD COLUMN allow_video_uploads BOOLEAN DEFAULT true;
    END IF;
    
    -- Add auto_approve_media if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'auto_approve_media') THEN
        ALTER TABLE public.events ADD COLUMN auto_approve_media BOOLEAN DEFAULT true;
    END IF;
    
    -- Add total_deal_amount if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'total_deal_amount') THEN
        ALTER TABLE public.events ADD COLUMN total_deal_amount DECIMAL(10,2);
    END IF;
    
    -- Add advance_payment_fixed_amount if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'advance_payment_fixed_amount') THEN
        ALTER TABLE public.events ADD COLUMN advance_payment_fixed_amount DECIMAL(10,2) DEFAULT 500.00;
    END IF;
    
    -- Add user_agreed_to_payment_terms if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'user_agreed_to_payment_terms') THEN
        ALTER TABLE public.events ADD COLUMN user_agreed_to_payment_terms BOOLEAN DEFAULT false;
    END IF;
    
END $$;

-- Fix icon_name for highlight_categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'highlight_categories' AND column_name = 'icon_name') THEN
        ALTER TABLE public.highlight_categories ADD COLUMN icon_name TEXT;
    END IF;
END $$;

-- Show final structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position;
