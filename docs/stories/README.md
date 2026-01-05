# ThinkHaven Stories Directory Structure

This directory contains user stories organized by epic and completion status.

## Current Project Status (January 2026)

| Epic | Status | Description |
|------|--------|-------------|
| **Epic 6** | **P0 - Active** | Sub-Persona MVP - Core differentiator |
| Strategic Pivot | **Done** | Repositioned as "Decision Accelerator" |
| Epic 0 | **Done** | Authentication fixes |
| Epic 1 | **Done** | Core platform improvements |
| Epic 2 | **Done** | BMad Method pathways |
| Epic 3 | **Partial** | Framework export (3.1 done, 3.2 deferred) |
| Epic 4 | **Paused** | Monetization - Pending pricing validation |
| Epic 5 | **Future** | Analytics - Requires Epic 4 |

## Directory Structure

### Priority: Epic 6 - Sub-Persona MVP (P0)
- **`epic-6-sub-persona-mvp/`** - Core differentiator implementation - **Active**
  - 6.1: Wire Sub-Persona to Claude API
  - 6.2: Dynamic Mode Shifting
  - 6.3: Kill Recommendation System
  - 6.4: Output Polish (Lean Canvas + PRD)
  - 6.5: 10-Message Trial Gate
  - 6.6: Mode Indicator UI

### Completed: Strategic Pivot
- **`strategic-pivot/`** - Positioning and PMF stories (SP.x) - **Done**
  - SP.1: Enable BMad Pathways as Default Experience
  - SP.2: Define Single Urgent Use Case (Idea Validation)
  - SP.3: Test Premium Pricing ($99 One-Time)

### Active Development Stories
- **`epic-0-auth-fixes/`** - Authentication-related fixes (Stories 0.x) - **Done**
- **`epic-1-core-improvements/`** - Core platform improvements (Stories 1.x) - **Done**
- **`epic-2-bmad-pathways/`** - BMad Method pathway implementations (Stories 2.x) - **Done**
- **`epic-3-framework-export/`** - PDF & Markdown export (Stories 3.x) - **Partial**
- **`epic-4-monetization/`** - Session credit system, Stripe integration (Stories 4.x) - **Paused**
- **`epic-5-analytics/`** - Business model assumption testing (Stories 5.x) - **Future**

### Support Directories
- **`bug-fixes/`** - Bug fixes and hotfixes
- **`technical-debt/`** - Technical debt stories (TD.x)

### Archive
- **`archive/completed/`** - Successfully completed and delivered stories
- **`archive/superseded/`** - Older versions of stories that have been updated or replaced
- **`archive/historical/`** - Original planning stories from early development (2025 Q2-Q3)

## Story Naming Convention

### Active Stories
- `{epic}.{sequence}.{brief-description}.md`
- Examples:
  - `2.3.business-model-problem-revenue-analysis-pathway.md`
  - `4.1.session-credit-system.md`

### Technical Debt Stories
- `TD.{sequence}.{brief-description}.story.md`
- Example: `TD.1.oauth-e2e-tests.story.md`

### Bug Fix Stories
- `fix-{brief-description}-v{version}.md` (if versioned)
- `fix-{brief-description}.md` (single version)

## Story Status Labels

Stories use the following status labels:

| Status | Description |
|--------|-------------|
| **Draft** | New story, needs refinement |
| **Ready** | Story reviewed, ready for implementation |
| **In Progress** | Currently being worked on |
| **Done** | Completed and validated |
| **Deferred** | Deprioritized for later |
| **Future** | Planned for a future epic |

## Next Steps Priority

### P0: Epic 6 - Sub-Persona MVP (January 2026)
Core differentiator that makes ThinkHaven work:

1. **6.1: Wire Sub-Persona to Claude API** - Connect mode logic to actual responses
2. **6.2: Dynamic Mode Shifting** - Detect user state, adjust in real-time
3. **6.3: Kill Recommendation System** - Honest judgment with escalation
4. **6.4: Output Polish** - Lean Canvas + PRD/Spec generators
5. **6.5: 10-Message Trial Gate** - Bump from 5, partial output at gate
6. **6.6: Mode Indicator UI** - Visual feedback on current mode

### P1: After Sub-Persona Complete
7. **Epic 4: Monetization** - Implement LTD pricing ($199-499)
   - Story 4.1: Adapt based on sub-persona feedback

### P2: After MVP Launch
8. **Epic 5: Analytics** - Track assumption validation
9. **Epic 3.2: Advanced Integrations** - Based on user feedback

## Cleanup History

**January 4, 2026 - Epic 6 Created**
- Created `epic-6-sub-persona-mvp/` folder with 6 stories
- Added epic overview and implementation order
- Sub-persona types/logic already implemented in `mary-persona.ts` (67 tests)
- Strategic direction refined via interview process
- Design system updated with Wes Anderson palette

**December 16, 2025 - Strategic Pivot Stories**
- Created `strategic-pivot/` folder for PMF validation
- Added SP.1: Enable BMad Pathways as Default Experience
- Added SP.2: Define Single Urgent Use Case (Idea Validation)
- Added SP.3: Test Premium Pricing ($99 One-Time)
- Paused Epic 4 pending pricing validation

**December 16, 2025 - Story Reorganization**
- Created `epic-5-analytics/` folder for future analytics work
- Moved Story 5.1 from epic-2-bmad-pathways to epic-5-analytics
- Updated Story 3.2 status to Deferred
- Added project status summary to README

**October 13, 2025 - Documentation Consolidation**
- Unified story archives into single location
- Moved 11 historical stories from `/docs/archive/historical/stories/` to `stories/archive/historical/`
- Created cross-reference system between historical and completed stories

**September 24, 2025 - Story Organization**
- Archived 8 completed stories marked as DONE
- Moved 4 superseded story versions to archive
- Organized remaining 18 active stories by epic/category

## Historical Story Reference

The `archive/historical/` directory contains the **original planning stories** from early ThinkHaven development (2025 Q2-Q3). These stories represent the initial product vision:

### Historical Stories (Original Vision)
- 1.1 - Project Setup
- 1.2 - Authentication & Workspace
- 1.3 - Dual-Pane Interface
- 1.4 - Conversational AI Coaching
- 1.5 - Interactive Visual Canvas
- 1.6 - Mermaid Diagram Integration
- 1.7 - Context Bridging Chat<->Canvas
- 2.1 - Choose-Your-Adventure Launcher
- 2.2 - BMad Core Integration
- 2.3 - 30-Minute Strategic Session
- 2.4 - Adaptive Persona System

### Completed Stories (Actual Implementation)
See `archive/completed/` for delivered versions with implementation details.

**Note**: Historical stories are preserved for reference but reflect original planning. For actual implementation status, see completed stories or `/docs/current/production-state/`.
