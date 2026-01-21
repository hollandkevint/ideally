/**
 * Assumption Extractor (Story 3.5)
 * Extracts assumptions from conversation history for inclusion in exports
 */

import { Message } from '@/lib/ai/types';

/**
 * Represents an assumption extracted from conversation
 */
export interface Assumption {
  text: string;
  source: 'user' | 'assistant';
  sourceMessage: string; // The original message context
  challenged: boolean;
  challengeReason?: string;
  category?: 'user' | 'market' | 'technical' | 'business' | 'general';
}

/**
 * Structured assumptions organized by category
 */
export interface CategorizedAssumptions {
  user: Assumption[];
  market: Assumption[];
  technical: Assumption[];
  business: Assumption[];
  general: Assumption[];
  challenged: Assumption[];
}

/**
 * Patterns to detect assumption statements
 */
const ASSUMPTION_PATTERNS = [
  /assuming\s+(?:that\s+)?(.{10,150}?)[.!?]/gi,
  /the\s+assumption\s+is\s+(?:that\s+)?(.{10,150}?)[.!?]/gi,
  /if\s+we\s+assume\s+(?:that\s+)?(.{10,150}?)[.!?]/gi,
  /this\s+assumes\s+(?:that\s+)?(.{10,150}?)[.!?]/gi,
  /based\s+on\s+the\s+assumption\s+(?:that\s+)?(.{10,150}?)[.!?]/gi,
  /i(?:'m|\s+am)\s+assuming\s+(?:that\s+)?(.{10,150}?)[.!?]/gi,
  /we(?:'re|\s+are)\s+assuming\s+(?:that\s+)?(.{10,150}?)[.!?]/gi,
  /key\s+assumption[s]?:?\s*(.{10,150}?)[.!?]/gi,
  /our\s+assumption\s+is\s+(?:that\s+)?(.{10,150}?)[.!?]/gi,
  /it\s+assumes\s+(?:that\s+)?(.{10,150}?)[.!?]/gi,
];

/**
 * Patterns to detect challenged assumptions
 */
const CHALLENGE_PATTERNS = [
  /(?:challenge|question|push\s+back\s+on|dispute)\s+(?:this|that|the)\s+assumption/i,
  /(?:is\s+that|that's)\s+(?:really|actually)\s+(?:true|the\s+case)/i,
  /what\s+if\s+(?:that's|this\s+is)\s+(?:not\s+)?(?:true|correct)/i,
  /(?:i'm\s+not\s+sure|i\s+don't\s+think)\s+(?:that|this)\s+assumption/i,
  /have\s+you\s+(?:validated|tested|verified)\s+(?:that|this)/i,
  /(?:risky|dangerous)\s+assumption/i,
  /(?:might\s+not|may\s+not)\s+be\s+(?:true|the\s+case)/i,
];

/**
 * Category detection keywords
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  user: ['user', 'customer', 'audience', 'persona', 'demographic', 'behavior', 'want', 'need', 'prefer'],
  market: ['market', 'industry', 'competition', 'competitor', 'share', 'growth', 'trend', 'demand'],
  technical: ['technical', 'technology', 'integration', 'scale', 'performance', 'infrastructure', 'api', 'system'],
  business: ['revenue', 'price', 'pricing', 'cost', 'profit', 'margin', 'subscription', 'pay', 'business'],
};

/**
 * Extract assumptions from conversation messages
 */
export function extractAssumptions(messages: Message[]): Assumption[] {
  const assumptions: Assumption[] = [];
  const seenTexts = new Set<string>();

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const content = message.content;

    // Extract assumptions using patterns
    for (const pattern of ASSUMPTION_PATTERNS) {
      // Reset regex lastIndex for global patterns
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(content)) !== null) {
        const assumptionText = cleanAssumptionText(match[1]);

        // Skip if too short, too long, or already seen
        if (assumptionText.length < 15 || assumptionText.length > 200) continue;
        const normalizedText = assumptionText.toLowerCase().trim();
        if (seenTexts.has(normalizedText)) continue;
        seenTexts.add(normalizedText);

        // Check if this assumption was challenged in subsequent messages
        const challengeInfo = findChallenge(assumptionText, messages.slice(i + 1));

        assumptions.push({
          text: assumptionText,
          source: message.role,
          sourceMessage: extractContext(content, match.index, 100),
          challenged: challengeInfo.challenged,
          challengeReason: challengeInfo.reason,
          category: categorizeAssumption(assumptionText),
        });
      }
    }
  }

  return assumptions;
}

/**
 * Clean extracted assumption text
 */
function cleanAssumptionText(text: string): string {
  return text
    .trim()
    .replace(/^[,;:\s]+/, '')
    .replace(/[,;:\s]+$/, '')
    .replace(/\s+/g, ' ');
}

/**
 * Extract context around the match
 */
function extractContext(content: string, matchIndex: number, contextLength: number): string {
  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(content.length, matchIndex + contextLength);
  let context = content.slice(start, end);

  if (start > 0) context = '...' + context;
  if (end < content.length) context = context + '...';

  return context;
}

/**
 * Check if an assumption was challenged in later messages
 */
function findChallenge(
  assumptionText: string,
  subsequentMessages: Message[]
): { challenged: boolean; reason?: string } {
  const lowerAssumption = assumptionText.toLowerCase();
  const keyWords = lowerAssumption.split(' ').filter(w => w.length > 4).slice(0, 3);

  for (const message of subsequentMessages) {
    // Only check assistant messages for challenges
    if (message.role !== 'assistant') continue;

    const content = message.content;
    const lowerContent = content.toLowerCase();

    // Check if message references this assumption
    const referencesAssumption = keyWords.some(word => lowerContent.includes(word));
    if (!referencesAssumption) continue;

    // Check for challenge patterns
    for (const pattern of CHALLENGE_PATTERNS) {
      if (pattern.test(content)) {
        // Extract the challenge reason (surrounding context)
        const match = content.match(/(?:because|since|as)\s+(.{20,100}?)[.!?]/i);
        return {
          challenged: true,
          reason: match ? match[1].trim() : 'Mary challenged this assumption during the conversation',
        };
      }
    }
  }

  return { challenged: false };
}

/**
 * Categorize assumption by type
 */
function categorizeAssumption(text: string): 'user' | 'market' | 'technical' | 'business' | 'general' {
  const lowerText = text.toLowerCase();

  let bestCategory: 'user' | 'market' | 'technical' | 'business' | 'general' = 'general';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(kw => lowerText.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as typeof bestCategory;
    }
  }

  return bestCategory;
}

