-- Add missing display_order column to highlight_categories table

-- Add the display_order column
ALTER TABLE public.highlight_categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1;

-- Update existing records to have sequential display_order
-- Group by event_id and set order based on creation time
WITH ordered_categories AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY created_at) as new_order
  FROM public.highlight_categories
)
UPDATE public.highlight_categories 
SET display_order = ordered_categories.new_order
FROM ordered_categories
WHERE public.highlight_categories.id = ordered_categories.id;

-- Add an index for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_highlight_categories_display_order 
ON public.highlight_categories(event_id, display_order);

-- Verify the column was added and populated
SELECT 
  'display_order column added successfully' as status,
  COUNT(*) as total_categories,
  MIN(display_order) as min_order,
  MAX(display_order) as max_order
FROM public.highlight_categories;

-- Show sample data to verify
SELECT 
  id,
  event_id,
  name,
  display_order,
  created_at
FROM public.highlight_categories
ORDER BY event_id, display_order
LIMIT 10;
