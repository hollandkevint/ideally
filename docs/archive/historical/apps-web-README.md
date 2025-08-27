# 🧠 ideally.co - Strategic Thinking Workspace

**AI-powered strategic workspace that amplifies how you think through complex business challenges**

> Transform scattered thoughts into strategic clarity with Mary, your AI strategic thinking partner, in a dual-pane workspace designed for executive decision-making.

## 🎯 **What Makes ideally.co Different**

Unlike generic AI chat tools, ideally.co is built specifically for **strategic thinking**:

- **Mary**: AI Business Analyst with 15+ years strategic consulting experience
- **Dual-Pane Interface**: Chat + Visual Canvas mirrors how executives actually think
- **Strategic Context**: Maintains full thinking history for each major decision
- **Structured Analysis**: Goes beyond Q&A to systematic strategic reasoning

## 🚀 **Current Implementation Status**

### ✅ **Core Features Complete**
- **Authentication & User Management** (Supabase)
- **Real-time AI Integration** (Claude API with streaming)
- **Workspace Management** (Persistent strategic contexts)
- **Enhanced Response Formatting** (Markdown with visual hierarchy)
- **Security & Compliance** (HIPAA-ready infrastructure)

### 🔧 **Technical Architecture**
- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Claude 3.5 Sonnet via Anthropic API
- **Styling**: Tailwind CSS with custom strategic workspace themes
- **Deployment**: Vercel-ready with edge functions

## 🏁 **Getting Started**

### Prerequisites
- Node.js 18+
- Supabase project
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/[username]/ideally.co.git
   cd ideally.co/apps/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to access your strategic workspace.

## ⚙️ **Environment Variables**

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `ANTHROPIC_API_KEY` | Claude AI API key | ✅ |
| `NEXT_PUBLIC_ENABLE_CANVAS` | Enable visual canvas (future) | ❌ |

## 🧪 **Testing & Validation**

### Manual Testing Checklist
- [ ] User registration and email confirmation
- [ ] Workspace creation and management
- [ ] Real-time AI conversations with Mary
- [ ] Response formatting and markdown rendering
- [ ] Session persistence and context retention

### API Health Checks
```bash
# Test Claude API connection
curl -X GET http://localhost:3000/api/chat/stream

# Test authentication
curl -X POST http://localhost:3000/api/auth/verify
```

## 📊 **Key Metrics & Performance**

- **AI Response Time**: ~15 seconds for comprehensive strategic analysis
- **Concurrent Users**: Designed for 100+ simultaneous strategic sessions
- **Data Retention**: Full conversation history with strategic context
- **Security**: End-to-end encryption with audit trails

## 🎨 **Design System**

### Strategic Workspace Theme
- **Primary**: Professional blue palette for trust and clarity
- **Typography**: Geist font family for readability
- **Layout**: 60/40 split (Chat/Canvas) optimized for strategic thinking
- **Components**: Custom markdown rendering for structured responses

## 🔄 **Development Workflow**

### Current Sprint Focus
- **Claude AI Integration**: ✅ Complete with streaming responses
- **Enhanced Formatting**: ✅ Complete with markdown rendering
- **Next**: BMad Method Analyst Workflow (Strategic frameworks)

### Code Quality
- **TypeScript**: Strict mode with comprehensive type safety
- **ESLint**: Custom rules for consistency
- **Prettier**: Automated code formatting
- **Git Hooks**: Pre-commit validation

## 🚦 **Deployment**

### Production Checklist
- [ ] Environment variables configured
- [ ] Supabase production database setup
- [ ] Domain and SSL certificates
- [ ] Claude API rate limits configured
- [ ] Monitoring and error tracking

### Vercel Deployment
```bash
# One-command deployment
vercel --prod
```

## 📈 **Roadmap**

### Phase 1: Core Strategic AI (✅ Complete)
- Mary AI integration with strategic persona
- Workspace management and persistence
- Real-time streaming conversations

### Phase 2: Visual Strategy Canvas (Next)
- BMad Method integration
- Strategic framework templates
- Visual thinking tools

### Phase 3: Collaboration Features
- Team workspaces
- Stakeholder feedback loops
- Strategy presentation tools

## 🤝 **Contributing**

We welcome contributions that enhance strategic thinking capabilities:

1. **Strategic Frameworks**: New business analysis methodologies
2. **AI Enhancements**: Improved reasoning patterns for Mary
3. **Visual Tools**: Canvas integrations and strategic templates
4. **User Experience**: Workflow optimizations for executives

## 📄 **License**

Copyright © 2024 Kevin Kellogg. All rights reserved.

---

*Built by [Kevin Kellogg](https://github.com/[username]) - Transforming strategic thinking through AI*