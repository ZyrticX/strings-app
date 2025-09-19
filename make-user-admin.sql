-- Make current user an admin
-- Replace 'your-email@example.com' with your actual email

-- Option 1: Update in public.users table
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- If the user doesn't exist in public.users, insert them
INSERT INTO public.users (id, email, full_name, role, created_at)
SELECT 
  auth.users.id,
  auth.users.email,
  COALESCE(auth.users.raw_user_meta_data->>'full_name', auth.users.email),
  'admin',
  NOW()
FROM auth.users 
WHERE auth.users.email = 'your-email@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE public.users.id = auth.users.id
  );

-- Verify the update
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.users 
WHERE email = 'your-email@example.com';
