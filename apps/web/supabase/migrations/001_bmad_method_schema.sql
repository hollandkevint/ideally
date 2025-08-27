-- BMad Method Database Schema
-- This schema supports the BMad Method strategic framework implementation

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- BMad Method Sessions table
create table bmad_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  workspace_id uuid not null, -- references workspace (assume existing table)
  pathway text not null check (pathway in ('new-idea', 'business-model', 'strategic-optimization')),
  templates text[] not null default '{}',
  current_phase text not null,
  current_template text not null,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  overall_completion numeric(5,2) not null default 0,
  current_step text not null,
  next_steps text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Phase Time Allocations table
create table bmad_phase_allocations (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references bmad_sessions(id) on delete cascade not null,
  phase_id text not null,
  template_id text not null,
  allocated_minutes integer not null,
  used_minutes integer not null default 0,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz not null default now()
);

-- Session Progress tracking
create table bmad_session_progress (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references bmad_sessions(id) on delete cascade not null,
  phase_id text not null,
  template_id text not null,
  completion_percentage numeric(5,2) not null default 0,
  last_updated timestamptz not null default now()
);

-- User Responses storage
create table bmad_user_responses (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references bmad_sessions(id) on delete cascade not null,
  phase_id text not null,
  prompt_id text not null,
  response_text text,
  response_data jsonb,
  elicitation_choice integer,
  timestamp timestamptz not null default now()
);

-- Elicitation History
create table bmad_elicitation_history (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references bmad_sessions(id) on delete cascade not null,
  phase_id text not null,
  template_id text not null,
  options jsonb not null, -- Array of numbered options with metadata
  user_selection text not null, -- Can be number or text
  selected_path text not null,
  generated_context jsonb,
  next_phase_hint text,
  timestamp timestamptz not null default now()
);

-- Persona Evolution tracking
create table bmad_persona_evolution (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references bmad_sessions(id) on delete cascade not null,
  phase_id text not null,
  previous_persona text not null check (previous_persona in ('analyst', 'advisor', 'coach')),
  new_persona text not null check (new_persona in ('analyst', 'advisor', 'coach')),
  trigger_condition text not null,
  reasoning text not null,
  confidence_score numeric(5,2),
  timestamp timestamptz not null default now()
);

-- Knowledge References
create table bmad_knowledge_references (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references bmad_sessions(id) on delete cascade not null,
  entry_id text not null,
  title text not null,
  relevance_score numeric(5,2) not null,
  applied_in_phase text not null,
  timestamp timestamptz not null default now()
);

