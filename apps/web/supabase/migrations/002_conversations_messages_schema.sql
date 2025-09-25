-- Conversations and Messages schema for AI coaching interface
-- This schema supports the conversational AI coaching system with Claude Sonnet 4

-- Enable required extensions if not already enabled
create extension if not exists "uuid-ossp";

-- Main conversations table
create table if not exists conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  workspace_id uuid not null, -- references workspace (assume existing table)
  title text,
  context_summary text,
  bmad_session_id uuid references bmad_sessions(id) on delete set null,
  message_count integer default 0,
  total_tokens integer default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages table for storing chat messages
create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  message_index integer not null,
  token_usage jsonb,
  coaching_context jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  
  -- Ensure message indexes are unique per conversation
  unique(conversation_id, message_index)
);

-- Conversation context table for storing summaries and key information
create table if not exists conversation_context (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  context_type text not null check (context_type in ('summary', 'key_points', 'phase_transition', 'coaching_insight')),
  content text not null,
  message_range_start integer,
  message_range_end integer,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Message bookmarks table for saving important messages
create table if not exists message_bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  message_id uuid references messages(id) on delete cascade not null,
  title text not null,
  description text,
  tags text[] default '{}',
  color text default 'blue',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Ensure one bookmark per user per message
  unique(user_id, message_id)
);

-- Message references table for linking related messages
create table if not exists message_references (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  from_message_id uuid references messages(id) on delete cascade not null,
  to_message_id uuid references messages(id) on delete cascade not null,
  reference_type text not null check (reference_type in ('reply', 'follow_up', 'contradiction', 'elaboration', 'related')),
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  
  -- Ensure unique references between messages
  unique(from_message_id, to_message_id, reference_type)
);

-- Indexes for optimal performance
create index if not exists idx_conversations_user_id on conversations(user_id);
create index if not exists idx_conversations_workspace_id on conversations(workspace_id);
create index if not exists idx_conversations_bmad_session_id on conversations(bmad_session_id);
create index if not exists idx_conversations_created_at on conversations(created_at);
create index if not exists idx_conversations_updated_at on conversations(updated_at);

create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_messages_role on messages(role);
create index if not exists idx_messages_created_at on messages(created_at);
create index if not exists idx_messages_message_index on messages(conversation_id, message_index);

create index if not exists idx_conversation_context_conversation_id on conversation_context(conversation_id);
create index if not exists idx_conversation_context_type on conversation_context(context_type);
create index if not exists idx_conversation_context_created_at on conversation_context(created_at);

create index if not exists idx_message_bookmarks_user_id on message_bookmarks(user_id);
create index if not exists idx_message_bookmarks_message_id on message_bookmarks(message_id);
create index if not exists idx_message_bookmarks_tags on message_bookmarks using gin(tags);

create index if not exists idx_message_references_user_id on message_references(user_id);
create index if not exists idx_message_references_from_message on message_references(from_message_id);
create index if not exists idx_message_references_to_message on message_references(to_message_id);

-- Full text search index for messages
create index if not exists messages_content_search_idx 
on messages using gin(to_tsvector('english', content));

-- Function to automatically set message_index
create or replace function set_message_index()
returns trigger as $$
begin
  -- Get the next message index for this conversation
  select coalesce(max(message_index), -1) + 1
  into new.message_index
  from messages
  where conversation_id = new.conversation_id;
  
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-set message_index if not provided
create trigger set_message_index_trigger
before insert on messages
for each row
when (new.message_index is null)
execute function set_message_index();

-- Function to increment message count and update timestamps
create or replace function increment_message_count(conversation_uuid uuid, token_count integer default 0)
returns void as $$
begin
  update conversations 
  set 
    message_count = message_count + 1,
    total_tokens = total_tokens + token_count,
    updated_at = now()
  where id = conversation_uuid;
end;
$$ language plpgsql;

-- Function to summarize conversation context
create or replace function summarize_conversation(conversation_uuid uuid, start_index integer, end_index integer)
returns text as $$
declare
  summary text;
