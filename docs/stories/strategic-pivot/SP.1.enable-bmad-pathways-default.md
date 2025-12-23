# SP.1: Enable BMad Pathways as Default Experience

## Status
**Ready** - Critical for differentiation

## Priority
**P0 - Immediate** - Your differentiator is currently disabled

## Context
The critical analysis revealed that ThinkHaven's core differentiator (structured BMad pathways) is disabled in production. Users see "Choose your pathway" options but can only use chat. This is a trust breaker - we're marketing structured methodology but delivering generic chat.

**The Problem:**
> "Right now you're selling the appetizer (chat) while the entree (BMad pathways) is in the back."

## Story
**As a** user who came to ThinkHaven for structured strategic thinking,
**I want** to immediately access the BMad Method pathways,
**so that** I experience the differentiated value that makes ThinkHaven worth paying for.

## Acceptance Criteria

1. **Pathway Selection is Primary**: When entering workspace, BMad tab is default (not chat)
2. **All 3 Pathways Functional**: New Idea, Business Model, and Feature Refinement work end-to-end
3. **Clear Value Proposition**: Each pathway shows expected output upfront ("You'll get a Concept Document")
4. **Guided Experience**: Users cannot get stuck - clear next steps at every phase
5. **Professional Output**: Completing a pathway generates export-ready PDF
6. **Fallback to Chat**: Chat remains available for open-ended exploration

## Tasks / Subtasks

- [ ] Task 1: Audit Current Pathway State
  - [ ] Subtask 1.1: Identify why BMad tab is disabled (feature flag? incomplete code?)
  - [ ] Subtask 1.2: List missing functionality per pathway
  - [ ] Subtask 1.3: Determine minimum viable pathway experience

- [ ] Task 2: Enable New Idea Pathway (Priority)
  - [ ] Subtask 2.1: Connect pathway phases to AI generation
  - [ ] Subtask 2.2: Implement phase progression logic
  - [ ] Subtask 2.3: Generate Concept Document at completion
  - [ ] Subtask 2.4: Enable PDF export for output

- [ ] Task 3: Enable Business Model Pathway
  - [ ] Subtask 3.1: Connect revenue analysis phases
  - [ ] Subtask 3.2: Generate Lean Canvas output
  - [ ] Subtask 3.3: Enable PDF export

- [ ] Task 4: Enable Feature Refinement Pathway
  - [ ] Subtask 4.1: Connect user analysis phases
  - [ ] Subtask 4.2: Generate Feature Brief output
  - [ ] Subtask 4.3: Enable PDF export

- [ ] Task 5: Make BMad Default Experience
  - [ ] Subtask 5.1: Change workspace default tab to BMad
  - [ ] Subtask 5.2: Update onboarding to emphasize pathways
  - [ ] Subtask 5.3: Add "Start Pathway" as primary CTA

## Success Metrics
- 80%+ of users complete at least one pathway
- Users spend 20+ minutes in pathway (vs. 5 min chat sessions)
- Export rate > 50% (users want the output)

## Dev Notes

### Current State (from exploration)
- BMad components exist in `apps/web/app/components/bmad/`
- Pathway templates exist in `apps/web/lib/bmad/pathways/`
- PDF export exists in `apps/web/lib/export/`
- Feature flag or incomplete integration is blocking

### Key Files
- `apps/web/app/workspace/[id]/page.tsx` - Workspace with tabs
- `apps/web/app/components/bmad/BmadInterface.tsx` - Main BMad UI
- `apps/web/app/components/bmad/pathways/NewIdeaPathway.tsx`
- `apps/web/lib/bmad/session-orchestrator.ts`

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-16 | 1.0 | Created from critical analysis recommendations | Strategic Review |