-- Phase Outputs
create table bmad_phase_outputs (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references bmad_sessions(id) on delete cascade not null,
  phase_id text not null,
  output_id text not null,
  output_name text not null,
  output_type text not null check (output_type in ('text', 'list', 'matrix', 'canvas', 'document')),
  output_data jsonb not null,
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Template Outputs  
create table bmad_template_outputs (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references bmad_sessions(id) on delete cascade not null,
  template_id text not null,
  output_id text not null,
  output_name text not null,
  output_type text not null check (output_type in ('document', 'framework', 'analysis', 'plan')),
  output_data jsonb not null,
  template_path text,
  include_phases text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Generated Documents
create table bmad_generated_documents (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references bmad_sessions(id) on delete cascade not null,
  document_name text not null,
  document_type text not null,
  content text not null,
  format text not null default 'markdown' check (format in ('markdown', 'html', 'pdf', 'docx')),
  file_path text,
  created_at timestamptz not null default now()
);

-- Action Items
create table bmad_action_items (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references bmad_sessions(id) on delete cascade not null,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date timestamptz,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- BMad Knowledge Base
create table bmad_knowledge_entries (
  id text primary key,
  type text not null check (type in ('framework', 'technique', 'template', 'case_study')),
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  applicable_phases text[] not null default '{}',
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  vector_embedding vector(1536), -- For semantic search (requires pgvector extension)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index idx_bmad_sessions_user_id on bmad_sessions(user_id);
create index idx_bmad_sessions_workspace_id on bmad_sessions(workspace_id);
create index idx_bmad_sessions_pathway on bmad_sessions(pathway);
create index idx_bmad_sessions_status on bmad_sessions(status);
create index idx_bmad_sessions_created_at on bmad_sessions(created_at);

create index idx_bmad_phase_allocations_session_id on bmad_phase_allocations(session_id);
create index idx_bmad_session_progress_session_id on bmad_session_progress(session_id);
create index idx_bmad_user_responses_session_id on bmad_user_responses(session_id);
create index idx_bmad_user_responses_phase_id on bmad_user_responses(phase_id);

create index idx_bmad_elicitation_history_session_id on bmad_elicitation_history(session_id);
create index idx_bmad_persona_evolution_session_id on bmad_persona_evolution(session_id);
create index idx_bmad_knowledge_references_session_id on bmad_knowledge_references(session_id);

create index idx_bmad_phase_outputs_session_id on bmad_phase_outputs(session_id);
create index idx_bmad_template_outputs_session_id on bmad_template_outputs(session_id);
create index idx_bmad_generated_documents_session_id on bmad_generated_documents(session_id);
create index idx_bmad_action_items_session_id on bmad_action_items(session_id);

create index idx_bmad_knowledge_entries_type on bmad_knowledge_entries(type);
create index idx_bmad_knowledge_entries_difficulty on bmad_knowledge_entries(difficulty);
create index idx_bmad_knowledge_entries_tags on bmad_knowledge_entries using gin(tags);
create index idx_bmad_knowledge_entries_phases on bmad_knowledge_entries using gin(applicable_phases);

-- Row Level Security policies
alter table bmad_sessions enable row level security;
alter table bmad_phase_allocations enable row level security;
alter table bmad_session_progress enable row level security;
alter table bmad_user_responses enable row level security;
alter table bmad_elicitation_history enable row level security;
alter table bmad_persona_evolution enable row level security;
alter table bmad_knowledge_references enable row level security;
alter table bmad_phase_outputs enable row level security;
alter table bmad_template_outputs enable row level security;
alter table bmad_generated_documents enable row level security;
alter table bmad_action_items enable row level security;
alter table bmad_knowledge_entries enable row level security;

-- RLS Policies - Users can only access their own sessions
create policy "Users can view their own BMad sessions" on bmad_sessions
  for select using (auth.uid() = user_id);

create policy "Users can create their own BMad sessions" on bmad_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own BMad sessions" on bmad_sessions
  for update using (auth.uid() = user_id);

-- Extend policies to related tables
create policy "Users can view their session data" on bmad_phase_allocations
  for select using (
    exists (
      select 1 from bmad_sessions 
      where id = bmad_phase_allocations.session_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can insert their session data" on bmad_phase_allocations
  for insert with check (
    exists (
      select 1 from bmad_sessions 
      where id = bmad_phase_allocations.session_id 
      and user_id = auth.uid()
    )
  );

-- Apply similar patterns to other related tables
create policy "Users can view their session progress" on bmad_session_progress
  for all using (
    exists (
      select 1 from bmad_sessions 
      where id = bmad_session_progress.session_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can manage their responses" on bmad_user_responses
  for all using (
    exists (
      select 1 from bmad_sessions 
      where id = bmad_user_responses.session_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can manage their elicitation history" on bmad_elicitation_history
  for all using (
    exists (
      select 1 from bmad_sessions 
      where id = bmad_elicitation_history.session_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can view their persona evolution" on bmad_persona_evolution
  for all using (
    exists (
      select 1 from bmad_sessions 
      where id = bmad_persona_evolution.session_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can manage their knowledge references" on bmad_knowledge_references
  for all using (
    exists (
      select 1 from bmad_sessions 
      where id = bmad_knowledge_references.session_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can manage their phase outputs" on bmad_phase_outputs
  for all using (
    exists (
      select 1 from bmad_sessions 
      where id = bmad_phase_outputs.session_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can manage their template outputs" on bmad_template_outputs
  for all using (
    exists (
      select 1 from bmad_sessions 
      where id = bmad_template_outputs.session_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can manage their generated documents" on bmad_generated_documents
  for all using (
    exists (
      select 1 from bmad_sessions 
      where id = bmad_generated_documents.session_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can manage their action items" on bmad_action_items
  for all using (
    exists (
      select 1 from bmad_sessions 
      where id = bmad_action_items.session_id 
      and user_id = auth.uid()
    )
  );

-- Knowledge base is globally readable, admin writable
create policy "Anyone can view knowledge entries" on bmad_knowledge_entries
  for select using (true);

-- Functions for automatic timestamp updates
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_bmad_sessions_updated_at
  before update on bmad_sessions
  for each row execute function update_updated_at_column();

create trigger update_bmad_phase_outputs_updated_at
  before update on bmad_phase_outputs
  for each row execute function update_updated_at_column();

create trigger update_bmad_action_items_updated_at
  before update on bmad_action_items
  for each row execute function update_updated_at_column();

create trigger update_bmad_knowledge_entries_updated_at
  before update on bmad_knowledge_entries
  for each row execute function update_updated_at_column();