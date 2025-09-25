-- BMad Analytics Foundation Schema Extension
-- Migration: 002_bmad_analytics_schema
-- Creates analytics tables for session tracking, user behavior analysis, and A/B testing

-- Session Analytics Events - Core event tracking
create table bmad_analytics_events (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references bmad_sessions(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  
  -- Event classification
  event_type text not null check (event_type in (
    'session_start', 'session_pause', 'session_resume', 'session_exit',
    'phase_enter', 'phase_exit', 'phase_timeout', 
    'elicitation_start', 'elicitation_complete', 'elicitation_abandon',
    'persona_switch', 'knowledge_reference', 'user_confusion',
    'breakthrough_moment', 'session_complete', 'ai_response',
    'user_response', 'quality_milestone', 'optimization_trigger'
  )),
  
  -- Event data and context
  event_data jsonb not null default '{}',
  event_metadata jsonb not null default '{}',
  
  -- Technical context
  user_agent text,
  viewport_size text,
  timestamp timestamptz not null default now(),
  
  -- Performance tracking
  processing_time_ms integer check (processing_time_ms >= 0),
  ai_response_time_ms integer check (ai_response_time_ms >= 0),
  client_render_time_ms integer check (client_render_time_ms >= 0),
  
  -- Session context at event time
  current_phase text,
  current_template text,
  pathway text not null check (pathway in ('new-idea', 'business-model', 'strategic-optimization')),
  session_progress_percent numeric(5,2) check (session_progress_percent between 0 and 100),
  
  -- Quality indicators
  user_engagement_score integer check (user_engagement_score between 1 and 100),
  ai_confidence_score numeric(3,2) check (ai_confidence_score between 0 and 1),
  
  created_at timestamptz not null default now()
);

-- Pathway Performance Metrics - Aggregated daily metrics
create table bmad_pathway_metrics (
  id uuid default uuid_generate_v4() primary key,
  pathway text not null check (pathway in ('new-idea', 'business-model', 'strategic-optimization')),
  metric_date date not null default current_date,
  
  -- Core session metrics
  sessions_started integer not null default 0 check (sessions_started >= 0),
  sessions_completed integer not null default 0 check (sessions_completed >= 0),
  sessions_abandoned integer not null default 0 check (sessions_abandoned >= 0),
  sessions_paused integer not null default 0 check (sessions_paused >= 0),
  
  -- Completion and effectiveness
  completion_rate numeric(5,2) not null default 0 check (completion_rate between 0 and 100),
  avg_completion_time_minutes integer check (avg_completion_time_minutes >= 0),
  median_completion_time_minutes integer check (median_completion_time_minutes >= 0),
  
  -- Time allocation efficiency
  avg_session_duration_minutes integer not null default 0 check (avg_session_duration_minutes >= 0),
  avg_time_to_first_breakthrough integer check (avg_time_to_first_breakthrough >= 0),
  avg_phase_completion_time jsonb not null default '{}',
  phase_timeout_rate numeric(5,2) not null default 0 check (phase_timeout_rate between 0 and 100),
  
  -- User experience indicators
  avg_persona_switches numeric(5,2) not null default 0 check (avg_persona_switches >= 0),
  avg_knowledge_references integer not null default 0 check (avg_knowledge_references >= 0),
  confusion_events_per_session numeric(5,2) not null default 0 check (confusion_events_per_session >= 0),
  
  -- Value delivery metrics
  breakthrough_moments_per_session numeric(5,2) not null default 0 check (breakthrough_moments_per_session >= 0),
  actionable_outputs_per_session numeric(5,2) not null default 0 check (actionable_outputs_per_session >= 0),
  avg_output_quality_score integer check (avg_output_quality_score between 1 and 10),
  
  -- Satisfaction and engagement
  avg_user_engagement_score integer check (avg_user_engagement_score between 1 and 100),
  avg_ai_confidence_score numeric(3,2) check (avg_ai_confidence_score between 0 and 1),
  user_satisfaction_score numeric(3,1) check (user_satisfaction_score between 1 and 5),
  
  -- Performance metrics
  avg_ai_response_time_ms integer check (avg_ai_response_time_ms >= 0),
  p95_ai_response_time_ms integer check (p95_ai_response_time_ms >= 0),
  system_error_rate numeric(5,2) not null default 0 check (system_error_rate between 0 and 100),
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(pathway, metric_date)
);

-- User Behavior Patterns - Individual user analytics
create table bmad_user_behavior (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  session_id uuid references bmad_sessions(id) on delete cascade not null,
  pathway text not null check (pathway in ('new-idea', 'business-model', 'strategic-optimization')),
  
  -- Behavioral scoring
  engagement_score integer not null check (engagement_score between 1 and 100),
  focus_score integer check (focus_score between 1 and 100),
  collaboration_score integer check (collaboration_score between 1 and 100),
  
  -- Interaction patterns
  response_velocity jsonb not null default '{}', -- response times per phase
  interaction_depth_score integer check (interaction_depth_score between 1 and 100),
  revision_frequency numeric(5,2) check (revision_frequency >= 0),
  question_asking_frequency numeric(5,2) check (question_asking_frequency >= 0),
  
  -- Learning and adaptation patterns
  confusion_indicators jsonb not null default '[]',
  breakthrough_patterns jsonb not null default '[]',
  learning_velocity_score integer check (learning_velocity_score between 1 and 100),
  
  -- Preferences discovered during session
  preferred_elicitation_style text check (preferred_elicitation_style in ('structured', 'conversational', 'visual', 'mixed')),
  optimal_session_length integer check (optimal_session_length > 0),
  most_effective_persona text check (most_effective_persona in ('analyst', 'advisor', 'coach')),
  preferred_interaction_pace text check (preferred_interaction_pace in ('fast', 'moderate', 'deliberate')),
  
  -- Quality indicators
  output_quality_trend jsonb not null default '{}',
  satisfaction_trajectory jsonb not null default '{}',
  value_realization_pattern text,
  
  -- Behavioral insights metadata
  analysis_confidence numeric(3,2) check (analysis_confidence between 0 and 1),
  insights_generated jsonb not null default '[]',
  recommendations jsonb not null default '[]',
  
  created_at timestamptz not null default now(),
  
  unique(user_id, session_id)
);

-- A/B Testing Framework - Experiment definitions
create table bmad_ab_experiments (
  id uuid default uuid_generate_v4() primary key,
  experiment_name text not null unique,
  description text not null,
  hypothesis text not null,
  
  -- Targeting
  pathway text check (pathway in ('new-idea', 'business-model', 'strategic-optimization')),
  target_criteria jsonb not null default '{}',
  
  -- Experiment configuration
  variants jsonb not null check (jsonb_typeof(variants) = 'object'),
  traffic_allocation jsonb not null default '{"control": 50}',
  
  -- Success criteria
  primary_metric text not null,
  primary_metric_target numeric(10,4),
  secondary_metrics text[] not null default '{}',
  minimum_sample_size integer not null default 100,
  
  -- Statistical parameters
  significance_threshold numeric(3,2) not null default 0.05,
  power_threshold numeric(3,2) not null default 0.80,
  minimum_effect_size numeric(5,4),
  
  -- Experiment lifecycle
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  start_date timestamptz,
  end_date timestamptz,
  actual_end_date timestamptz,
  
  -- Results and analysis
  results_data jsonb not null default '{}',
  statistical_significance boolean,
  effect_size numeric(5,4),
  confidence_interval jsonb,
  
  -- Metadata
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Constraints
  check (end_date > start_date or end_date is null),
  check (actual_end_date >= start_date or actual_end_date is null)
);

-- A/B Test Assignments - User variant assignments
create table bmad_ab_assignments (
  id uuid default uuid_generate_v4() primary key,
  experiment_id uuid references bmad_ab_experiments(id) on delete cascade not null,
  session_id uuid references bmad_sessions(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  
  -- Assignment details
  variant text not null,
  assignment_reason text,
  
  -- Assignment metadata
  user_agent text,
  assignment_criteria_met jsonb not null default '{}',
  
  -- Tracking
  assigned_at timestamptz not null default now(),
  first_interaction_at timestamptz,
  last_interaction_at timestamptz,
  
  -- Conversion tracking
  primary_conversion boolean not null default false,
  primary_conversion_at timestamptz,
  primary_conversion_value numeric(10,4),
  
  secondary_conversions jsonb not null default '{}',
  
  unique(experiment_id, session_id)
);

-- Session Quality Scores - Quality assessment for sessions
create table bmad_session_quality_scores (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references bmad_sessions(id) on delete cascade not null,
  
  -- Quality dimensions (1-10 scale)
  completion_quality integer check (completion_quality between 1 and 10),
  engagement_quality integer check (engagement_quality between 1 and 10),
  output_quality integer check (output_quality between 1 and 10),
  interaction_quality integer check (interaction_quality between 1 and 10),
  value_delivery_quality integer check (value_delivery_quality between 1 and 10),
  
  -- Composite scores
  overall_quality_score numeric(3,1) check (overall_quality_score between 1 and 10),
  user_satisfaction_score integer check (user_satisfaction_score between 1 and 5),
  
  -- Quality factors
  quality_indicators jsonb not null default '{}',
  improvement_opportunities jsonb not null default '[]',
  success_factors jsonb not null default '[]',
  
  -- Scoring metadata
  scoring_algorithm_version text not null default 'v1.0',
  score_confidence numeric(3,2) check (score_confidence between 0 and 1),
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(session_id)
);

-- Optimization Insights - AI-generated optimization recommendations
create table bmad_optimization_insights (
  id uuid default uuid_generate_v4() primary key,
  
  -- Scope of insight
  insight_type text not null check (insight_type in (
    'pathway_optimization', 'phase_improvement', 'user_experience',
    'ai_performance', 'engagement_boost', 'completion_rate'
  )),
  pathway text check (pathway in ('new-idea', 'business-model', 'strategic-optimization')),
  phase_id text,
  
  -- Insight details
  insight_title text not null,
  insight_description text not null,
  insight_rationale text not null,
  
  -- Impact assessment
  estimated_impact_score integer check (estimated_impact_score between 1 and 100),
  implementation_effort text check (implementation_effort in ('low', 'medium', 'high')),
  expected_roi_multiplier numeric(4,2) check (expected_roi_multiplier >= 0),
  
  -- Supporting data
  data_confidence numeric(3,2) check (data_confidence between 0 and 1),
  supporting_metrics jsonb not null default '{}',
  sample_size integer check (sample_size >= 0),
  
  -- Recommendations
  recommended_actions jsonb not null default '[]',
  success_criteria jsonb not null default '{}',
  
  -- Implementation tracking
  status text not null default 'new' check (status in ('new', 'under_review', 'approved', 'implemented', 'rejected')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  
  -- Metadata
  generated_by text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for optimal query performance
create index idx_analytics_events_session_type_time on bmad_analytics_events(session_id, event_type, timestamp);
create index idx_analytics_events_pathway_time on bmad_analytics_events(pathway, timestamp desc);
create index idx_analytics_events_user_time on bmad_analytics_events(user_id, timestamp desc);
create index idx_analytics_events_type_time on bmad_analytics_events(event_type, timestamp desc);
create index idx_analytics_events_performance on bmad_analytics_events(pathway, ai_response_time_ms) where ai_response_time_ms is not null;

create index idx_pathway_metrics_pathway_date on bmad_pathway_metrics(pathway, metric_date desc);
create index idx_pathway_metrics_completion_rate on bmad_pathway_metrics(completion_rate desc);
create index idx_pathway_metrics_engagement on bmad_pathway_metrics(avg_user_engagement_score desc);

create index idx_user_behavior_user_engagement on bmad_user_behavior(user_id, engagement_score desc);
create index idx_user_behavior_session_quality on bmad_user_behavior(session_id, engagement_score);
create index idx_user_behavior_pathway_patterns on bmad_user_behavior(pathway, preferred_elicitation_style);

create index idx_ab_experiments_status_active on bmad_ab_experiments(status, start_date) where status = 'active';
create index idx_ab_assignments_experiment_variant on bmad_ab_assignments(experiment_id, variant);
create index idx_ab_assignments_session_user on bmad_ab_assignments(session_id, user_id);

create index idx_quality_scores_session_overall on bmad_session_quality_scores(session_id, overall_quality_score desc);
create index idx_quality_scores_satisfaction on bmad_session_quality_scores(user_satisfaction_score desc, created_at desc);

create index idx_optimization_insights_type_impact on bmad_optimization_insights(insight_type, estimated_impact_score desc);
create index idx_optimization_insights_status_priority on bmad_optimization_insights(status, priority, created_at desc);
create index idx_optimization_insights_pathway on bmad_optimization_insights(pathway, estimated_impact_score desc);

-- Row Level Security
alter table bmad_analytics_events enable row level security;
alter table bmad_pathway_metrics enable row level security;
alter table bmad_user_behavior enable row level security;
alter table bmad_ab_experiments enable row level security;
alter table bmad_ab_assignments enable row level security;
alter table bmad_session_quality_scores enable row level security;
alter table bmad_optimization_insights enable row level security;

-- RLS Policies for analytics tables
create policy "Users can view their analytics events" on bmad_analytics_events
  for select using (auth.uid() = user_id);

create policy "System can insert analytics events" on bmad_analytics_events
  for insert with check (true); -- Allow system to insert events

create policy "Users can view their behavior data" on bmad_user_behavior
  for select using (auth.uid() = user_id);

create policy "Users can view pathway metrics" on bmad_pathway_metrics
  for select using (true); -- Pathway metrics are aggregate and safe to view

create policy "Users can view active experiments" on bmad_ab_experiments
  for select using (status in ('active', 'completed'));

create policy "Users can view their assignments" on bmad_ab_assignments
  for select using (auth.uid() = user_id);

create policy "Users can view their session quality" on bmad_session_quality_scores
  for select using (
    exists (
      select 1 from bmad_sessions 
      where id = bmad_session_quality_scores.session_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can view optimization insights" on bmad_optimization_insights
  for select using (status in ('approved', 'implemented'));

-- Functions for analytics automation

-- Function to calculate engagement score
create or replace function calculate_engagement_score(
  p_session_id uuid
) returns integer as $$
declare
  v_score integer := 0;
  v_event_count integer;
  v_response_count integer;
  v_breakthrough_count integer;
begin
  -- Count meaningful events
  select count(*) into v_event_count
  from bmad_analytics_events
  where session_id = p_session_id
    and event_type in ('elicitation_complete', 'user_response', 'breakthrough_moment');
  
  -- Count user responses
  select count(*) into v_response_count
  from bmad_user_responses
  where session_id = p_session_id;
  
  -- Count breakthrough moments
  select count(*) into v_breakthrough_count
  from bmad_analytics_events
  where session_id = p_session_id
    and event_type = 'breakthrough_moment';
  
  -- Calculate base score
  v_score := least(100, greatest(1, 
    (v_event_count * 10) + 
    (v_response_count * 5) + 
    (v_breakthrough_count * 20)
  ));
  
  return v_score;
end;
$$ language plpgsql security definer;

-- Function to aggregate daily pathway metrics
create or replace function aggregate_pathway_metrics(
  p_date date default current_date
) returns void as $$
declare
  r_pathway record;
begin
  -- Loop through each pathway
  for r_pathway in 
    select distinct pathway from bmad_sessions 
    where date(created_at) = p_date
  loop
    -- Insert or update metrics for this pathway and date
    insert into bmad_pathway_metrics (
      pathway, metric_date,
      sessions_started, sessions_completed, sessions_abandoned,
      completion_rate, avg_session_duration_minutes
    )
    select 
      r_pathway.pathway,
      p_date,
      count(*) as sessions_started,
      count(*) filter (where status = 'completed') as sessions_completed,
      count(*) filter (where status = 'abandoned') as sessions_abandoned,
      (count(*) filter (where status = 'completed') * 100.0 / count(*)) as completion_rate,
      avg(extract(epoch from (coalesce(end_time, now()) - start_time)) / 60)::integer
    from bmad_sessions
    where pathway = r_pathway.pathway
      and date(created_at) = p_date
    on conflict (pathway, metric_date)
    do update set
      sessions_started = excluded.sessions_started,
      sessions_completed = excluded.sessions_completed,
      sessions_abandoned = excluded.sessions_abandoned,
      completion_rate = excluded.completion_rate,
      avg_session_duration_minutes = excluded.avg_session_duration_minutes,
      updated_at = now();
  end loop;
end;
$$ language plpgsql security definer;

-- Triggers for automatic updates
create trigger update_bmad_pathway_metrics_updated_at
  before update on bmad_pathway_metrics
  for each row execute function update_updated_at_column();

create trigger update_bmad_ab_experiments_updated_at
  before update on bmad_ab_experiments
  for each row execute function update_updated_at_column();

create trigger update_bmad_session_quality_scores_updated_at
  before update on bmad_session_quality_scores
  for each row execute function update_updated_at_column();

create trigger update_bmad_optimization_insights_updated_at
  before update on bmad_optimization_insights
  for each row execute function update_updated_at_column();

-- Comments for documentation
comment on table bmad_analytics_events is 'Core event tracking for BMad sessions including user interactions, AI responses, and performance metrics';
comment on table bmad_pathway_metrics is 'Daily aggregated performance metrics for each BMad pathway';
comment on table bmad_user_behavior is 'Individual user behavior patterns and preferences discovered during sessions';
comment on table bmad_ab_experiments is 'A/B testing experiment definitions and results';
comment on table bmad_ab_assignments is 'User assignments to specific experiment variants';
comment on table bmad_session_quality_scores is 'Quality assessment scores for completed BMad sessions';
comment on table bmad_optimization_insights is 'AI-generated insights and recommendations for system optimization';

comment on function calculate_engagement_score(uuid) is 'Calculates user engagement score based on session interaction patterns';
comment on function aggregate_pathway_metrics(date) is 'Aggregates daily metrics for all pathways on specified date';