
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  age INT,
  conditions_suspected TEXT[],
  fertility_intent BOOLEAN DEFAULT false,
  cycle_start_dates DATE[],
  current_goal TEXT,
  goal_set_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  file_url TEXT,
  source TEXT,
  extracted_json JSONB,
  upload_date TIMESTAMPTZ DEFAULT now(),
  processed_boolean BOOLEAN DEFAULT false
);

CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  transcript TEXT,
  symptoms_extracted JSONB,
  emotion_timeline JSONB,
  dominant_emotion TEXT,
  pain_score INT,
  fatigue_score INT,
  distress_score INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT now(),
  event_type TEXT,
  content TEXT,
  source TEXT,
  clinical_flag BOOLEAN DEFAULT false
);

CREATE TABLE public.agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  agent_name TEXT,
  action_type TEXT,
  action_detail TEXT,
  status TEXT,
  result TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  verified_boolean BOOLEAN DEFAULT false
);

CREATE TABLE public.agent_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  goal_description TEXT,
  priority INT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  blocked_reason TEXT
);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_type TEXT,
  date TIMESTAMPTZ,
  location TEXT,
  dossier_sent BOOLEAN DEFAULT false,
  outcome TEXT,
  follow_up_booked BOOLEAN DEFAULT false
);

CREATE TABLE public.patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  pattern_description TEXT,
  clinical_significance TEXT,
  cycle_correlation TEXT,
  first_detected TIMESTAMPTZ DEFAULT now(),
  added_to_dossier BOOLEAN DEFAULT false
);

CREATE TABLE public.nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  meal TEXT,
  foods TEXT[],
  correlated_symptom_score INT
);

-- Grants & open RLS for prototype (no auth in v1)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','documents','checkins','timeline_events','agent_actions','agent_goals','appointments','patterns','nutrition_logs'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "open_all" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;
