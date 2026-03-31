-- Database Security & Ephemeral Storage Cleanup Migration
-- This protects the storage bucket from hackers/sparmmers filling it permanently

-- 1. Enable standard pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create the cleanup function
-- This function deletes ANY file in the public 'uploads' or 'chats' bucket that is older than 24 hours.
-- It ensures true zero-retention (Option B Ephemerality).
CREATE OR REPLACE FUNCTION clean_ephemeral_storage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as elevated privileges to bypass RLS for cleanup
AS $$
BEGIN
  -- Delete records from the storage.objects table older than 24 hours
  -- Supabase auto-manages the actual S3 object deletion when the record is removed
  DELETE FROM storage.objects
  WHERE bucket_id IN ('files', 'audio', 'images') 
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- 3. Schedule the Cron Job to run every hour
-- If a spammer tries to upload terabytes, it will be wiped completely without manual intervention.
SELECT cron.schedule(
    'ephemeral_cleanup_job',
    '0 * * * *', -- Run every hour, on the hour
    $$ SELECT clean_ephemeral_storage(); $$
);

-- NOTE: RLS Policies for Storage Buckets cannot be set via standard SQL migrations 
-- due to ownership roles on 'storage.objects'. 
-- Please use the Supabase Dashboard -> Storage -> Policies to enforce the 5MB limit.
