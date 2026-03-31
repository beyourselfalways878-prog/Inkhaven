-- Migration to add reports table for anonymous user moderation

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id VARCHAR(255) NOT NULL, -- The user submitting the report (can be 'anonymous' id)
    reported_id VARCHAR(255) NOT NULL, -- The user being reported 
    room_slug VARCHAR(255) NOT NULL, -- Where the incident occurred
    reason VARCHAR(50) NOT NULL, -- Category (spam, harassment, explicit, etc)
    details TEXT, -- Optional extra context
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'actioned', 'dismissed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies 
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Only superusers/admins can view and edit reports.
-- Regular users (authenticated and anon) cannot SELECT, UPDATE, or DELETE from reports.
CREATE POLICY "Admins can view reports" ON public.reports
    FOR SELECT USING (auth.role() = 'service_role');

-- Because we use the service_role key extensively in the backend API to insert reports,
-- no explicit INSERT policy is needed for pubic roles, as service_role bypasses RLS.

-- Add indices for faster admin dashboard queries
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
CREATE INDEX IF NOT EXISTS reports_reported_id_idx ON public.reports(reported_id);
