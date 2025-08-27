-- Ideally.co - Strategic Workspace Database Schema
-- Generated from Epic 1 Stories (1.1-1.7)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Story 1.2)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Single workspace per user (MVP approach from Story 1.2)
CREATE TABLE user_workspace (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    workspace_state JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat conversations with Mary persona context (Story 1.4)
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES user_workspace(user_id) ON DELETE CASCADE,
    mary_persona_config JSONB NOT NULL DEFAULT '{}',
    conversation_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages storage (Story 1.4)
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    strategic_tags TEXT[],
    canvas_references UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strategic insights extracted from conversations (Story 1.4)
CREATE TABLE strategic_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    content TEXT NOT NULL,
    framework_used TEXT,
    canvas_element_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Markdown documents for processing (Story 1.5 - Post-MVP)
CREATE TABLE markdown_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES user_workspace(user_id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    analysis_result JSONB DEFAULT '{}',
    visual_suggestions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canvas annotations linked to chat context (Story 1.5 & 1.7)
CREATE TABLE canvas_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES user_workspace(user_id) ON DELETE CASCADE,
    element_id TEXT NOT NULL, -- Excalidraw element ID
    annotation_text TEXT,
    linked_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mermaid diagrams storage with version control (Story 1.6)
CREATE TABLE mermaid_diagrams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES user_workspace(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    diagram_type TEXT NOT NULL,
    mermaid_code TEXT NOT NULL,
    rendered_svg TEXT,
    version INTEGER DEFAULT 1,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diagram version history for change tracking (Story 1.6)
CREATE TABLE diagram_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagram_id UUID REFERENCES mermaid_diagrams(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    mermaid_code TEXT NOT NULL,
    changes_summary TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Context bridging system (Story 1.7)
CREATE TABLE context_bridges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES user_workspace(user_id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('chat_message', 'canvas_element', 'mermaid_diagram')),
    source_id UUID NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('chat_message', 'canvas_element', 'mermaid_diagram')),
    target_id UUID NOT NULL,
    bridge_type TEXT NOT NULL CHECK (bridge_type IN ('reference', 'suggestion', 'evolution', 'conflict')),
    confidence_score DECIMAL(3,2),
    user_validated BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strategic workflow sessions (Story 1.7)
CREATE TABLE workflow_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES user_workspace(user_id) ON DELETE CASCADE,
    workflow_type TEXT NOT NULL,
    current_phase TEXT NOT NULL,
    completion_progress DECIMAL(5,2) DEFAULT 0,
    session_state JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cross-references between diagrams and other workspace elements (Story 1.6)
CREATE TABLE diagram_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagram_id UUID REFERENCES mermaid_diagrams(id) ON DELETE CASCADE,
    reference_type TEXT NOT NULL CHECK (reference_type IN ('chat_message', 'canvas_element', 'insight')),
    reference_id UUID NOT NULL,
    reference_context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance optimization indexes
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_strategic_insights_conversation ON strategic_insights(conversation_id);
CREATE INDEX idx_context_bridges_source ON context_bridges(source_type, source_id);
CREATE INDEX idx_context_bridges_target ON context_bridges(target_type, target_id);
CREATE INDEX idx_mermaid_diagrams_workspace ON mermaid_diagrams(workspace_id);
CREATE INDEX idx_canvas_annotations_workspace ON canvas_annotations(workspace_id);
CREATE INDEX idx_workflow_sessions_workspace ON workflow_sessions(workspace_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workspace ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE markdown_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mermaid_diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagram_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_bridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagram_references ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user isolation
CREATE POLICY "Users can only access their own data" ON users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access their workspace" ON user_workspace
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their conversations" ON chat_conversations
    FOR ALL USING (workspace_id = auth.uid());

CREATE POLICY "Users can only access their messages" ON chat_messages
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM chat_conversations WHERE workspace_id = auth.uid()
        )
    );

CREATE POLICY "Users can only access their insights" ON strategic_insights
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM chat_conversations WHERE workspace_id = auth.uid()
        )
    );

CREATE POLICY "Users can only access their documents" ON markdown_documents
    FOR ALL USING (workspace_id = auth.uid());

CREATE POLICY "Users can only access their annotations" ON canvas_annotations
    FOR ALL USING (workspace_id = auth.uid());

CREATE POLICY "Users can only access their diagrams" ON mermaid_diagrams
    FOR ALL USING (workspace_id = auth.uid());

CREATE POLICY "Users can only access their diagram versions" ON diagram_versions
    FOR ALL USING (
        diagram_id IN (
            SELECT id FROM mermaid_diagrams WHERE workspace_id = auth.uid()
        )
    );

CREATE POLICY "Users can only access their context bridges" ON context_bridges
    FOR ALL USING (workspace_id = auth.uid());

CREATE POLICY "Users can only access their workflow sessions" ON workflow_sessions
    FOR ALL USING (workspace_id = auth.uid());

CREATE POLICY "Users can only access their diagram references" ON diagram_references
    FOR ALL USING (
        diagram_id IN (
            SELECT id FROM mermaid_diagrams WHERE workspace_id = auth.uid()
        )
    );

-- Functions for automated workspace creation (Story 1.2 MVP)
CREATE OR REPLACE FUNCTION create_user_workspace()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_workspace (user_id, workspace_state)
    VALUES (NEW.id, '{"initialized": true, "created_at": "' || NOW() || '"}');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_workspace();

-- Function for updating workspace timestamps
CREATE OR REPLACE FUNCTION update_workspace_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_workspace 
    SET updated_at = NOW()
    WHERE user_id = NEW.workspace_id OR user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for workspace timestamp updates
CREATE TRIGGER update_workspace_on_chat
    AFTER INSERT OR UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_workspace_timestamp();

CREATE TRIGGER update_workspace_on_diagram
    AFTER INSERT OR UPDATE ON mermaid_diagrams
    FOR EACH ROW EXECUTE FUNCTION update_workspace_timestamp();