/**
 * Organize assumptions by category
 */
export function categorizeAssumptions(assumptions: Assumption[]): CategorizedAssumptions {
  const result: CategorizedAssumptions = {
    user: [],
    market: [],
    technical: [],
    business: [],
    general: [],
    challenged: [],
  };

  for (const assumption of assumptions) {
    // Add to challenged list if challenged
    if (assumption.challenged) {
      result.challenged.push(assumption);
    }

    // Add to category list
    const category = assumption.category || 'general';
    result[category].push(assumption);
  }

  return result;
}

/**
 * Format assumptions for markdown export
 */
export function formatAssumptionsAsMarkdown(assumptions: Assumption[]): string {
  if (assumptions.length === 0) {
    return '';
  }

  const categorized = categorizeAssumptions(assumptions);

  let md = `## Key Assumptions\n\n`;

  // User assumptions
  if (categorized.user.length > 0) {
    md += `### User Assumptions\n`;
    categorized.user.forEach(a => {
      md += `- ${a.text}\n`;
    });
    md += '\n';
  }

  // Market assumptions
  if (categorized.market.length > 0) {
    md += `### Market Assumptions\n`;
    categorized.market.forEach(a => {
      md += `- ${a.text}\n`;
    });
    md += '\n';
  }

  // Business assumptions
  if (categorized.business.length > 0) {
    md += `### Business Assumptions\n`;
    categorized.business.forEach(a => {
      md += `- ${a.text}\n`;
    });
    md += '\n';
  }

  // Technical assumptions
  if (categorized.technical.length > 0) {
    md += `### Technical Assumptions\n`;
    categorized.technical.forEach(a => {
      md += `- ${a.text}\n`;
    });
    md += '\n';
  }

  // General assumptions
  if (categorized.general.length > 0) {
    md += `### Other Assumptions\n`;
    categorized.general.forEach(a => {
      md += `- ${a.text}\n`;
    });
    md += '\n';
  }

  // Challenged assumptions
  if (categorized.challenged.length > 0) {
    md += `### Challenged Assumptions\n`;
    md += `*These assumptions were questioned during the conversation*\n\n`;
    categorized.challenged.forEach(a => {
      md += `- "${a.text}"\n`;
      if (a.challengeReason) {
        md += `  - *Challenge:* ${a.challengeReason}\n`;
      }
    });
    md += '\n';
  }

  return md;
}

/**
 * Format assumptions for HTML export
 */
export function formatAssumptionsAsHtml(assumptions: Assumption[]): string {
  if (assumptions.length === 0) {
    return '';
  }

  const categorized = categorizeAssumptions(assumptions);

  let html = `<h2>Key Assumptions</h2>\n`;

  const renderCategory = (title: string, items: Assumption[], challenged = false) => {
    if (items.length === 0) return '';
    let categoryHtml = `<h3>${title}</h3>\n<ul>\n`;
    items.forEach(a => {
      if (challenged && a.challengeReason) {
        categoryHtml += `<li><em>"${a.text}"</em><br/><span style="color: #d97706; font-size: 0.9em;">Challenge: ${a.challengeReason}</span></li>\n`;
      } else {
        categoryHtml += `<li>${a.text}</li>\n`;
      }
    });
    categoryHtml += `</ul>\n`;
    return categoryHtml;
  };

  html += renderCategory('User Assumptions', categorized.user);
  html += renderCategory('Market Assumptions', categorized.market);
  html += renderCategory('Business Assumptions', categorized.business);
  html += renderCategory('Technical Assumptions', categorized.technical);
  html += renderCategory('Other Assumptions', categorized.general);
  html += renderCategory('Challenged Assumptions', categorized.challenged, true);

  return html;
}
