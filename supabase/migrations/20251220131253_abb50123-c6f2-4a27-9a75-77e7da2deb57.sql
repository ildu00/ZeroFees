-- Create table for API key requests
CREATE TABLE public.api_key_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  use_case TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.api_key_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a request (public form)
CREATE POLICY "Anyone can submit API key request" 
ON public.api_key_requests 
FOR INSERT 
WITH CHECK (true);

-- Only admins should be able to view requests (no public select)
-- For now, no SELECT policy - only accessible via service role