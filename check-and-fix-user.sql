-- Check current user status
SELECT 
    'Auth Users Table:' as table_name,
    u.id,
    u.email,
    u.raw_user_meta_data,
    u.raw_user_meta_data->>'role' as metadata_role
FROM auth.users u
WHERE u.email = 'evgeniyphotos1@gmail.com'

UNION ALL

SELECT 
    'Public Users Table:' as table_name,
    pu.id,
    pu.email,
    pu.role::text as raw_user_meta_data,
    pu.role as metadata_role
FROM public.users pu
WHERE pu.email = 'evgeniyphotos1@gmail.com';

-- Fix user data if needed
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'role', 'admin',
    'full_name', COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Admin User'),
    'name', COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', 'Admin User')
)
WHERE email = 'evgeniyphotos1@gmail.com';

-- Ensure user exists in public.users table
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    'evgeniyphotos1@gmail.com',
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'Admin User'),
    'admin',
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'evgeniyphotos1@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin',
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    updated_at = NOW();

-- Final verification
SELECT 
    'FINAL CHECK:' as status,
    au.email,
    au.raw_user_meta_data->>'role' as auth_role,
    pu.role as public_role,
    au.raw_user_meta_data->>'full_name' as auth_name,
    pu.full_name as public_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'evgeniyphotos1@gmail.com';
