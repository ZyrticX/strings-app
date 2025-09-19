-- Migration script to update guest_wishes table
-- Run this in Supabase SQL Editor to fix column names

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can view approved guest wishes" ON public.guest_wishes;
DROP POLICY IF EXISTS "Anyone can create guest wishes" ON public.guest_wishes;
DROP POLICY IF EXISTS "Authenticated users can manage guest wishes" ON public.guest_wishes;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_guest_wishes_approved;

-- Rename columns to match the application code
ALTER TABLE public.guest_wishes 
RENAME COLUMN is_approved TO approved;

ALTER TABLE public.guest_wishes 
RENAME COLUMN wish_message TO wish_text;

-- Recreate policies with correct column names
CREATE POLICY "Anyone can view approved guest wishes" ON public.guest_wishes
  FOR SELECT USING (approved = true);

CREATE POLICY "Anyone can create guest wishes" ON public.guest_wishes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can manage guest wishes" ON public.guest_wishes
  FOR ALL USING (auth.role() = 'authenticated');

-- Recreate index with correct column name
CREATE INDEX IF NOT EXISTS idx_guest_wishes_approved ON public.guest_wishes(approved);

-- Verify the migration
SELECT 'guest_wishes migration completed successfully' as status,
       column_name, 
       data_type,
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'guest_wishes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
