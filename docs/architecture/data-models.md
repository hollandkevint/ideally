# Data Models

## Core Business Entities

The system centers around strategic coaching sessions with persistent conversation history and business analysis capabilities.

### User

**Purpose:** Authentication and workspace ownership with coaching preferences

**Key Attributes:**
- id: string - Supabase user identifier
- email: string - Primary authentication
- profile: UserProfile - Coaching preferences and session history
- created_at: timestamp - Account creation date

**TypeScript Interface:**
```typescript
interface User {
  id: string;
  email: string;
  profile?: UserProfile;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  display_name?: string;
  coaching_preferences?: CoachingPreferences;
  bmad_expertise_level?: 'beginner' | 'intermediate' | 'advanced';
}
```

**Relationships:**
- One-to-many with Workspaces
- One-to-many with Conversations

### Workspace

**Purpose:** Container for strategic thinking sessions combining chat and canvas elements

**Key Attributes:**
- id: string - Unique workspace identifier  
- name: string - User-defined workspace title
- description: string - Workspace purpose and context
- dual_pane_state: DualPaneState - Current interface configuration
- bmad_context: BMadContext - Strategic analysis state

**TypeScript Interface:**
```typescript
interface Workspace {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  dual_pane_state: DualPaneState;
  bmad_context?: BMadContext;
  canvas_elements: CanvasElement[];
  chat_context: ChatMessage[];
  created_at: string;
  updated_at: string;
}

interface DualPaneState {
  chat_width: number;
  canvas_width: number;
  active_pane: 'chat' | 'canvas';
  collapsed: boolean;
}
```

**Relationships:**
- Belongs-to User
- One-to-many with Conversations
- One-to-many with CanvasElements

### Conversation

**Purpose:** AI coaching conversation history with context and strategic insights

**Key Attributes:**
- id: string - Unique conversation identifier
- workspace_id: string - Associated workspace
- title: string - Conversation summary title
- messages: Message[] - Chat message history
- coaching_context: CoachingContext - Mary persona context
- bmad_session_id: string - Associated strategic analysis session

**TypeScript Interface:**
```typescript
interface Conversation {
  id: string;
  user_id: string;
  workspace_id: string;
  title?: string;
  context_summary?: string;
  coaching_context: CoachingContext;
  bmad_session_id?: string;
  message_count: number;
  total_tokens: number;
  created_at: string;
  updated_at: string;
}

interface CoachingContext {
  session_goals?: string[];
  current_phase?: string;
  strategic_focus?: string;
  personality_insights?: Record<string, any>;
}
```

**Relationships:**
- Belongs-to User
- Belongs-to Workspace
- One-to-many with Messages
- Optional relationship with BMadSession

### Message

**Purpose:** Individual chat messages with AI coaching responses and metadata

**Key Attributes:**
- id: string - Message identifier
- conversation_id: string - Parent conversation
- role: 'user' | 'assistant' - Message author
- content: string - Message text content
- token_usage: TokenUsage - API usage tracking
- strategic_tags: string[] - BMad method tagging

**TypeScript Interface:**
```typescript
interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  token_usage?: TokenUsage;
  strategic_tags?: string[];
  bookmarked: boolean;
  references?: MessageReference[];
  created_at: string;
}

interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_estimate_usd?: number;
}
```

**Relationships:**
- Belongs-to Conversation
- Optional many-to-many with MessageReferences
