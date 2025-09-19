-- Check current user and role settings
SELECT 'Checking user roles and auth setup...' as status;

-- Show current user from auth.users
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'role' as extracted_role,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check if there's a separate users table in public schema
SELECT 'Checking public.users table...' as status;

SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- Show the structure of public.users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
