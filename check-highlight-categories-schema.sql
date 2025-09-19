-- Check the current schema of highlight_categories table

SELECT 
  'Current highlight_categories table schema:' as info,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'highlight_categories' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show some sample data
SELECT 'Sample data from highlight_categories:' as info;

SELECT 
  id,
  event_id,
  name,
  icon_name,
  created_at
FROM public.highlight_categories
ORDER BY created_at DESC
LIMIT 5;
