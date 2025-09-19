-- Query to get all media items uploaded by a guest email for post-event delivery
-- This can be used to send guests their uploaded photos after the event

-- Example query to get all media for a specific guest email
SELECT 
    mi.id,
    mi.file_url,
    mi.thumbnail_url,
    mi.caption,
    mi.uploader_name,
    mi.uploader_email,
    mi.created_at,
    e.name as event_name,
    e.event_date,
    e.organizer_name,
    e.organizer_email
FROM public.media_items mi
JOIN public.events e ON mi.event_id = e.id
WHERE mi.uploader_email = 'guest@example.com' -- Replace with actual guest email
  AND mi.status = 'approved'
ORDER BY mi.created_at DESC;

-- Query to get all unique guest emails who uploaded media for an event
SELECT DISTINCT 
    mi.uploader_email,
    mi.uploader_name,
    COUNT(mi.id) as total_uploads,
    MIN(mi.created_at) as first_upload,
    MAX(mi.created_at) as last_upload
FROM public.media_items mi
WHERE mi.event_id = 'EVENT_ID_HERE' -- Replace with actual event ID
  AND mi.uploader_email IS NOT NULL
  AND mi.uploader_email != ''
  AND mi.status = 'approved'
GROUP BY mi.uploader_email, mi.uploader_name
ORDER BY total_uploads DESC;

-- Query to get all media for post-event email delivery (grouped by guest)
SELECT 
    e.name as event_name,
    e.event_date,
    e.organizer_name,
    e.organizer_email as event_organizer_email,
    mi.uploader_email as guest_email,
    mi.uploader_name as guest_name,
    COUNT(mi.id) as total_photos,
    ARRAY_AGG(mi.file_url ORDER BY mi.created_at) as photo_urls,
    ARRAY_AGG(mi.caption ORDER BY mi.created_at) as captions
FROM public.events e
JOIN public.media_items mi ON e.id = mi.event_id
WHERE e.id = 'EVENT_ID_HERE' -- Replace with actual event ID
  AND mi.uploader_email IS NOT NULL
  AND mi.uploader_email != ''
  AND mi.status = 'approved'
GROUP BY e.id, e.name, e.event_date, e.organizer_name, e.organizer_email, mi.uploader_email, mi.uploader_name
ORDER BY mi.uploader_email;
