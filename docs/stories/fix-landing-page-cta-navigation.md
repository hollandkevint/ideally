# Fix Landing Page CTA Navigation - Brownfield Addition

## User Story

As a **visitor to the landing page**,
I want **the "Meet Mary Today" buttons to navigate me to the login page**,
So that **I can easily access the application without manually typing URLs**.

## Story Context

**Existing System Integration:**
- Integrates with: Landing page (app/page.tsx) and Next.js routing system
- Technology: Next.js 15 App Router, React components, useRouter hook
- Follows pattern: Existing navigation patterns in the application
- Touch points: Landing page CTA buttons, Next.js router, login page routing

## Acceptance Criteria

**Functional Requirements:**
1. "🧠 Meet Mary Today" buttons navigate to `/login` when clicked
2. "🎬 Watch Method Demo" buttons navigate appropriately (TBD: demo page or video)
3. Smooth navigation without page refresh using Next.js App Router

**Integration Requirements:**
4. Existing landing page layout and styling remains unchanged
5. Button components follow existing design system patterns
6. Navigation maintains current Next.js routing behavior

**Quality Requirements:**
7. CTA navigation is covered by appropriate tests
8. Accessibility standards maintained for button navigation
9. No regression in existing landing page functionality verified

## Technical Notes

**Integration Approach:**
- Add onClick handlers to existing Button components in app/page.tsx
- Use Next.js useRouter hook for programmatic navigation
- Alternative: Replace Button components with Link components from Next.js

**Existing Pattern Reference:**
- Follow navigation pattern used in dashboard header (workspace/[id]/page.tsx)
- Use existing Button component from @/components/ui/button
- Maintain current styling and layout patterns

**Key Constraints:**
- Must maintain existing button styling and layout
- Navigation should use Next.js App Router patterns
- No changes to landing page design or copy

**Current Implementation Issue:**
- "🧠 Meet Mary Today" buttons (refs e39, e104) have no click handlers
- Buttons show active state but don't trigger navigation
- Manual navigation to `/login` works correctly

## Definition of Done

- [ ] "🧠 Meet Mary Today" buttons navigate to `/login` when clicked
- [ ] "🎬 Watch Method Demo" buttons have appropriate navigation
- [ ] Button styling and layout remain unchanged
- [ ] Navigation works smoothly without page refresh
- [ ] CTA conversion funnel is restored
- [ ] Existing landing page functionality works unchanged
- [ ] Navigation follows Next.js best practices

## Risk and Compatibility Check

**Minimal Risk Assessment:**
- **Primary Risk:** Breaking existing button styling or layout
- **Mitigation:** Test button appearance and behavior after changes
- **Rollback:** Simple to revert onClick handler additions

**Compatibility Verification:**
- [x] No breaking changes to existing APIs
- [x] Database changes not required
- [x] UI changes follow existing design patterns
- [x] Performance impact is negligible

## Implementation Options

**Option 1: Add onClick Handlers**
```typescript
<Button onClick={() => router.push('/login')} size="lg" className="px-8 py-4">
  🧠 Meet Mary Today
</Button>
```

**Option 2: Replace with Link Components**
```typescript
<Link href="/login">
  <Button size="lg" className="px-8 py-4">
    🧠 Meet Mary Today
  </Button>
</Link>
```

**Recommended:** Option 1 for consistency with existing patterns

## Validation Checklist

**Scope Validation:**
- [x] Story can be completed in one development session
- [x] Integration approach is straightforward
- [x] Follows existing patterns exactly
- [x] No design or architecture work required

**Clarity Check:**
- [x] Story requirements are unambiguous
- [x] Integration points are clearly specified
- [x] Success criteria are testable
- [x] Rollback approach is simple

---

**Priority:** HIGH (User Experience)
**Estimated Effort:** 1-2 hours
**Dependencies:** None
**Risk Level:** Very Low (minimal UI changes)