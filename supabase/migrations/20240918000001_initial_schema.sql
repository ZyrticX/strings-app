-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date DATE,
  location TEXT,
  access_code TEXT UNIQUE NOT NULL,
  organizer_name TEXT,
  organizer_phone TEXT,
  organizer_email TEXT,
  package_type TEXT DEFAULT 'basic' CHECK (package_type IN ('basic', 'premium', 'pro')),
  advance_payment_status TEXT DEFAULT 'pending' CHECK (advance_payment_status IN ('pending', 'paid', 'failed')),
  advance_payment_amount DECIMAL(10,2) DEFAULT 500.00,
  guest_photo_limit INTEGER DEFAULT 10,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  payment_order_id TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create highlight categories table
CREATE TABLE IF NOT EXISTS public.highlight_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create media items table
CREATE TABLE IF NOT EXISTS public.media_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  uploader_name TEXT,
  caption TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  highlight_category_id UUID REFERENCES public.highlight_categories(id),
  likes INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  created_by TEXT, -- Email or identifier for guest uploads
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_media', 'payment_reminder', 'event_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlight_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for events table
CREATE POLICY "Anyone can view events" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Event creators can update their events" ON public.events
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Event creators can delete their events" ON public.events
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for highlight_categories table
CREATE POLICY "Anyone can view highlight categories" ON public.highlight_categories
  FOR SELECT USING (true);

CREATE POLICY "Event owners can manage highlight categories" ON public.highlight_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = highlight_categories.event_id 
      AND events.created_by = auth.uid()
    )
  );

-- RLS Policies for media_items table
CREATE POLICY "Anyone can view approved media items" ON public.media_items
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can insert media items" ON public.media_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Event owners can manage all media items" ON public.media_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = media_items.event_id 
      AND events.created_by = auth.uid()
    )
  );

-- RLS Policies for notifications table
CREATE POLICY "Event owners can view notifications" ON public.notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = notifications.event_id 
      AND events.created_by = auth.uid()
    )
  );

-- Storage policies
CREATE POLICY "Anyone can upload media files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media');

CREATE POLICY "Anyone can view media files" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS events_access_code_idx ON public.events(access_code);
CREATE INDEX IF NOT EXISTS events_created_by_idx ON public.events(created_by);
CREATE INDEX IF NOT EXISTS media_items_event_id_idx ON public.media_items(event_id);
CREATE INDEX IF NOT EXISTS media_items_status_idx ON public.media_items(status);
CREATE INDEX IF NOT EXISTS notifications_event_id_idx ON public.notifications(event_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_items_updated_at BEFORE UPDATE ON public.media_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
