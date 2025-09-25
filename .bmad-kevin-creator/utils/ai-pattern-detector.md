# AI Pattern Detector

## Purpose

Scan content for telltale signs of AI generation and flag them for human revision.

## Red Flag Patterns to Detect

### Language Patterns

#### Corporate Buzzwords
- "leverage", "synergies", "empower", "enable"
- "transform", "revolutionize", "groundbreaking"
- "seamless", "cutting-edge", "best-in-class"
- "paradigm shift", "game-changing"

#### AI Symbolism Crutches
- "stands as a testament"
- "serves as a symbol"
- "plays a vital/significant role"
- "underscores its importance"
- "continues to captivate"
- "leaves a lasting impact"

#### Vague Attribution
- "studies show" (without citation)
- "experts believe"
- "industry reports suggest"
- "observers have noted"
- "it's widely known"

#### Formulaic Transitions
- "Moreover"
- "Furthermore"
- "In addition"
- "On the other hand"
- "It's important to note"
- "It's worth mentioning"

#### Analysis Endings
- "...ensuring [outcome]"
- "...highlighting [aspect]"
- "...emphasizing [point]"
- "...reflecting [trend]"
- "...demonstrating [quality]"

### Structural Patterns

#### Perfect Symmetry
- Always exactly 3-5 points
- Parallel construction in every list
- Same paragraph length throughout
- Consistent sentence structure

#### Title Case Obsession
- Every Section Capitalized Like This
- Inconsistent With Normal Writing

#### List Addiction
- Everything in numbered lists
- Bullet points for simple ideas
- Over-structured content

#### Summary Sections
- "In conclusion..."
- "In summary..."
- "Overall..."
- Restating what was just said

### Missing Human Elements

#### No Specifics
- "Recently" instead of "Last Tuesday"
- "Significant amount" instead of "$47K"
- "The data" instead of "Excel row 1047"
- "Studies" instead of "MIT's 2023 research"

#### No Personality
- No contractions (won't, can't, didn't)
- No fragments or incomplete sentences
- No parenthetical asides
- No self-interruptions
- No admissions of uncertainty

#### No Sensory Details
- Missing physical descriptions
- No dialogue quotes
- No emotional reactions
- No time pressure mentions

## Detection Script

```bash
# Quick scan for AI patterns
grep -E "(Moreover|Furthermore|In addition|plays a vital|stands as a testament|ensuring|highlighting|emphasizing)" content.md

# Count perfect lists (3-5 items)
grep -E "^[1-3-5]\." content.md | wc -l

# Check for contractions (should have some)
grep -E "(won't|can't|didn't|wouldn't|shouldn't|it's|that's)" content.md | wc -l

# Flag vague attributions
grep -E "(Studies show|Experts believe|It's widely known|Industry reports)" content.md
```

## Humanization Checklist

### Quick Fixes
- [ ] Replace "Moreover" with "And" or just skip
- [ ] Change "Furthermore" to "Plus" or "Also"
- [ ] Delete "It's important to note"
- [ ] Add specific dates/numbers/names
- [ ] Include at least 3 contractions per page
- [ ] Vary list sizes (2, 4, 6, not always 3-5)

### Deeper Changes
- [ ] Add personal anecdote with specifics
- [ ] Include dialogue snippet
- [ ] Mention specific tools/software
- [ ] Add parenthetical aside
- [ ] Include one self-correction
- [ ] Leave one intentional fragment
- [ ] Reference actual person by name
- [ ] Add sensory detail

### Final Check
- [ ] Read aloud - does it sound like bar conversation?
- [ ] Would Kevin actually say this?
- [ ] Any perfect symmetry to break?
- [ ] Too polished? Add roughness
- [ ] Missing personality markers?

## Common AI Phrases to Replace

| AI Version | Human Version |
|------------|---------------|
| "It's important to note that..." | [Just say it] |
| "Moreover," | "And" or "Plus" |
| "Furthermore," | [Skip transition] |
| "This serves as..." | "This is..." |
| "Plays a vital role" | "Matters" |
| "Ensures optimal outcomes" | "Works better" |
| "Leveraging synergies" | "Working together" |
| "Transformative impact" | "Big change" |
| "Seamless integration" | "Works with" |
| "Best-in-class" | "Really good" |
| "Cutting-edge" | "New" |
| "Revolutionary approach" | "Different way" |
| "Paradigm shift" | "New thinking" |
| "Game-changing" | "Important" |
| "Drives value" | "Helps" |
| "Enables stakeholders" | "Lets people" |
| "Empowers teams" | "Helps teams" |
| "Key considerations include:" | "Think about:" |
| "In conclusion" | [Just end] |
| "Studies have shown" | "[Specific study] found" |
| "Experts agree" | "[Name] says" |
| "It can be argued" | "I think" |
| "One might consider" | "Consider" |
| "It seems that" | [State it directly] |

## Usage

Run this detector on any content before publishing:

1. Scan for red flags
2. Apply quick fixes
3. Add human elements
4. Read aloud test
5. Get second opinion if unsure

Remember: The goal isn't perfection. It's authenticity. Sometimes messy is better than polished.