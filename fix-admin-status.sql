-- Update user to admin status
-- Run this SQL in your Supabase SQL Editor

-- Update the auth.users metadata
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'evgeniyphotos1@gmail.com';

-- Create or update user in public.users table
INSERT INTO public.users (id, email, full_name, role)
SELECT 
    auth.users.id,
    'evgeniyphotos1@gmail.com',
    COALESCE(auth.users.raw_user_meta_data->>'full_name', auth.users.raw_user_meta_data->>'name', 'Admin User'),
    'admin'
FROM auth.users 
WHERE auth.users.email = 'evgeniyphotos1@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin',
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    updated_at = NOW();

-- Verify the update
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data,
    pu.role,
    pu.full_name
FROM auth.users u
LEFT JOIN public.users pu ON u.id = pu.id
WHERE u.email = 'evgeniyphotos1@gmail.com';
