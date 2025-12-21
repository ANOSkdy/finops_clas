SELECT id, purpose, original_filename, mime_type, size_bytes, created_at
FROM uploads
ORDER BY created_at DESC
LIMIT 5;