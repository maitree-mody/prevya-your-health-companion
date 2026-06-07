-- ============================================================
-- PART 1: Core tables
-- ============================================================

create table users (
  id uuid primary key default gen_random_uuid(),
  name text,
  age integer,
  conditions_suspected text[],
  fertility_intent boolean,
  cycle_start_dates date[],
  current_goal text,
  goal_set_date timestamp,
  created_at timestamp default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  file_url text,
  source text,
  extracted_json jsonb,
  upload_date timestamp default now(),
  processed boolean default false
);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  date timestamp default now(),
  transcript text,
  symptoms_extracted jsonb,
  emotion_timeline jsonb,
  dominant_emotion text,
  pain_score integer,
  fatigue_score integer,
  distress_score integer
);

create table timeline_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  date timestamp,
  event_type text,
  content jsonb,
  source text,
  clinical_flag boolean default false
);

create table agent_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  agent_name text,
  action_type text,
  action_detail jsonb,
  status text,
  result jsonb,
  timestamp timestamp default now(),
  verified boolean default false
);

create table agent_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  goal_description text,
  priority text,
  status text,
  created_at timestamp default now(),
  completed_at timestamp,
  blocked_reason text
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  specialist_type text,
  date timestamp,
  location text,
  dossier_sent boolean default false,
  outcome text,
  follow_up_booked boolean default false
);

create table patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  pattern_description text,
  clinical_significance text,
  cycle_correlation text,
  first_detected timestamp default now(),
  added_to_dossier boolean default false
);

create table nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  date timestamp default now(),
  meal text,
  foods text[],
  correlated_symptom_score integer
);

-- ============================================================
-- PART 2: pgvector + medical guidelines RAG table
-- Note: vector(768) matches Groq nomic-embed-text-v1.5 output
-- ============================================================

create extension if not exists vector;

create extension if not exists vector;

-- embedding is nullable: populated later when an embedding API is reachable.
-- Full-text search (match_guidelines_fts) is the active retrieval path.
create table medical_guidelines (
  id uuid primary key default gen_random_uuid(),
  condition text,
  guideline_source text,
  content text,
  embedding vector(384)
);

-- GIN index for full-text search (active retrieval path)
create index on medical_guidelines using gin(to_tsvector('english', content));

-- ivfflat vector index (future upgrade path, once embeddings are populated)
create index on medical_guidelines
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 1);

-- ============================================================
-- PART 3: RPC functions for RAG retrieval
-- ============================================================

-- Full-text search (used now — no embedding needed)
create or replace function match_guidelines_fts(
  query_text text,
  match_count int default 5
)
returns table (
  id uuid,
  condition text,
  guideline_source text,
  content text,
  rank float
)
language sql stable
as $$
  select
    id,
    condition,
    guideline_source,
    content,
    ts_rank(to_tsvector('english', content), websearch_to_tsquery('english', query_text)) as rank
  from medical_guidelines
  where to_tsvector('english', content) @@ websearch_to_tsquery('english', query_text)
  order by rank desc
  limit match_count;
$$;

-- Vector similarity search (upgrade path — requires embeddings populated)
create or replace function match_guidelines(
  query_embedding vector(384),
  match_threshold float default 0.5,
  match_count int default 5
)
returns table (
  id uuid,
  condition text,
  guideline_source text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    condition,
    guideline_source,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from medical_guidelines
  where embedding is not null
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
