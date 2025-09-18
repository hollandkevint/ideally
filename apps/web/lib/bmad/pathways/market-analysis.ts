// Market positioning analysis for New Idea pathway
// Handles AI-driven competitive analysis and market opportunity assessment

import { MarketOpportunity, CompetitorAnalysis, TargetAudience } from '../templates/new-idea-templates';
import { NEW_IDEA_AI_PROMPTS } from '../templates/new-idea-templates';

export interface MarketAnalysisRequest {
  businessIdea: string;
  targetMarket?: string;
  competitors?: string[];
  marketSize?: string;
  additionalContext?: string;
}

export interface MarketAnalysisResult {
  marketOpportunities: MarketOpportunity[];
  competitiveLandscape: CompetitorAnalysis[];
  targetAudience: TargetAudience;
  marketInsights: string[];
  recommendations: string[];
  confidenceScore: number;
}

export class MarketAnalysisEngine {
  /**
   * Conduct comprehensive market analysis for business idea
   */
  async analyzeMarket(request: MarketAnalysisRequest): Promise<MarketAnalysisResult> {
    try {
      // Analyze market opportunities
      const marketOpportunities = await this.identifyMarketOpportunities(request);

      // Analyze competitive landscape
      const competitiveLandscape = await this.analyzeCompetitors(request);

      // Define target audience
      const targetAudience = await this.defineTargetAudience(request);

      // Generate market insights
      const marketInsights = await this.generateMarketInsights(request, {
        marketOpportunities,
        competitiveLandscape,
        targetAudience
      });

      // Generate recommendations
      const recommendations = await this.generateRecommendations(request, {
        marketOpportunities,
        competitiveLandscape,
        targetAudience,
        marketInsights
      });

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore({
        marketOpportunities,
        competitiveLandscape,
        targetAudience
      });

      return {
        marketOpportunities,
        competitiveLandscape,
        targetAudience,
        marketInsights,
        recommendations,
        confidenceScore
      };
    } catch (error) {
      console.error('Market analysis failed:', error);
      throw new Error('Failed to complete market analysis');
    }
  }

  /**
   * Identify market opportunities using AI analysis
   */
  private async identifyMarketOpportunities(request: MarketAnalysisRequest): Promise<MarketOpportunity[]> {
    const prompt = `${NEW_IDEA_AI_PROMPTS.market_exploration.system}

    Analyze this business idea for market opportunities:
    Idea: ${request.businessIdea}
    Target Market: ${request.targetMarket || 'Not specified'}
    Market Size: ${request.marketSize || 'Not specified'}

    ${NEW_IDEA_AI_PROMPTS.market_exploration.analysis}

    Return a JSON array of market opportunities with this structure:
    {
      "id": "unique_id",
      "description": "opportunity description",
      "marketSize": "size estimate",
      "growthPotential": "low|medium|high",
      "confidence": 0.8,
      "insights": ["insight1", "insight2"]
    }`;

    // In a real implementation, this would call Claude API
    // For now, return structured mock data based on business idea analysis
    return this.generateMockMarketOpportunities(request);
  }

  /**
   * Analyze competitive landscape
   */
  private async analyzeCompetitors(request: MarketAnalysisRequest): Promise<CompetitorAnalysis[]> {
    const prompt = `${NEW_IDEA_AI_PROMPTS.market_exploration.system}

    Analyze competitors for this business idea:
    Idea: ${request.businessIdea}
    Known Competitors: ${request.competitors?.join(', ') || 'None specified'}

    Identify 3-5 main competitors and analyze their:
    - Strengths and weaknesses
    - Market position
    - Key differentiators

    Return a JSON array with this structure:
    {
      "name": "competitor name",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "marketPosition": "position description",
      "differentiators": ["diff1", "diff2"]
    }`;

    // Mock implementation - in production would use Claude API
    return this.generateMockCompetitorAnalysis(request);
  }

