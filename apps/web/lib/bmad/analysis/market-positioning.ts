import { NewIdeaPhaseData, MarketOpportunity, CompetitorAnalysis, BusinessConcept } from '../templates/new-idea-templates';
import { NEW_IDEA_AI_PROMPTS } from '../templates/new-idea-templates';

/**
 * Market Positioning Analysis Engine
 * Leverages AI to provide strategic insights for business ideas
 */

export interface AnalysisRequest {
  phase: 'ideation' | 'market_exploration' | 'concept_refinement' | 'positioning';
  userInput: string;
  sessionData: Partial<NewIdeaPhaseData>;
  elicitationChoice?: number;
}

export interface AnalysisResponse {
  insights: string[];
  recommendations: string[];
  questions: string[];
  data?: MarketOpportunity[] | CompetitorAnalysis[] | BusinessConcept;
  confidence: number;
}

export interface ClaudeMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Market Analysis Engine
 */
export class MarketPositioningAnalyzer {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/bmad') {
    this.baseUrl = baseUrl;
  }

  /**
   * Analyze business idea in ideation phase
   */
  async analyzeIdeation(request: AnalysisRequest): Promise<AnalysisResponse> {
    const messages: ClaudeMessage[] = [
      {
        role: 'system',
        content: NEW_IDEA_AI_PROMPTS.ideation.system
      },
      {
        role: 'user',
        content: this.buildIdeationPrompt(request)
      }
    ];

    const response = await this.callClaudeAPI(messages, 'ideation');
    return this.parseAnalysisResponse(response, 'ideation');
  }

  /**
   * Analyze market opportunities
   */
  async analyzeMarketExploration(request: AnalysisRequest): Promise<AnalysisResponse> {
    const messages: ClaudeMessage[] = [
      {
        role: 'system',
        content: NEW_IDEA_AI_PROMPTS.market_exploration.system
      },
      {
        role: 'user',
        content: this.buildMarketExplorationPrompt(request)
      }
    ];

    const response = await this.callClaudeAPI(messages, 'market_exploration');
    return this.parseAnalysisResponse(response, 'market_exploration');
  }

  /**
   * Refine business concept and value proposition
   */
  async analyzeConceptRefinement(request: AnalysisRequest): Promise<AnalysisResponse> {
    const messages: ClaudeMessage[] = [
      {
        role: 'system',
        content: NEW_IDEA_AI_PROMPTS.concept_refinement.system
      },
      {
        role: 'user',
        content: this.buildConceptRefinementPrompt(request)
      }
    ];

    const response = await this.callClaudeAPI(messages, 'concept_refinement');
    return this.parseAnalysisResponse(response, 'concept_refinement');
  }

  /**
   * Develop strategic positioning
   */
  async analyzePositioning(request: AnalysisRequest): Promise<AnalysisResponse> {
    const messages: ClaudeMessage[] = [
      {
        role: 'system',
        content: NEW_IDEA_AI_PROMPTS.positioning.system
      },
      {
        role: 'user',
        content: this.buildPositioningPrompt(request)
      }
    ];

    const response = await this.callClaudeAPI(messages, 'positioning');
    return this.parseAnalysisResponse(response, 'positioning');
  }

  /**
   * Build ideation analysis prompt
   */
  private buildIdeationPrompt(request: AnalysisRequest): string {
    return `
${NEW_IDEA_AI_PROMPTS.ideation.analysis}

Business Idea: ${request.userInput}

${request.sessionData.rawIdea ? `Additional Context: ${request.sessionData.rawIdea}` : ''}

${request.elicitationChoice ? `Focus Area: ${this.getElicitationFocus(request.elicitationChoice, 'ideation')}` : ''}

Please provide:
1. Core problem validation assessment
2. Solution uniqueness evaluation
3. Initial market opportunity sizing
4. Key assumptions to test
5. Creative variations to consider

Format your response as structured JSON with insights, recommendations, and follow-up questions.
    `;
  }

  /**
   * Build market exploration prompt
   */
  private buildMarketExplorationPrompt(request: AnalysisRequest): string {
    const previousInsights = request.sessionData.ideationInsights?.join('\n- ') || '';
    
    return `
${NEW_IDEA_AI_PROMPTS.market_exploration.analysis}

Business Concept: ${request.userInput}

Previous Phase Insights:
- ${previousInsights}

${request.elicitationChoice ? `Analysis Focus: ${this.getElicitationFocus(request.elicitationChoice, 'market_exploration')}` : ''}

Please provide:
1. Total addressable market (TAM) estimation
2. Serviceable addressable market (SAM)
3. Competitive landscape mapping
4. Customer segment prioritization
5. Market entry barriers and opportunities

Format your response with specific market data and actionable insights.
    `;
  }

  /**
   * Build concept refinement prompt
   */
  private buildConceptRefinementPrompt(request: AnalysisRequest): string {
    const marketOpportunities = request.sessionData.marketOpportunities?.map(o => o.description).join('\n- ') || '';
    
    return `
${NEW_IDEA_AI_PROMPTS.concept_refinement.analysis}

Business Concept: ${request.userInput}

Market Opportunities Identified:
- ${marketOpportunities}

${request.elicitationChoice ? `Refinement Focus: ${this.getElicitationFocus(request.elicitationChoice, 'concept_refinement')}` : ''}

Please provide:
1. Unique value proposition statement
2. Revenue model recommendations
3. Cost structure analysis
4. Key success metrics
5. Business model risks and mitigations

Focus on practical, actionable recommendations.
    `;
  }

  /**
   * Build positioning prompt
   */
  private buildPositioningPrompt(request: AnalysisRequest): string {
    const valueProps = request.sessionData.uniqueValueProps?.join('\n- ') || '';
    const competitors = request.sessionData.competitiveLandscape?.map(c => c.name).join(', ') || '';
    
    return `
${NEW_IDEA_AI_PROMPTS.positioning.analysis}

Business Concept: ${request.userInput}

Unique Value Propositions:
- ${valueProps}

Competitive Landscape: ${competitors}

Please provide:
1. Clear positioning statement
2. Competitive differentiation strategy
3. Go-to-market approach
4. Key milestones for next 90 days
5. Success metrics and validation methods

Make recommendations specific and executable.
    `;
  }

  /**
   * Get elicitation focus description
   */
  private getElicitationFocus(choice: number, phase: string): string {
    const focusMap: Record<string, Record<number, string>> = {
      ideation: {
        1: 'Problem validation - Is this a real problem worth solving?',
        2: 'Solution innovation - How can we make this solution unique?',
        3: 'Market opportunity - Who needs this and how many?'
      },
      market_exploration: {
        1: 'Customer segmentation - Define specific user personas',
        2: 'Competitive landscape - Map existing solutions',
        3: 'Market trends - Identify growth opportunities'
      },
      concept_refinement: {
        1: 'Revenue streams - How to monetize effectively',
        2: 'Cost structure - Understanding unit economics',
        3: 'Growth strategy - How to scale the business'
      }
    };

    return focusMap[phase]?.[choice] || 'General analysis';
  }

  /**
   * Call Claude API for analysis
   */
  private async callClaudeAPI(messages: ClaudeMessage[], phase: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'analyze_new_idea',
        data: {
          messages,
          phase,
          maxTokens: 2000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Analysis API call failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.analysis || result.message || '';
  }

  /**
   * Parse analysis response based on phase
   */
  private parseAnalysisResponse(response: string, phase: string): AnalysisResponse {
    try {
      // Try to parse as JSON first
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          insights: parsed.insights || [],
          recommendations: parsed.recommendations || [],
          questions: parsed.questions || [],
          data: parsed.data,
          confidence: parsed.confidence || 0.8
        };
      }
    } catch (e) {
      // Fall back to text parsing
    }

    // Parse structured text response
    return this.parseTextResponse(response, phase);
  }

  /**
   * Parse text-based response into structured format
   */
  private parseTextResponse(response: string, phase: string): AnalysisResponse {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const questions: string[] = [];

    // Extract insights
    const insightMatches = response.match(/(?:insights?|analysis):\s*\n?((?:[-•*]\s*.+\n?)+)/gi);
    if (insightMatches) {
      insightMatches.forEach(match => {
        const items = match.split(/[-•*]\s*/).filter(item => item.trim().length > 0);
        insights.push(...items.map(item => item.trim()));
      });
    }

    // Extract recommendations
    const recommendationMatches = response.match(/(?:recommendations?|suggestions?):\s*\n?((?:[-•*]\s*.+\n?)+)/gi);
    if (recommendationMatches) {
      recommendationMatches.forEach(match => {
        const items = match.split(/[-•*]\s*/).filter(item => item.trim().length > 0);
        recommendations.push(...items.map(item => item.trim()));
      });
    }

    // Extract questions
    const questionMatches = response.match(/(?:questions?|next steps?):\s*\n?((?:[-•*]\s*.+\n?)+)/gi);
    if (questionMatches) {
      questionMatches.forEach(match => {
        const items = match.split(/[-•*]\s*/).filter(item => item.trim().length > 0);
        questions.push(...items.map(item => item.trim()));
      });
    }

    return {
      insights,
      recommendations,
      questions,
      confidence: 0.7
    };
  }

  /**
   * Generate market opportunities from analysis
   */
  generateMarketOpportunities(analysis: AnalysisResponse): MarketOpportunity[] {
    return analysis.insights.map((insight, index) => ({
      id: `opportunity_${Date.now()}_${index}`,
      description: insight,
      marketSize: 'Unknown', // Would be extracted from analysis
      growthPotential: 'medium' as const,
      confidence: analysis.confidence,
      insights: [insight]
    }));
  }

  /**
   * Generate competitor analysis from insights
   */
  generateCompetitorAnalysis(analysis: AnalysisResponse): CompetitorAnalysis[] {
    // Extract competitor information from recommendations
    return analysis.recommendations
      .filter(rec => rec.toLowerCase().includes('competitor') || rec.toLowerCase().includes('alternative'))
      .map((rec, index) => ({
        name: `Competitor ${index + 1}`,
        strengths: [],
        weaknesses: [],
        marketPosition: rec,
        differentiators: []
      }));
  }
}

/**
 * Factory function to create analyzer instance
 */
export function createMarketPositioningAnalyzer(baseUrl?: string): MarketPositioningAnalyzer {
  return new MarketPositioningAnalyzer(baseUrl);
}