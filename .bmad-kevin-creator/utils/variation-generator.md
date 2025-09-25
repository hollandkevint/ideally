# Variation Generator

## Purpose

Generate human-like variation in content structure and language to avoid AI detection patterns.

## Structure Variations

### List Sizes (Don't Always Use 3-5)

```javascript
// Instead of always 3-5, randomly choose:
const listSizes = [2, 4, 6, 7, 8];
const points = listSizes[Math.floor(Math.random() * listSizes.length)];
```

### Examples:
- **2 points**: Deep dive into two contrasting approaches
- **4 points**: Quick hits without perfect symmetry
- **6 points**: Rapid-fire insights
- **7 points**: Comprehensive but not obsessively organized
- **Single point**: One idea explored from multiple angles

## Language Variations

### Hook Starters

Instead of formulaic openings, rotate through:

**Monday/Tuesday Feel:**
- "So I was debugging this thing yesterday..."
- "You know what's wild?"
- "Okay, real talk:"
- "Plot twist:"

**Wednesday/Thursday Energy:**
- "Been thinking about this all week..."
- "Just realized something"
- "Here's what nobody tells you:"
- "Unpopular opinion but..."

**Friday Vibe:**
- "Before the weekend, quick thought:"
- "Wrapping up the week with this gem:"
- "Friday confession:"
- "Hot take before I log off:"

## Transition Variations

### Instead of "Moreover/Furthermore"

**Natural Progressions:**
- "And here's the thing..."
- "Plus,"
- "Also - and this is important -"
- "Another thing:"
- [No transition at all - just jump]
- "Oh, and"
- "But wait, there's more" (sparingly)

### Instead of "It's Important to Note"

- "Quick sidebar:"
- "Weird thing is..."
- "Catch:"
- "Funny part:"
- "Here's what trips people up:"
- [Just state it directly]
- "BTW -"

## Emphasis Variations

### Mix These Up

- **CAPS** for shock: "THREE HOURS for a semicolon"
- *Italics* for inner thoughts: "*Really?* That's your solution?"
- Normal bold for key concepts (sparingly)
- Repetition for emphasis: "Nothing. Literally nothing."
- Fragments: "The result? Chaos."

## Detail Variations

### Time References

**Specific:**
- "Last Tuesday at 3pm"
- "During yesterday's standup"
- "Right before the AWS outage"
- "10 minutes before the demo"

**Relative but Real:**
- "Three weeks into the project"
- "After the third refactor"
- "Between meetings"
- "While my coffee got cold"

### Tool/Platform References

**Specific:**
- "Slack channel #data-team"
- "JIRA ticket PROD-4521"
- "Excel row 1047"
- "VS Code's debugger"
- "The Confluence page nobody reads"

**Colloquial:**
- "That one Google Doc"
- "The infamous spreadsheet"
- "Our Frankenstein database"
- "The dashboard everyone ignores"

## Personality Injections

### Occasional Frustration

- "I spent 3 damn hours on this"
- "Complete waste of time"
- "I was pissed"
- "This is ridiculous"

### Self-Corrections

- "Actually, wait..."
- "Scratch that"
- "No, that's not right"
- "Let me try again"

### Admissions

- "I don't know why this works"
- "Still figuring this out"
- "Probably missing something"
- "Could be wrong here"

## Structural Breaks

### Intentional Imperfections

1. **Inconsistent Numbering**
   - Start with numbers, switch to bullets
   - Skip from point 2 to point 4
   - Use letters sometimes

2. **Asymmetric Sections**
   - One section: 3 paragraphs
   - Next section: 1 line
   - Third section: 2 paragraphs

3. **Incomplete Thoughts**
   - "Things like X, Y, and... you get it"
   - "There's more but moving on"
   - "Etc etc"

## Random Selection Function

```python
import random

def humanize_structure(content_type):
    variations = {
        'list_size': random.choice([2, 4, 6, 7]),
        'use_transition': random.random() > 0.3,  # 70% chance
        'emphasis_type': random.choice(['caps', 'italics', 'bold', 'none']),
        'include_typo': random.random() > 0.95,  # 5% chance
        'add_tangent': random.random() > 0.8,  # 20% chance
        'structure_type': random.choice(['symmetric', 'asymmetric', 'chaotic'])
    }
    return variations
```

## Application Examples

### Before (AI-like):
"Moreover, it's important to note that this approach ensures optimal outcomes by leveraging synergies across three key areas:"

### After (Human):
"And here's what actually worked: (spoiler - it's messy)"

### Before (AI-like):
"Studies have shown that 73% of implementations fail due to:"
1. Lack of planning
2. Insufficient resources
3. Poor communication
4. Technical debt
5. Stakeholder misalignment

### After (Human):
"MIT found 73% of these things tank. Why? 
- Nobody planned shit
- Ran out of money (shocker)
- Plus like 4 other things but mainly those two"

## Usage Guidelines

1. **Don't overdo it** - Too much variation looks forced
2. **Match the mood** - Professional contexts need less chaos
3. **Keep Kevin's voice** - Variation should enhance, not replace
4. **Test by reading aloud** - If it sounds weird spoken, fix it
5. **Let some perfection through** - Humans occasionally write symmetrically too

## Quick Reference Card

| Pattern | Frequency | Example |
|---------|-----------|---------|
| Contractions | Every paragraph | "won't", "can't", "it's" |
| Fragments | 1-2 per post | "Result? Chaos." |
| Specific details | Every 3rd sentence | "Tuesday", "$47K", "Sarah" |
| No transition | 30% of time | Just jump to next point |
| Self-correction | Once per long post | "Actually, wait..." |
| Tangent | 20% of posts | Brief aside |
| Typo | 5% of posts | Fix in comments |
| Swear | When frustrated | "damn", "pissed" |

Remember: The goal is authentic human variation, not random chaos. When in doubt, imagine Kevin explaining this at a bar after two beers.