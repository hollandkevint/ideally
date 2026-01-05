<!-- Powered by BMAD™ Core -->

# Interview Spec Task

## Purpose

- Transform minimal specifications into implementation-ready requirements through structured interviewing
- Discover edge cases, tradeoffs, and anti-goals before implementation begins
- Reduce iteration cycles by front-loading requirement gathering
- Apply the VelvetShark technique: let the AI interview YOU instead of prompting the AI

## When to Use

- Starting a new feature with only a rough idea
- Before implementation when requirements feel incomplete
- When a spec file exists but needs expansion
- To ensure nothing gets missed before coding begins

## Task Instructions

### Step 1: Load and Analyze Spec

Read the provided spec file (or topic description) and identify:

1. What's explicitly stated
2. What's implied but not documented
3. What's completely missing
4. Potential ambiguities or conflicts

### Step 2: Interview Setup

Present the interview context to the user:

```
I'll interview you to expand this spec into implementation-ready requirements.

I'll ask questions about:
- Technical implementation details
- UI/UX considerations
- Edge cases and error handling
- Tradeoffs and constraints
- Acceptance criteria
- Anti-goals (what NOT to build)

Ready to begin?
```

### Step 3: Execute Interview

**CRITICAL: Use numbered question format for structured responses.**

Ask questions in these categories (adapt order based on spec type):

**Category A: Core Requirements**
- What problem does this solve?
- Who are the users?
- What does success look like?

**Category B: Technical Implementation**
- What's the tech stack/constraints?
- What existing patterns should this follow?
- What integrations are needed?

**Category C: Edge Cases**
- What happens when [X] fails?
- What if the user does [unexpected action]?
- How do we handle [boundary condition]?

**Category D: Scope and Anti-Goals**
- What should this explicitly NOT do?
- What's out of scope for v1?
- What complexity should we avoid?

**Category E: Acceptance Criteria**
- How will we know this is done?
- What tests should pass?
- What does the user see when successful?

**Interview Guidelines:**

1. Ask one question at a time (or small batches of 2-3 related questions)
2. Probe deeper when answers are vague: "Tell me more about..."
3. Challenge assumptions: "What if that's not true?"
4. Look for contradictions between answers
5. Continue until spec feels comprehensive (typically 20-40 questions)

### Step 4: Synthesize and Confirm

Before writing, present a structured summary:

```
## Spec Summary

### Core Purpose
[What it does and why]

### Key Requirements
1. [Requirement]
2. [Requirement]
...

### Technical Approach
[Implementation details]

### Edge Cases Covered
- [Case 1]
- [Case 2]
...

### Anti-Goals (What NOT to Build)
- [Anti-goal 1]
- [Anti-goal 2]
...

### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
...

Does this capture everything? Any adjustments before I write the final spec?
```

### Step 5: Write Final Spec

After user confirmation, overwrite the spec file with:

1. **Clear headings** for each section
2. **Bullet points** for requirements and criteria
3. **Anti-goals section** explicitly stating what NOT to build
4. **Acceptance criteria** as checkboxes
5. **Technical notes** where implementation matters

## Key Principles

- **YOU ARE THE INTERVIEWER**: Ask questions, don't make assumptions
- **FRONT-LOAD THINKING**: Better to ask now than refactor later
- **CHALLENGE VAGUENESS**: "Fast" means nothing without numbers
- **CAPTURE ANTI-GOALS**: What NOT to build is as important as what to build
- **ITERATE UNTIL COMPLETE**: Don't rush to write - thoroughness matters

## Output Format

The final spec should be structured markdown:

```markdown
# [Feature/Project Name]

## Overview
[1-2 sentence summary]

## Problem Statement
[What problem this solves and for whom]

## Requirements

### Must Have
- [ ] Requirement 1
- [ ] Requirement 2

### Should Have
- [ ] Requirement 3

### Nice to Have
- [ ] Requirement 4

## Technical Approach
[Implementation details, patterns, constraints]

## Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| [Case 1] | [Behavior] |
| [Case 2] | [Behavior] |

## Anti-Goals (Out of Scope)
- NOT doing X because [reason]
- NOT building Y for v1
- NOT optimizing for Z

## Acceptance Criteria
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
- [ ] [Testable criterion 3]

## Open Questions
- [Any remaining unknowns]
```

## Attribution

Based on the VelvetShark interview technique: instead of you prompting the AI, let the AI interview YOU first. This front-loads thinking and eliminates ambiguity before implementation begins.
