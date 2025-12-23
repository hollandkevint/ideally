# Epic 5: Minimal UI Redesign

## Status
Ready for Development

## Epic Vision

Transform Thinkhaven's user interface with a clean, minimal aesthetic inspired by Notion - prioritizing content clarity and cognitive focus for strategic thinkers.

## Design Philosophy

**Core Principles:**
- **Generous whitespace** to reduce cognitive load
- **Bold, confident typography** hierarchy
- **Black/white base** with a single accent color (Notion-style blue)
- **Subtle visual elements** - no gradients, minimal shadows
- **Clean and uncluttered** - productivity-focused design

## Source Documentation

This epic is based on the UI/UX redesign plan located at:
- `.cursor/plans/minimal_ui_redesign_148caa43.plan.md`

## Stories Overview

### Foundation (Sequential Implementation Required)

**[Story 5.1: Design System Foundation](5.1.design-system-foundation.md)**
- Update globals.css with new design tokens, typography, and color palette
- Establish foundation for all subsequent UI changes
- **Must complete before all other stories**
- Estimated: 2-3 hours

**[Story 5.2: Font Configuration](5.2.font-configuration.md)**
- Configure DM Sans (headings) and DM Mono (code) fonts
- Replace Geist fonts with modern typography
- **Depends on 5.1**
- Estimated: 1 hour

### Page Redesigns (Can be implemented in parallel after 5.1-5.2)

**[Story 5.3: Landing Page Redesign](5.3.landing-page-redesign.md)**
- Complete redesign of app/page.tsx
- Hero section, social proof, feature cards, product preview
- Estimated: 4-6 hours

**[Story 5.4: Login Page Redesign](5.4.login-page-redesign.md)**
- Minimal centered authentication form
- OAuth primary, clean inputs
- Estimated: 2-3 hours

**[Story 5.5: Signup Page Redesign](5.5.signup-page-redesign.md)**
- Match login page style
- Simplified registration flow
- Estimated: 2 hours

**[Story 5.6: Dashboard Redesign](5.6.dashboard-redesign.md)**
- Fixed sidebar layout with session cards
- Welcome header and quick stats
- Estimated: 4-5 hours

**[Story 5.7: Workspace Refinement](5.7.workspace-refinement.md)**
- Refined dual-pane interface
- Improved chat styling and canvas toolbar
- Estimated: 3-4 hours

## Implementation Order

**Phase 1: Foundation** (MUST BE SEQUENTIAL)
1. Story 5.1 - Design System Foundation
2. Story 5.2 - Font Configuration

**Phase 2: Page Redesigns** (CAN BE PARALLEL)
3. Story 5.3 - Landing Page
4. Story 5.4 - Login Page
5. Story 5.5 - Signup Page
6. Story 5.6 - Dashboard
7. Story 5.7 - Workspace

## Technical Context

### Existing UI Framework
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with custom theme
- **Existing Components**: Button, Input, Card, Label, Form, Badge, Dropdown Menu, Separator
- **Color System**: OKLCH color model with HSL fallbacks
- **Mode**: Light mode only (dark mode deliberately disabled)

### Integration Points
All stories integrate with:
- Existing shadcn/ui component library
- Tailwind CSS configuration and utilities
- Next.js 15.5 App Router structure
- React 19 component patterns

### No New Components Required
The redesign uses existing UI components - no new component creation needed:
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/card.tsx`
- `components/ui/label.tsx`

### Files to Modify

| Story | Primary Files |
|-------|--------------|
| 5.1 | `apps/web/app/globals.css` |
| 5.2 | `apps/web/app/layout.tsx` |
| 5.3 | `apps/web/app/page.tsx` |
| 5.4 | `apps/web/app/login/page.tsx` |
| 5.5 | `apps/web/app/signup/page.tsx` |
| 5.6 | `apps/web/app/dashboard/page.tsx` |
| 5.7 | `apps/web/app/workspace/[id]/page.tsx` |

## Success Criteria

### Visual Design
- ✅ Consistent minimal aesthetic across all pages
- ✅ Bold typography hierarchy implemented
- ✅ Generous whitespace reducing cognitive load
- ✅ Single accent color (Notion-style blue) used consistently
- ✅ No gradients, minimal shadows

### Technical Quality
- ✅ All existing functionality preserved (no regressions)
- ✅ Responsive design maintained across devices
- ✅ Performance metrics unchanged or improved
- ✅ Accessibility standards maintained (WCAG 2.1 AA)

### User Experience
- ✅ Improved content clarity and readability
- ✅ Enhanced visual hierarchy guiding user attention
- ✅ Reduced visual clutter and distractions
- ✅ Professional, confident brand presentation

### Integration
- ✅ All stories follow existing component patterns
- ✅ No breaking changes to existing APIs or data structures
- ✅ Test suite updated and passing
- ✅ Documentation updated with new design patterns

## Risk Assessment

**Overall Risk Level: LOW**

This is a visual redesign with minimal technical risk:
- No database schema changes
- No API modifications
- No new dependencies
- Styling changes only

**Mitigation Strategies:**
- Sequential implementation (foundation first)
- Existing test suite validates functionality preservation
- shadcn/ui components already battle-tested
- Rollback via git revert if issues arise

## Dependencies

**Internal:**
- Existing shadcn/ui component library
- Tailwind CSS configuration
- Next.js App Router structure

**External:**
- DM Sans font from Google Fonts
- DM Mono font from Google Fonts

## Notes

- This is a **brownfield redesign** - all pages already exist
- Focus is on visual refinement, not functional changes
- Existing patterns and architecture preserved
- Sequential implementation order critical for consistency

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-21 | 1.0 | Epic created from UI redesign plan | John (Product Manager) |
