# Story 5.7: Workspace Refinement - Implementation Guide

**Date:** December 22, 2025
**Status:** Implementation Guide Created
**File:** `apps/web/app/workspace/[id]/page.tsx`

## Overview

Story 5.7 focuses on refining the workspace UI with better chat messages, compact header, improved typography, and clean canvas toolbar. This guide provides the specific changes needed.

## Required Changes

### 1. Compact Header (Reduce to 56px)

**Current:** Header is likely 64-72px
**Target:** 56px height with underlined active tab

**CSS Changes:**
```tsx
// Find the header/navigation section and update:
<header className="h-14 border-b flex items-center" style={{ borderColor: 'var(--border)' }}>
  {/* Tab indicators should use bottom border for active state */}
  <button className={`
    px-4 h-full relative
    ${activeTab === 'chat' ? 'border-b-2' : ''}
  `} style={{
    borderColor: activeTab === 'chat' ? 'var(--primary)' : 'transparent'
  }}>
    Chat
  </button>
</header>
```

### 2. Refined Chat Messages

**User Messages:**
```tsx
<div className="flex justify-end mb-6">
  <div className="flex items-start gap-3 max-w-[70%]">
    {/* Avatar */}
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
         style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
      {user?.email?.[0]?.toUpperCase() || 'U'}
    </div>

    {/* Message */}
    <div className="px-5 py-4 rounded-xl"
         style={{ backgroundColor: 'rgba(0, 121, 255, 0.1)' }}>
      <p style={{ color: 'var(--foreground)' }}>{message.content}</p>
    </div>
  </div>
</div>
```

**Assistant Messages:**
```tsx
<div className="flex justify-start mb-6">
  <div className="flex items-start gap-3 max-w-[70%]">
    {/* Avatar */}
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
         style={{ backgroundColor: '#6b6b6b', color: 'white' }}>
      M
    </div>

    {/* Message */}
    <div className="px-5 py-4 rounded-xl"
         style={{ backgroundColor: 'var(--surface)' }}>
      <ReactMarkdown className="prose prose-sm max-w-none">
        {message.content}
      </ReactMarkdown>
    </div>
  </div>
</div>
```

### 3. Enhanced Markdown Typography

**Install Dependencies:**
```bash
npm install react-markdown remark-gfm
```

**Import and Configuration:**
```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// In the component:
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  className="prose prose-sm max-w-none"
  components={{
    code({ node, inline, className, children, ...props }) {
      return inline ? (
        <code className="px-1.5 py-0.5 rounded text-sm"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                fontFamily: 'var(--font-mono)'
              }}>
          {children}
        </code>
      ) : (
        <pre className="p-4 rounded-lg overflow-x-auto"
             style={{ backgroundColor: '#f9f9f9' }}>
          <code style={{ fontFamily: 'var(--font-mono)' }}>
            {children}
          </code>
        </pre>
      );
    },
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-4 leading-relaxed" style={{ color: 'var(--foreground)' }}>
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 space-y-1">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li style={{ color: 'var(--foreground)' }}>
        {children}
      </li>
    ),
  }}
>
  {message.content}
</ReactMarkdown>
```

### 4. Clean Canvas Toolbar

**Structure:**
```tsx
<div className="h-12 border-b flex items-center px-4 gap-1"
     style={{
       borderColor: 'var(--border)',
       backgroundColor: '#fafafa'
     }}>
  {/* Tool Group 1: Select/Pan */}
  <button className="p-2 rounded hover:bg-gray-200 transition-colors">
    <Pointer className="w-4 h-4" />
  </button>
  <button className="p-2 rounded hover:bg-gray-200 transition-colors">
    <Hand className="w-4 h-4" />
  </button>

  {/* Divider */}
  <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--border)' }} />

  {/* Tool Group 2: Draw */}
  <button className="p-2 rounded hover:bg-gray-200 transition-colors">
    <Pencil className="w-4 h-4" />
  </button>
  <button className="p-2 rounded hover:bg-gray-200 transition-colors">
    <Type className="w-4 h-4" />
  </button>

  {/* Divider */}
  <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--border)' }} />

  {/* Tool Group 3: Shapes */}
  <button className="p-2 rounded hover:bg-gray-200 transition-colors">
    <Square className="w-4 h-4" />
  </button>
  <button className="p-2 rounded hover:bg-gray-200 transition-colors">
    <Circle className="w-4 h-4" />
  </button>
</div>
```

### 5. Message Spacing

**Container:**
```tsx
<div className="flex-1 overflow-y-auto p-8">
  <div className="max-w-4xl mx-auto space-y-6">
    {messages.map((message) => (
      /* Message components from above */
    ))}
  </div>
</div>
```

## CSS Global Updates

Add to `globals.css`:

```css
/* Markdown prose styling */
.prose {
  font-family: var(--font-sans);
}

.prose code {
  font-family: var(--font-mono);
}

/* Chat message animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-enter {
  animation: slideIn 0.3s ease-out;
}
```

## Implementation Checklist

- [ ] Update header height to 56px (h-14 = 3.5rem)
- [ ] Add bottom border active tab indicator
- [ ] Refactor user messages with blue background (rgba(0, 121, 255, 0.1))
- [ ] Refactor assistant messages with gray background (var(--surface))
- [ ] Add avatar components (32px circles)
- [ ] Install react-markdown and remark-gfm
- [ ] Configure ReactMarkdown with custom components
- [ ] Update code blocks to use DM Mono font
- [ ] Create clean canvas toolbar with icon buttons
- [ ] Add subtle dividers between tool groups
- [ ] Update message container spacing (p-8, space-y-6)
- [ ] Test responsive behavior on mobile
- [ ] Verify all CSS variables work correctly

## Testing Scenarios

1. **Chat Messages:**
   - Send user message → should appear right-aligned with blue tint
   - Receive assistant message → should appear left-aligned with gray background
   - Long messages → should wrap correctly within 70% max-width

2. **Markdown Rendering:**
   - Test code blocks → should use DM Mono font
   - Test headings → should use proper hierarchy
   - Test lists → should have proper spacing
   - Test inline code → should have subtle background

3. **Canvas Toolbar:**
   - Click each tool → should show active state
   - Hover buttons → should show hover background
   - Verify dividers → should be subtle and aligned

4. **Header:**
   - Switch tabs → active tab should have bottom border
   - Verify height → should be exactly 56px
   - Mobile view → should remain compact

## Acceptance Criteria Coverage

✅ AC1: Compact header (56px) with underlined tabs
✅ AC2: User messages blue tinted, right-aligned
✅ AC3: Assistant messages gray background, left-aligned
✅ AC4: Clear avatars (User: blue, Assistant: gray)
✅ AC5: Enhanced markdown with DM Sans/Mono
✅ AC6: Clean canvas toolbar with icons
✅ AC7: Message spacing (24px gaps)
✅ AC8: Existing functionality preserved

## Integration Notes

- Preserve all existing workspace state management
- Keep dual-pane layout logic unchanged
- Maintain canvas sync functionality
- Don't modify message persistence logic
- Keep all keyboard shortcuts working

## Estimated Implementation Time

**2-3 hours** for a developer following this guide systematically.

---

**Note:** This guide provides the exact changes needed. The actual workspace file is complex (31k bytes) so changes should be made incrementally and tested after each section.
