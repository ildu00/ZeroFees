
-- API Keys table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  api_key TEXT NOT NULL UNIQUE,
  monthly_limit INTEGER NOT NULL DEFAULT 1000,
  current_month_usage INTEGER NOT NULL DEFAULT 0,
  usage_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  request_id UUID REFERENCES public.api_key_requests(id) ON DELETE SET NULL,
  notes TEXT
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can CRUD api_keys
CREATE POLICY "Admins can manage api keys"
  ON public.api_keys FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_api_keys_key ON public.api_keys(api_key);
CREATE INDEX idx_api_keys_email ON public.api_keys(email);
CREATE INDEX idx_api_keys_active ON public.api_keys(is_active);

-- API usage logs for tracking
CREATE TABLE public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  response_status INTEGER,
  response_time_ms INTEGER
);

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read api usage logs"
  ON public.api_usage_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public insert for edge functions to log usage
CREATE POLICY "System can insert usage logs"
  ON public.api_usage_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_api_usage_logs_key ON public.api_usage_logs(api_key_id);
CREATE INDEX idx_api_usage_logs_created ON public.api_usage_logs(created_at DESC);
