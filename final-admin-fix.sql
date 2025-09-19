-- Final fix for admin user
-- Run this in Supabase SQL Editor

-- First, let's check what we have
SELECT 
    'Current Auth User:' as check_type,
    id,
    email,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'evgeniyphotos1@gmail.com';

-- Check public users table
SELECT 
    'Current Public User:' as check_type,
    id,
    email,
    role,
    full_name
FROM public.users 
WHERE email = 'evgeniyphotos1@gmail.com';

-- Now fix both tables
-- 1. Fix auth.users metadata
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'role', 'admin',
    'full_name', 'evgeniy orel',
    'name', 'evgeniy orel'
)
WHERE email = 'evgeniyphotos1@gmail.com';

-- 2. Ensure user exists in public.users with admin role
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    'evgeniyphotos1@gmail.com',
    'evgeniy orel',
    'admin',
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'evgeniyphotos1@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin',
    full_name = 'evgeniy orel',
    updated_at = NOW();

-- Verify the fix
SELECT 
    'VERIFICATION:' as final_check,
    au.email,
    au.raw_user_meta_data->>'role' as auth_role,
    pu.role as public_role,
    au.raw_user_meta_data->>'full_name' as auth_name,
    pu.full_name as public_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'evgeniyphotos1@gmail.com';
