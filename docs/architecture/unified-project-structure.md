# Unified Project Structure

```text
thinkhaven/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── test.yaml          # Test automation
│       └── deploy.yaml        # Deployment pipeline
├── apps/                       # Application packages
│   └── web/                    # Next.js application
│       ├── app/                # Next.js App Router
│       │   ├── workspace/[id]/ # Main dual-pane interface
│       │   ├── components/     # UI components
│       │   │   ├── chat/       # AI conversation interface
│       │   │   ├── bmad/       # Strategic framework UI
│       │   │   ├── workspace/  # Workspace management
│       │   │   ├── dual-pane/  # Layout components
│       │   │   └── canvas/     # Visual workspace (planned)
│       │   ├── api/            # API endpoints
│       │   │   ├── chat/       # AI streaming endpoints
│       │   │   ├── workspaces/ # Workspace CRUD
│       │   │   ├── bmad/       # Strategic analysis API
│       │   │   └── export/     # Data export
│       │   ├── globals.css     # Tailwind CSS imports
│       │   ├── layout.tsx      # Root layout
│       │   └── page.tsx        # Landing page
│       ├── lib/                # Application libraries
│       │   ├── ai/             # Claude integration suite
│       │   │   ├── claude-client.ts    # API client
│       │   │   ├── mary-persona.ts     # Coaching persona
│       │   │   ├── streaming.ts        # SSE handling
│       │   │   └── context-manager.ts  # Context management
│       │   ├── bmad/           # Strategic framework engine
│       │   │   ├── analysis/   # Business analysis engines
│       │   │   ├── templates/  # Strategic templates
│       │   │   └── pathways/   # Thinking pathways
│       │   ├── supabase/       # Database integration
│       │   │   ├── client.ts   # Client-side
│       │   │   ├── server.ts   # Server-side
│       │   │   └── middleware.ts # Auth middleware
│       │   ├── stores/         # State management
│       │   └── auth/           # Authentication context
│       ├── types/              # TypeScript definitions
│       │   ├── database.ts     # Database types
│       │   ├── ai.ts          # AI integration types
│       │   └── bmad.ts        # Strategic framework types
│       ├── tests/              # Test suite
│       │   ├── lib/           # Library tests
│       │   ├── api/           # API tests
│       │   ├── integration/    # Integration tests
│       │   └── e2e/           # End-to-end tests
│       ├── public/            # Static assets
│       ├── .env.example       # Environment template
│       └── package.json       # App dependencies
├── packages/                   # Shared packages (future)
├── .bmad-core/                # BMad Method framework
│   ├── agents/                # AI agent personas
│   ├── tasks/                 # Structured workflows
│   └── templates/             # Document templates
├── docs/                      # Documentation
│   ├── prd/                   # Product requirements (sharded)
│   ├── architecture.md        # This document
│   └── brownfield-architecture.md # Current state analysis
├── scripts/                   # Build/deploy scripts
├── .env.example               # Environment template
├── package.json               # Root package.json
├── turbo.json                 # Turborepo configuration (future)
└── README.md
```
