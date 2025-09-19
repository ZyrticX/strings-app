-- Update Google Auth user to have admin role in metadata
-- This will make it work properly with Google OAuth

-- First check current state
SELECT 
    'Before Update:' as status,
    id,
    email,
    raw_user_meta_data,
    raw_user_meta_data->>'role' as current_role
FROM auth.users 
WHERE email = 'evgeniyphotos1@gmail.com';

-- Update the user's metadata to include admin role
-- This preserves all Google data while adding our role
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'admin')
WHERE email = 'evgeniyphotos1@gmail.com';

-- Also ensure the user exists in our public users table
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        split_part(au.email, '@', 1)
    ) as full_name,
    'admin',
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'evgeniyphotos1@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin',
    full_name = COALESCE(
        EXCLUDED.full_name,
        users.full_name
    ),
    updated_at = NOW();

-- Verify the update worked
SELECT 
    'After Update:' as status,
    au.id,
    au.email,
    au.raw_user_meta_data,
    au.raw_user_meta_data->>'role' as metadata_role,
    pu.role as public_table_role,
    pu.full_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'evgeniyphotos1@gmail.com';

-- Important: This preserves all Google OAuth data while adding admin role
