-- Create guest_wishes table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.guest_wishes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  guest_name TEXT,
  guest_email TEXT,
  wish_text TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.guest_wishes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guest_wishes
CREATE POLICY "Anyone can view approved guest wishes" ON public.guest_wishes
  FOR SELECT USING (approved = true);

CREATE POLICY "Anyone can create guest wishes" ON public.guest_wishes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can manage guest wishes" ON public.guest_wishes
  FOR ALL USING (auth.role() = 'authenticated');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_guest_wishes_event_id ON public.guest_wishes(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_wishes_approved ON public.guest_wishes(approved);

-- Verify table was created
SELECT 'guest_wishes table created successfully' as status,
       column_name, 
       data_type,
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'guest_wishes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
