# ThinkHaven Stories Directory Structure

This directory contains user stories organized by epic and completion status.

## Directory Structure

### Active Development Stories
- **`epic-0-auth-fixes/`** - Authentication-related fixes and improvements (Stories 0.x)
- **`epic-1-core-improvements/`** - Core platform improvements (Stories 1.x)
- **`epic-2-bmad-pathways/`** - BMad Method pathway implementations (Stories 2.x, 5.x)
- **`bug-fixes/`** - Bug fixes and hotfixes
- **`technical-debt/`** - Technical debt stories (TD.x)

### Archive
- **`archive/completed/`** - Successfully completed and delivered stories marked as DONE
- **`archive/superseded/`** - Older versions of stories that have been updated or replaced
- **`archive/historical/`** - Original planning stories from early development (2025 Q2-Q3)

## Story Naming Convention

### Active Stories
- `{epic}.{sequence}.{brief-description}.md`
- Examples:
  - `1.4.conversational-ai-coaching-interface.md`
  - `2.2.new-idea-creative-expansion-pathway.md`

### Technical Debt Stories
- `TD.{sequence}.{brief-description}.story.md`
- Example: `TD.1.oauth-e2e-tests.story.md`

### Bug Fix Stories
- `fix-{brief-description}-v{version}.md` (if versioned)
- `fix-{brief-description}.md` (single version)

## Story Lifecycle

1. **Draft** - New story created, needs refinement
2. **Ready for Development** - Story reviewed and ready for implementation
3. **In Progress** - Currently being worked on by dev team
4. **Ready for Review** - Implementation complete, awaiting validation
5. **DONE** - Completed and validated, moved to archive

## Cleanup History

**October 13, 2025 - Documentation Consolidation**
- Unified story archives into single location
- Moved 11 historical stories from `/docs/archive/historical/stories/` → `stories/archive/historical/`
- Created cross-reference system between historical and completed stories
- All stories now in `/stories/` hierarchy for easier navigation

**September 24, 2025 - Story Organization**
- Archived 8 completed stories marked as DONE
- Moved 4 superseded story versions to archive
- Organized remaining 18 active stories by epic/category
- Reduced main directory from 30 to 0 active story files

## Historical Story Reference

The `archive/historical/` directory contains the **original planning stories** from early ThinkHaven development (2025 Q2-Q3). These stories represent the initial product vision and requirements that guided implementation:

### Historical Stories (Original Vision)
- 1.1 - Project Setup
- 1.2 - Authentication & Workspace
- 1.3 - Dual-Pane Interface
- 1.4 - Conversational AI Coaching
- 1.5 - Interactive Visual Canvas
- 1.6 - Mermaid Diagram Integration
- 1.7 - Context Bridging Chat↔Canvas
- 2.1 - Choose-Your-Adventure Launcher
- 2.2 - BMad Core Integration
- 2.3 - 30-Minute Strategic Session
- 2.4 - Adaptive Persona System

### Completed Stories (Actual Implementation)
See `archive/completed/` for delivered versions with implementation details.

**Note**: Historical stories are preserved for reference but reflect original planning. For actual implementation status, see completed stories or `/current/production-state/`.