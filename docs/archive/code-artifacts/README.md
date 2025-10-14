# Code Artifacts Archive

This directory contains orphaned code files that were previously located in `/docs` root. These files represent implementation code that should have been in the main codebase rather than documentation.

## Contents

### Database Schema
- **002_bmad_analytics_schema.sql** (464 lines)
  - BMAD analytics database schema
  - Should be in migrations folder if still needed
  - Contains analytics tables and RLS policies

### Service Layer Code
- **bmad-analytics-service.ts** (679 lines)
  - BMAD analytics service implementation
  - Event tracking and analytics functions
  - Should be in `/apps/web/lib/analytics/` if active

- **ab-testing-service.ts** (886 lines)
  - A/B testing service implementation
  - Experiment management and variant tracking
  - Should be in `/apps/web/lib/testing/` if active

### UI Components
- **developer-dashboard-components.tsx** (743 lines)
  - Developer dashboard React components
  - Analytics visualization and metrics display
  - Should be in `/apps/web/app/components/` if active

## Status

These files are **archived** because:
1. They were misplaced in documentation directory
2. Current production status unclear
3. May represent planned features not yet implemented
4. May be duplicates of actual implementation code

## Action Required

If these features are needed:
1. Review against current production implementation
2. Move to appropriate location in `/apps/web/`
3. Integrate with existing codebase
4. Add proper tests and documentation

If superseded by current implementation:
1. Keep archived for reference
2. Document decisions in this README

---

*Archived: October 13, 2025*
