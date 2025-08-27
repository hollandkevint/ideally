import { BmadKnowledgeEntry, BmadMethodError } from './types';

/**
 * BMad Method Knowledge Base System
 * Manages strategic frameworks, techniques, and templates
 */
export class BmadKnowledgeBase {
  private knowledgeCache = new Map<string, BmadKnowledgeEntry>();

  /**
   * Search knowledge entries by query
   */
  async searchKnowledge(
    query: string,
    filters?: {
      type?: 'framework' | 'technique' | 'template' | 'case_study';
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      applicablePhases?: string[];
      tags?: string[];
    }
  ): Promise<BmadKnowledgeEntry[]> {
    try {
      // For now, return mock strategic frameworks
      // In production, this would use semantic search with vector embeddings
      return this.getMockKnowledgeEntries().filter(entry => {
        // Basic text matching
        const queryLower = query.toLowerCase();
        const matchesQuery = 
          entry.title.toLowerCase().includes(queryLower) ||
          entry.content.toLowerCase().includes(queryLower) ||
          entry.tags.some(tag => tag.toLowerCase().includes(queryLower));

        if (!matchesQuery) return false;

        // Apply filters
        if (filters?.type && entry.type !== filters.type) return false;
        if (filters?.difficulty && entry.difficulty !== filters.difficulty) return false;
        if (filters?.tags && !filters.tags.some(tag => entry.tags.includes(tag))) return false;
        if (filters?.applicablePhases && 
            !filters.applicablePhases.some(phase => entry.applicablePhases.includes(phase))) {
          return false;
        }

        return true;
      }).slice(0, 10); // Limit results

    } catch (error) {
      throw new BmadMethodError(
        `Knowledge search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'KNOWLEDGE_SEARCH_ERROR',
        { query, filters, originalError: error }
      );
    }
  }

  /**
   * Get knowledge entry by ID
   */
  async getKnowledgeEntry(entryId: string): Promise<BmadKnowledgeEntry | null> {
    try {
      // Check cache first
      if (this.knowledgeCache.has(entryId)) {
        return this.knowledgeCache.get(entryId)!;
      }

      // For now, return from mock data
      const entry = this.getMockKnowledgeEntries().find(e => e.id === entryId);
      
      if (entry) {
        this.knowledgeCache.set(entryId, entry);
      }

      return entry || null;

    } catch (error) {
      throw new BmadMethodError(
        `Failed to retrieve knowledge entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'KNOWLEDGE_RETRIEVAL_ERROR',
        { entryId, originalError: error }
      );
    }
  }

  /**
   * Get relevant knowledge for a specific phase
   */
  async getPhaseKnowledge(phaseId: string): Promise<BmadKnowledgeEntry[]> {
    try {
      return this.getMockKnowledgeEntries().filter(entry => 
        entry.applicablePhases.includes(phaseId) || 
        entry.applicablePhases.includes('all')
      );

    } catch (error) {
      throw new BmadMethodError(
        `Failed to retrieve phase knowledge: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PHASE_KNOWLEDGE_ERROR',
        { phaseId, originalError: error }
      );
    }
  }

  /**
   * Record knowledge reference for session
   */
  async recordKnowledgeReference(
    sessionId: string,
    entryId: string,
    phaseId: string,
    _relevanceScore: number = 0.8
  ): Promise<void> {
    try {
      const entry = await this.getKnowledgeEntry(entryId);
      if (!entry) {
        throw new Error(`Knowledge entry ${entryId} not found`);
      }

      // This would normally save to database
      // For now, we'll just validate the reference
      console.log(`Recording knowledge reference: ${entry.title} for session ${sessionId}`);

    } catch (error) {
      throw new BmadMethodError(
        `Failed to record knowledge reference: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'KNOWLEDGE_REFERENCE_ERROR',
        { sessionId, entryId, phaseId, originalError: error }
      );
    }
  }

