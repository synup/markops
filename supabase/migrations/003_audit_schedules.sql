-- Migration 003: Audit schedules table
-- Allows users to configure recurring audit schedules from the dashboard

CREATE TABLE public.audit_schedules (
  id BIGSERIAL PRIMARY KEY,
  created_by UUID REFERENCES public.profiles(id),
  enabled BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT NOT NULL DEFAULT 'weekly'
    CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_of_month INT CHECK (day_of_month >= 1 AND day_of_month <= 28),
  hour INT NOT NULL DEFAULT 9 CHECK (hour >= 0 AND hour <= 23),
  minute INT NOT NULL DEFAULT 0 CHECK (minute >= 0 AND minute <= 59),
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  last_triggered_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.audit_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view schedules"
  ON public.audit_schedules FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert schedules"
  ON public.audit_schedules FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update schedules"
  ON public.audit_schedules FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete schedules"
  ON public.audit_schedules FOR DELETE
  TO authenticated USING (true);