begin
  -- Get concatenated messages in range for summary context
  select string_agg(
    case when role = 'user' then 'User: ' else 'Assistant: ' end || 
    left(content, 500),
    E'\n'
    order by message_index
  )
  into summary
  from messages
  where conversation_id = conversation_uuid
    and message_index between start_index and end_index;
  
  return summary;
end;
$$ language plpgsql;

-- Row Level Security policies
alter table conversations enable row level security;
alter table messages enable row level security;
alter table conversation_context enable row level security;
alter table message_bookmarks enable row level security;
alter table message_references enable row level security;

-- Users can only access their own conversations
create policy "Users can view their conversations" on conversations
  for select using (user_id = auth.uid());

create policy "Users can create conversations" on conversations
  for insert with check (user_id = auth.uid());

create policy "Users can update their conversations" on conversations
  for update using (user_id = auth.uid());

create policy "Users can delete their conversations" on conversations
  for delete using (user_id = auth.uid());

-- Messages belong to conversations that users own
create policy "Users can view messages in their conversations" on messages
  for select using (
    exists (
      select 1 from conversations 
      where conversations.id = messages.conversation_id 
        and conversations.user_id = auth.uid()
    )
  );

create policy "Users can create messages in their conversations" on messages
  for insert with check (
    exists (
      select 1 from conversations 
      where conversations.id = messages.conversation_id 
        and conversations.user_id = auth.uid()
    )
  );

create policy "Users can update messages in their conversations" on messages
  for update using (
    exists (
      select 1 from conversations 
      where conversations.id = messages.conversation_id 
        and conversations.user_id = auth.uid()
    )
  );

create policy "Users can delete messages in their conversations" on messages
  for delete using (
    exists (
      select 1 from conversations 
      where conversations.id = messages.conversation_id 
        and conversations.user_id = auth.uid()
    )
  );

-- Context belongs to conversations that users own
create policy "Users can view context in their conversations" on conversation_context
  for select using (
    exists (
      select 1 from conversations 
      where conversations.id = conversation_context.conversation_id 
        and conversations.user_id = auth.uid()
    )
  );

create policy "Users can create context in their conversations" on conversation_context
  for insert with check (
    exists (
      select 1 from conversations 
      where conversations.id = conversation_context.conversation_id 
        and conversations.user_id = auth.uid()
    )
  );

-- Users can only access their own bookmarks
create policy "Users can view their bookmarks" on message_bookmarks
  for select using (user_id = auth.uid());

create policy "Users can create bookmarks" on message_bookmarks
  for insert with check (user_id = auth.uid());

create policy "Users can update their bookmarks" on message_bookmarks
  for update using (user_id = auth.uid());

create policy "Users can delete their bookmarks" on message_bookmarks
  for delete using (user_id = auth.uid());

-- Users can only access their own references
create policy "Users can view their references" on message_references
  for select using (user_id = auth.uid());

create policy "Users can create references" on message_references
  for insert with check (user_id = auth.uid());

create policy "Users can delete their references" on message_references
  for delete using (user_id = auth.uid());

-- Grant necessary permissions to authenticated users
grant all on conversations to authenticated;
grant all on messages to authenticated;
grant all on conversation_context to authenticated;
grant all on message_bookmarks to authenticated;
grant all on message_references to authenticated;

grant execute on function increment_message_count to authenticated;
grant execute on function summarize_conversation to authenticated;

-- Add helpful comments
comment on table conversations is 'Stores AI coaching conversation sessions';
comment on table messages is 'Individual messages within conversations';
comment on table conversation_context is 'Context summaries and key information for conversation coherence';
comment on table message_bookmarks is 'User bookmarks for important messages';
comment on table message_references is 'References between related messages';

comment on column conversations.context_summary is 'AI-generated summary of the conversation context';
comment on column conversations.bmad_session_id is 'Optional link to BMad Method session if conversation is part of structured coaching';
comment on column messages.token_usage is 'Claude API token usage statistics for this message';
comment on column messages.coaching_context is 'Structured coaching context used for this response';
comment on column conversation_context.context_type is 'Type of context: summary, key_points, phase_transition, or coaching_insight';