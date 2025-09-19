-- Add uploader_email field to media_items table for better guest email tracking
-- Run this in Supabase SQL Editor

-- Add uploader_email column to media_items table
ALTER TABLE public.media_items 
ADD COLUMN IF NOT EXISTS uploader_email TEXT;

-- Create index for better performance when querying by uploader email
CREATE INDEX IF NOT EXISTS idx_media_items_uploader_email ON public.media_items(uploader_email);

-- Update existing records where created_by contains email addresses
UPDATE public.media_items 
SET uploader_email = created_by 
WHERE created_by IS NOT NULL 
  AND created_by LIKE '%@%'
  AND uploader_email IS NULL;

-- Add comment to document the field
COMMENT ON COLUMN public.media_items.uploader_email IS 'Email address of the person who uploaded this media item (for post-event delivery)';

-- Verify the migration
SELECT 'uploader_email field added successfully' as status,
       column_name, 
       data_type,
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'media_items' 
  AND table_schema = 'public'
  AND column_name = 'uploader_email';