  /**
   * Define target audience characteristics
   */
  private async defineTargetAudience(request: MarketAnalysisRequest): Promise<TargetAudience> {
    const prompt = `${NEW_IDEA_AI_PROMPTS.market_exploration.system}

    Define the target audience for this business idea:
    Idea: ${request.businessIdea}
    Target Market: ${request.targetMarket || 'Not specified'}

    Analyze and return:
    - Primary customer segment
    - Demographics and psychographics
    - Pain points and desired outcomes

    Return JSON with this structure:
    {
      "primarySegment": "segment description",
      "demographics": ["demo1", "demo2"],
      "psychographics": ["psycho1", "psycho2"],
      "painPoints": ["pain1", "pain2"],
      "desiredOutcomes": ["outcome1", "outcome2"]
    }`;

    // Mock implementation
    return this.generateMockTargetAudience(request);
  }

  /**
   * Generate market insights from analysis
   */
  private async generateMarketInsights(
    request: MarketAnalysisRequest,
    analysis: {
      marketOpportunities: MarketOpportunity[];
      competitiveLandscape: CompetitorAnalysis[];
      targetAudience: TargetAudience;
    }
  ): Promise<string[]> {
    // Synthesize insights from market analysis
    const insights: string[] = [];

    // Market size insights
    const highGrowthOpportunities = analysis.marketOpportunities.filter(opp => opp.growthPotential === 'high');
    if (highGrowthOpportunities.length > 0) {
      insights.push(`High-growth opportunity identified: ${highGrowthOpportunities[0].description}`);
    }

    // Competitive insights
    const competitorWeaknesses = analysis.competitiveLandscape.flatMap(comp => comp.weaknesses);
    if (competitorWeaknesses.length > 0) {
      insights.push(`Market gap opportunity: ${competitorWeaknesses[0]}`);
    }

    // Audience insights
    if (analysis.targetAudience.painPoints.length > 0) {
      insights.push(`Key customer pain point: ${analysis.targetAudience.painPoints[0]}`);
    }

    return insights;
  }

  /**
   * Generate strategic recommendations
   */
  private async generateRecommendations(
    request: MarketAnalysisRequest,
    analysis: {
      marketOpportunities: MarketOpportunity[];
      competitiveLandscape: CompetitorAnalysis[];
      targetAudience: TargetAudience;
      marketInsights: string[];
    }
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Market entry recommendations
    const bestOpportunity = analysis.marketOpportunities
      .sort((a, b) => b.confidence - a.confidence)[0];

    if (bestOpportunity) {
      recommendations.push(`Focus on ${bestOpportunity.description} as primary market entry point`);
    }

    // Competitive positioning recommendations
    const mainWeaknesses = analysis.competitiveLandscape
      .flatMap(comp => comp.weaknesses)
      .slice(0, 2);

    mainWeaknesses.forEach(weakness => {
      recommendations.push(`Differentiate by addressing: ${weakness}`);
    });

    // Customer acquisition recommendations
    if (analysis.targetAudience.primarySegment) {
      recommendations.push(`Target ${analysis.targetAudience.primarySegment} for initial customer acquisition`);
    }

    return recommendations;
  }

  /**
   * Calculate confidence score based on analysis completeness
   */
  private calculateConfidenceScore(analysis: {
    marketOpportunities: MarketOpportunity[];
    competitiveLandscape: CompetitorAnalysis[];
    targetAudience: TargetAudience;
  }): number {
    let score = 0.0;

    // Market opportunities factor (40%)
    if (analysis.marketOpportunities.length > 0) {
      const avgConfidence = analysis.marketOpportunities.reduce((sum, opp) => sum + opp.confidence, 0)
        / analysis.marketOpportunities.length;
      score += avgConfidence * 0.4;
    }

    // Competitive analysis factor (30%)
    if (analysis.competitiveLandscape.length >= 3) {
      score += 0.3;
    } else if (analysis.competitiveLandscape.length > 0) {
      score += (analysis.competitiveLandscape.length / 3) * 0.3;
    }

    // Target audience factor (30%)
    const audienceCompleteness = [
      analysis.targetAudience.primarySegment,
      analysis.targetAudience.demographics.length > 0,
      analysis.targetAudience.painPoints.length > 0
    ].filter(Boolean).length / 3;

    score += audienceCompleteness * 0.3;

    return Math.round(score * 100) / 100;
  }

