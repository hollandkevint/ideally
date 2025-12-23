---
name: Minimal UI Redesign
overview: A full UI/UX redesign of the ideally application adopting a clean minimal aesthetic inspired by Notion, featuring bold typography, generous whitespace, and subtle visual hierarchy. The redesign covers landing page, authentication flows, dashboard, and workspace.
todos:
  - id: design-system
    content: Update globals.css with new design tokens, typography, and color palette
    status: pending
  - id: fonts
    content: Configure DM Sans and DM Mono fonts in layout.tsx
    status: pending
  - id: landing-page
    content: Redesign landing page with hero, social proof, and feature cards
    status: pending
  - id: auth-login
    content: Redesign login page with clean minimal form and OAuth
    status: pending
  - id: auth-signup
    content: Redesign signup page to match login style
    status: pending
  - id: dashboard
    content: Implement sidebar layout and session cards for dashboard
    status: pending
  - id: workspace
    content: Refine workspace dual-pane interface and chat styling
    status: pending
---

# Ideally UI/UX Redesign: Clean Minimal Aesthetic

## Design Philosophy

Inspired by Notion's productivity-focused design: **clean, confident, and uncluttered**. The aesthetic prioritizes content clarity and cognitive focus for strategic thinkers.

**Core Principles:**

- Generous whitespace to reduce cognitive load
- Bold, confident typography hierarchy
- Black/white base with a single accent color
- Subtle visual elements (no gradients, minimal shadows)
- Character illustrations for warmth and personality

---

## 1. Design System Foundation

Update [`app/globals.css`](app/globals.css) with new design tokens:

**Typography:**

- Replace Geist with **DM Sans** (headings) + **DM Mono** (code)
- Larger base sizes, tighter line heights for headings
- Bold weight hierarchy (400 body, 600 headings, 700 display)

**Color Palette:**

```
--background: #ffffff
--foreground: #191919 (not pure black)
--muted: #6b6b6b
--border: #e5e5e5
--primary: #0079ff (Notion-style blue)
--primary-hover: #0066d9
--surface: #f9f9f9 (subtle card backgrounds)
```

**Spacing System:**

- 4px base unit, 8/16/24/32/48/64/96px scale
- Container max-width: 1200px (landing), 1400px (app)

---

## 2. Landing Page Redesign

Rewrite [`app/page.tsx`](app/page.tsx):

**Structure:**

1. **Sticky Nav**: Logo left, nav links center, CTA buttons right
2. **Hero Section**:

   - Left-aligned headline: "Think strategically. Build with clarity."
   - Subheadline: One sentence value prop
   - Two CTAs: "Get started free" (filled), "See how it works" (outline)
   - Right side: Abstract character illustration or product mockup

3. **Social Proof Bar**: "Trusted by strategic thinkers" + company logos
4. **Feature Cards Section**: 3 cards with icons, bold titles, short descriptions
5. **Product Preview**: Interactive demo preview of dual-pane interface
6. **Footer**: Minimal with links and copyright

**Visual Elements:**

- No background gradients (pure white)
- Subtle card borders (1px #e5e5e5)
- Icon illustrations for features (simple line art style)
- Animated product preview with scroll reveal

---

## 3. Authentication Pages

Redesign [`app/login/page.tsx`](app/login/page.tsx) and [`app/signup/page.tsx`](app/signup/page.tsx):

**Layout:**

- Centered single-column form (max-width 400px)
- Minimal nav (logo only, top-left)
- Clean white background

**Form Design:**

- Google OAuth button first (outlined with icon)
- "OR" divider
- Clean input fields (label above, border on focus)
- Single primary CTA button (blue, full-width)
- Toggle link at bottom (Already have account? / Create one)

**Key Additions:**

- Remove confirm password field (use magic link or password-only)
- Add "Work email" label like Notion
- Subtle helper text below inputs

---

## 4. Dashboard Redesign

Update [`app/dashboard/page.tsx`](app/dashboard/page.tsx):

**Structure:**

1. **Fixed Sidebar** (240px):

   - Logo at top
   - "New Session" button (primary)
   - Session list with icons
   - Settings/Account at bottom

2. **Main Content Area**:

   - Welcome header with user info
   - Quick stats cards (sessions, messages, insights)
   - Session grid with cards

**Session Cards:**

- Clean white with subtle border
- Title, description preview, last updated
- Hover state with subtle shadow elevation
- Quick action dots menu

**Empty State:**

- Centered illustration
- "Start your first strategic session"
- Single prominent CTA

---

## 5. Workspace Refinement

Update [`app/workspace/[id]/page.tsx`](app/workspace/[id]/page.tsx):

**Layout:**

- Reduce header height (compact)
- Tab navigation more subtle (underline style)
- Chat messages with better spacing

**Chat Interface:**

- User messages: right-aligned, blue background
- Assistant messages: left-aligned, gray background
- Avatar improvements (initials or icon)
- Better markdown rendering with typography

**Canvas Pane:**

- Clean toolbar (icon buttons, subtle dividers)
- Grid background option
- Better empty state messaging

---

## 6. Component Library Updates

Create reusable components:

| Component | Location | Purpose |

|-----------|----------|---------|

| `Button` | `app/components/ui/Button.tsx` | Primary, secondary, ghost variants |

| `Input` | `app/components/ui/Input.tsx` | Text, email, password with labels |

| `Card` | `app/components/ui/Card.tsx` | Standard card wrapper |

| `Avatar` | `app/components/ui/Avatar.tsx` | User/assistant avatars |

---

## 7. Animation and Polish

Add subtle micro-interactions:

- Page transitions (fade in)
- Button hover states (scale 1.02)
- Card hover elevation
- Loading states (skeleton screens)
- Input focus transitions

---

## Files to Modify

| File | Changes |

|------|---------|

| [`app/globals.css`](app/globals.css) | New design tokens, typography, utilities |

| [`app/layout.tsx`](app/layout.tsx) | Update fonts (DM Sans/Mono) |

| [`app/page.tsx`](app/page.tsx) | Complete landing page rewrite |

| [`app/login/page.tsx`](app/login/page.tsx) | Minimal auth redesign |

| [`app/signup/page.tsx`](app/signup/page.tsx) | Match login style |

| [`app/dashboard/page.tsx`](app/dashboard/page.tsx) | Sidebar + card layout |

| [`app/workspace/[id]/page.tsx`](app/workspace/[id]/page.tsx) | Refined dual-pane |

---

## Implementation Order

1. **Design System** (globals.css, layout.tsx)
2. **Landing Page** (highest visibility)
3. **Auth Pages** (login/signup)
4. **Dashboard** (main app experience)
5. **Workspace** (core functionality)