  /**
   * Get mock knowledge entries for development
   */
  private getMockKnowledgeEntries(): BmadKnowledgeEntry[] {
    return [
      {
        id: 'business-model-canvas',
        type: 'framework',
        title: 'Business Model Canvas',
        content: `The Business Model Canvas is a strategic management template for developing new or documenting existing business models. It's a visual chart with elements describing a firm's value propositions, infrastructure, customers, and finances.

Key Components:
1. Value Propositions - What unique value do we deliver?
2. Customer Segments - Who are we creating value for?
3. Channels - How do we reach and communicate with customers?
4. Customer Relationships - What type of relationship does each segment expect?
5. Revenue Streams - For what value are customers willing to pay?
6. Key Resources - What key resources does our value proposition require?
7. Key Activities - What key activities does our value proposition require?
8. Key Partnerships - Who are our key partners and suppliers?
9. Cost Structure - What are the most important costs inherent in our business model?

Application in BMad Method:
- Use during business model analysis pathway
- Helps structure thinking about revenue models
- Validates business assumptions systematically
- Creates visual representation of strategic thinking`,
        tags: ['business model', 'strategy', 'canvas', 'framework'],
        applicablePhases: ['business_model_analysis', 'revenue_strategy', 'all'],
        difficulty: 'intermediate',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'scamper-technique',
        type: 'technique',
        title: 'SCAMPER Creative Technique',
        content: `SCAMPER is a creative thinking technique that helps generate ideas for improving existing products, services, or processes. Each letter represents a different way to approach creative challenges.

S - Substitute: What can be substituted or swapped?
C - Combine: What can be combined or merged?
A - Adapt: What can be adapted or adjusted?
M - Modify/Magnify: What can be modified, magnified, or minimized?
P - Put to other uses: What other uses can this have?
E - Eliminate: What can be removed or eliminated?
R - Reverse/Rearrange: What can be reversed, rearranged, or reordered?

Application in BMad Method:
- Perfect for brainstorming sessions
- Helps break creative blocks
- Generates diverse solution approaches
- Systematic approach to innovation`,
        tags: ['creativity', 'brainstorming', 'innovation', 'ideation'],
        applicablePhases: ['idea_generation', 'problem_solving', 'brainstorm_session'],
        difficulty: 'beginner',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'impact-effort-matrix',
        type: 'framework',
        title: 'Impact vs Effort Matrix',
        content: `The Impact vs Effort Matrix is a decision-making tool that helps prioritize tasks, projects, or ideas based on their potential impact and the effort required to implement them.

Four Quadrants:
1. High Impact, Low Effort (Quick Wins) - Prioritize these first
2. High Impact, High Effort (Major Projects) - Important long-term initiatives  
3. Low Impact, Low Effort (Fill-ins) - Do when you have spare time
4. Low Impact, High Effort (Thankless Tasks) - Avoid or eliminate these

How to Use:
1. List all options/ideas
2. Rate each on impact (1-10 scale)
3. Rate each on effort/difficulty (1-10 scale)
4. Plot on matrix
5. Focus on quick wins first, plan major projects carefully

Application in BMad Method:
- Essential for idea evaluation phases
- Helps with feature prioritization
- Strategic resource allocation
- Clear visual for decision making`,
        tags: ['prioritization', 'decision making', 'matrix', 'evaluation'],
        applicablePhases: ['idea_evaluation', 'feature_prioritization', 'strategic_planning'],
        difficulty: 'beginner',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'lean-startup-methodology',
        type: 'framework',
        title: 'Lean Startup Methodology',
        content: `The Lean Startup methodology is a scientific approach to creating and managing startups by shortening product development cycles through business hypothesis-driven experimentation and validated learning.

Core Principles:
1. Build-Measure-Learn - Systematic approach to testing ideas
2. Minimum Viable Product (MVP) - Test core assumptions with minimal resources
3. Validated Learning - Use data to validate or invalidate business hypotheses
4. Innovation Accounting - Track progress in uncertain environments
5. Pivot or Persevere - Make strategic adjustments based on learning

Build-Measure-Learn Cycle:
- Build: Create minimum viable experiments
- Measure: Collect data on customer behavior
- Learn: Analyze data to validate/invalidate assumptions
- Iterate: Apply learnings to next iteration

Application in BMad Method:
- Validates new ideas with minimal risk
- Provides framework for strategic experimentation
- Reduces waste in product development
- Data-driven decision making approach`,
        tags: ['startup', 'validation', 'experimentation', 'mvp', 'lean'],
        applicablePhases: ['new_idea_exploration', 'validation', 'strategic_optimization'],
        difficulty: 'intermediate',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'competitive-analysis-framework',
        type: 'template',
        title: 'Competitive Analysis Framework',
        content: `A systematic approach to analyzing competitors to understand market positioning, identify opportunities, and inform strategic decisions.

Analysis Components:
1. Competitor Identification
   - Direct competitors (same solution, same market)
   - Indirect competitors (different solution, same problem)
   - Substitute solutions

2. Competitor Profiling
   - Company background and history
   - Product/service offerings
   - Pricing strategies
   - Market share and performance
   - Strengths and weaknesses

3. SWOT Analysis (for each competitor)
   - Strengths: What they do well
   - Weaknesses: Areas of vulnerability
   - Opportunities: Market gaps they might exploit
   - Threats: Risks to their business

4. Competitive Positioning Map
   - Plot competitors on relevant dimensions
   - Identify white space opportunities
   - Understand differentiation options

5. Strategic Implications
   - What can we learn from successful competitors?
   - Where are the market gaps?
   - How should we position ourselves?

Application in BMad Method:
- Critical for business model pathway
- Informs strategic optimization decisions
- Validates market opportunities
- Guides positioning strategy`,
        tags: ['competition', 'market analysis', 'positioning', 'swot'],
        applicablePhases: ['competitive_analysis', 'market_research', 'strategic_optimization'],
        difficulty: 'intermediate',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];
  }

  /**
   * Clear knowledge cache
   */
  clearCache(): void {
    this.knowledgeCache.clear();
  }
}

// Export singleton instance
export const bmadKnowledgeBase = new BmadKnowledgeBase();