  // Mock data generators (in production these would be replaced with Claude API calls)

  private generateMockMarketOpportunities(request: MarketAnalysisRequest): MarketOpportunity[] {
    const baseOpportunities: MarketOpportunity[] = [
      {
        id: 'primary-market',
        description: 'Primary target market segment',
        marketSize: request.marketSize || '$10M-100M',
        growthPotential: 'high',
        confidence: 0.8,
        insights: ['Growing demand identified', 'Limited existing solutions']
      },
      {
        id: 'adjacent-market',
        description: 'Adjacent market opportunity',
        marketSize: '$5M-50M',
        growthPotential: 'medium',
        confidence: 0.6,
        insights: ['Secondary opportunity', 'Lower competition']
      }
    ];

    return baseOpportunities;
  }

  private generateMockCompetitorAnalysis(request: MarketAnalysisRequest): CompetitorAnalysis[] {
    return [
      {
        name: 'Market Leader',
        strengths: ['Brand recognition', 'Large customer base'],
        weaknesses: ['High pricing', 'Slow innovation'],
        marketPosition: 'Dominant market leader',
        differentiators: ['Scale', 'Resources']
      },
      {
        name: 'Emerging Player',
        strengths: ['Innovative features', 'Agile development'],
        weaknesses: ['Limited resources', 'Small market share'],
        marketPosition: 'Growing competitor',
        differentiators: ['Technology', 'User experience']
      }
    ];
  }

  private generateMockTargetAudience(request: MarketAnalysisRequest): TargetAudience {
    return {
      primarySegment: request.targetMarket || 'Small business owners',
      demographics: ['25-45 years old', 'College educated', 'Urban/suburban'],
      psychographics: ['Tech-savvy', 'Efficiency-focused', 'Growth-oriented'],
      painPoints: ['Time-consuming processes', 'Lack of insights', 'Manual workflows'],
      desiredOutcomes: ['Save time', 'Increase productivity', 'Make better decisions']
    };
  }
}

/**
 * Factory function to create market analysis engine
 */
export function createMarketAnalysisEngine(): MarketAnalysisEngine {
  return new MarketAnalysisEngine();
}

/**
 * Utility functions for market analysis
 */
export const MarketAnalysisUtils = {
  formatMarketSize: (size: string): string => {
    return size.replace(/\$(\d+)([MBK])/g, (match, num, unit) => {
      const units = { K: 'thousand', M: 'million', B: 'billion' };
      return `$${num} ${units[unit as keyof typeof units]}`;
    });
  },

  prioritizeOpportunities: (opportunities: MarketOpportunity[]): MarketOpportunity[] => {
    return opportunities.sort((a, b) => {
      // Sort by growth potential then confidence
      const growthScore = { high: 3, medium: 2, low: 1 };
      const aScore = growthScore[a.growthPotential] * a.confidence;
      const bScore = growthScore[b.growthPotential] * b.confidence;
      return bScore - aScore;
    });
  },

  extractKeyInsights: (analysis: MarketAnalysisResult): string[] => {
    const insights: string[] = [];

    // Top opportunity
    const topOpportunity = MarketAnalysisUtils.prioritizeOpportunities(analysis.marketOpportunities)[0];
    if (topOpportunity) {
      insights.push(`Primary opportunity: ${topOpportunity.description}`);
    }

    // Competitive advantage
    const weaknesses = analysis.competitiveLandscape.flatMap(comp => comp.weaknesses);
    if (weaknesses.length > 0) {
      insights.push(`Competitive gap: ${weaknesses[0]}`);
    }

    // Market insights
    insights.push(...analysis.marketInsights.slice(0, 3));

    return insights;
  }
};