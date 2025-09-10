# Tech Stack

## Technology Stack Table

| Category             | Technology      | Version | Purpose                        | Rationale                                    |
| -------------------- | --------------- | ------- | ------------------------------ | -------------------------------------------- |
| Frontend Language    | TypeScript      | 5.x     | Type-safe frontend development | Essential for AI integration complexity      |
| Frontend Framework   | Next.js         | 15.5.0  | React framework with SSR/SSG   | App Router + Turbopack for optimal performance |
| UI Framework         | React           | 19.1.0  | Component-based UI             | Latest with concurrent features for AI streaming |
| UI Component Library | Custom + Tailwind | 4.0    | Design system implementation   | Tailwind 4.0 with container queries         |
| State Management     | Zustand         | 5.0.8   | Lightweight state management   | Perfect for dual-pane coordination          |
| Backend Language     | TypeScript      | 5.x     | Full-stack type safety         | Shared types between frontend/backend       |
| Backend Framework    | Next.js API     | 15.5.0  | Serverless API endpoints       | Integrated with frontend, edge deployment   |
| API Style            | REST + SSE      | -       | RESTful with real-time streaming | Server-Sent Events for AI conversation     |
| Database             | Supabase        | 2.56.0  | PostgreSQL with real-time      | Integrated auth, real-time, vector support |
| Cache                | Vercel Cache    | -       | Edge caching                   | Built-in CDN caching for static assets     |
| File Storage         | Supabase Storage | 2.56.0 | User files and exports         | Integrated with database and auth           |
| Authentication       | Supabase Auth   | 2.56.0  | User management and sessions   | Row Level Security, social auth support    |
| AI Integration       | Anthropic Claude | 0.27.3 | Strategic coaching AI          | Sonnet 4.0 with streaming capabilities     |
| Frontend Testing     | Vitest          | 3.2.4   | Fast unit testing              | Modern alternative to Jest                  |
| Backend Testing      | Vitest          | 3.2.4   | API endpoint testing           | Unified testing framework                   |
| E2E Testing          | Playwright      | Latest  | End-to-end user flows          | AI conversation flow testing               |
| Build Tool           | Turbopack       | Latest  | Fast development builds        | Next.js 15 integrated bundler             |
| Bundler              | Turbopack       | Latest  | Production bundling            | Rust-based bundler for speed              |
| IaC Tool             | Vercel CLI      | Latest  | Deployment configuration       | Platform-native deployment                |
| CI/CD                | GitHub Actions  | -       | Automated deployment           | Integrated with Vercel deployment         |
| Monitoring           | Vercel Analytics | -      | Performance and errors         | Built-in monitoring and logging           |
| Logging              | Vercel Logs     | -       | Application logging            | Serverless function logs                  |
| CSS Framework        | Tailwind CSS    | 4.0     | Utility-first styling          | Container queries, modern CSS features   |
