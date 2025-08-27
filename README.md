# 🎯 ideally.co - AI-Powered Strategic Thinking Workspace

**Status:** 🚀 **PRODUCTION READY** - BMad Method fully deployed and operational

## What This Is

ideally.co is a sophisticated strategic thinking workspace that combines **Claude Sonnet 4 AI coaching** with the **BMad Method framework** to deliver professional-grade strategic thinking sessions in 30-75 minutes.

### Core Features (Live Now):
- ✅ **AI Strategic Coaching** - Mary AI persona with 15+ years professional experience
- ✅ **BMad Method Integration** - 3 pathways: New Idea Development, Business Model Analysis, Strategic Optimization
- ✅ **Interactive Sessions** - Numbered elicitation system (1-9) with real-time progress tracking
- ✅ **Session Management** - Pause/resume functionality with complete state persistence
- ✅ **Professional UI** - Mobile-responsive design with accessibility features
- ✅ **Secure Platform** - Supabase authentication with Row Level Security

## Quick Start

### For Users:
- **Production Site:** https://ideally.co
- **Create Account** → **Access Workspace** → **Choose BMad Method Tab** → **Start Session**

### For Developers:
```bash
# Clone and setup
git clone https://github.com/hollandkevint/ideally.git
cd ideally/apps/web
npm install
npm run dev
# Visit: http://localhost:3000
```

## Documentation

📁 **All documentation is organized in `/docs/`**

### **Current Implementation:**
- [`/docs/README.md`](./docs/README.md) - Complete documentation overview
- [`/docs/current/`](./docs/current/) - Accurate, up-to-date implementation details
- [`/docs/current/production-state/`](./docs/current/production-state/) - Current system status

### **Future Roadmap:**
- [`/docs/reference/prd-bmad.md`](./docs/reference/prd-bmad.md) - Complete product vision (5 epics)
- [`/docs/future/`](./docs/future/) - Enhancement planning and roadmap

### **Historical Archive:**
- [`/docs/archive/`](./docs/archive/) - Outdated documentation with clear warnings

## Current Architecture

```
ideally.co Production Stack
├── Frontend: Next.js 15 + TypeScript + Tailwind CSS
├── AI Integration: Claude Sonnet 4 API (@anthropic-ai/sdk)
├── Database: Supabase PostgreSQL (12 BMad tables)
├── Authentication: Supabase Auth with RLS policies
├── Deployment: Vercel with automatic GitHub integration
└── Session Management: Real-time state persistence
```

## BMad Method Integration

**Live Pathways:**
1. **New Idea Development** (45 min) - Transform concepts into validated opportunities
2. **Business Model Analysis** (60 min) - Revenue streams and value proposition analysis
3. **Strategic Optimization** (75 min) - Data-driven improvement recommendations

**AI Persona System:**
- **Mary AI** - Analytical strategic coach with adaptive guidance
- **Interactive Elicitation** - Numbered options (1-9) with custom input
- **Progress Tracking** - Real-time completion percentages and time allocation

## Next Development Phase

**Recommended Epic:** Visual Canvas Integration & Export Engine
- Dual-pane interface (conversation + visual canvas)
- Mermaid.js diagram integration
- Professional document generation
- Export to Notion, Miro, Figma, PDF

See [`/docs/reference/prd-bmad.md`](./docs/reference/prd-bmad.md) for complete 5-epic roadmap.

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Supabase project (configured and operational)

### Environment Configuration
```bash
# apps/web/.env.local (configured)
NEXT_PUBLIC_SUPABASE_URL=https://lbnhfsocxbwhbvnfpjdw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[configured]
SUPABASE_SERVICE_ROLE_KEY=[configured]
ANTHROPIC_API_KEY=[configured]
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

## Contributing

1. Review current implementation in [`/docs/current/`](./docs/current/)
2. Check the comprehensive PRD for future features
3. Follow existing code patterns and TypeScript standards
4. Test with the live BMad Method system

## Support

- **Issues:** [GitHub Issues](https://github.com/hollandkevint/ideally/issues)
- **Documentation:** [`/docs/README.md`](./docs/README.md)
- **Technical Reference:** [`/docs/current/technical-reference/`](./docs/current/technical-reference/)

---

**🎉 The BMad Method strategic framework is live and ready for users. Experience AI-powered strategic thinking at [ideally.co](https://ideally.co)**