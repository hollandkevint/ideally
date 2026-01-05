# Epic 6: Sub-Persona MVP

**Status:** Ready
**Priority:** P0 - Critical for MVP
**Target:** January 2026

## Overview

Epic 6 implements the core differentiator of ThinkHaven: the sub-persona system that provides genuine pushback, anti-sycophancy, and structured methodology enforcement.

**Reference:** [Strategic Direction](../../prd/8-strategic-direction.md)

## Strategic Context

ThinkHaven is a **decision accelerator**, not a Claude wrapper. The sub-persona system is THE thing that makes it work:

> "If users feel encouraged AND challenged, if they feel pressure-testing was useful and invigorating, if they want to do it again and feel more confident in building - everything else follows."

## Epic Goals

1. **Wire sub-persona logic to AI chat** - Connect the implemented persona modes to actual Claude responses
2. **Enable dynamic mode shifting** - AI reads user state and adjusts in real-time
3. **Implement kill recommendations** - Honest judgment with escalation sequence
4. **Polish outputs** - Lean Canvas and PRD/Spec generation
5. **Improve trial experience** - 10 messages with partial output at gate

## Stories

| Story | Title | Status | Priority |
|-------|-------|--------|----------|
| 6.1 | Wire Sub-Persona to Claude API | Ready | P0 |
| 6.2 | Dynamic Mode Shifting | Ready | P0 |
| 6.3 | Kill Recommendation System | Ready | P0 |
| 6.4 | Output Polish (Lean Canvas + PRD) | Ready | P1 |
| 6.5 | 10-Message Trial Gate | Ready | P1 |
| 6.6 | Mode Indicator UI | Ready | P2 |

## Dependencies

**Already Built (This Session - Jan 4, 2026):**
- `lib/ai/mary-persona.ts` - Sub-persona types, weights, state detection, kill framework
- 67 tests for persona logic
- Design system with mode indicator colors
- Strategic direction documentation

**Existing Infrastructure:**
- Claude API integration with streaming
- Session persistence
- Guest flow (currently 5 messages)
- Credit system infrastructure

## Success Criteria

| Metric | Target |
|--------|--------|
| Users feel "challenged but confident" | Qualitative feedback |
| Kill recommendations appear when warranted | Functional test |
| Mode shifting detectable in conversation | UX review |
| Trial converts at 10 messages | Analytics |

## Technical Notes

- Sub-persona logic is in `lib/ai/mary-persona.ts`
- Claude API calls in `lib/ai/claude-client.ts`
- Guest chat in `app/api/chat/guest/route.ts`
- Authenticated chat in `app/api/chat/stream/route.ts`

## Implementation Order

```
6.1 (Wire to API)
    └─> 6.2 (Dynamic Shifting)
           └─> 6.3 (Kill Recommendations)
                  └─> 6.4 (Output Polish)
                         └─> 6.5 (Trial Gate)

6.6 (Mode UI) can be done in parallel after 6.1
```
