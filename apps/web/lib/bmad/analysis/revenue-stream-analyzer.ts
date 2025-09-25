import { BusinessModelPhaseData, RevenueStream, CustomerSegment, ValueProposition, LeanCanvasData } from '../templates/business-model-templates';
import { BUSINESS_MODEL_AI_PROMPTS } from '../templates/business-model-templates';

/**
 * Revenue Stream Analysis Engine
 * Systematic analysis of revenue models, customer segments, and business model optimization
 */

export interface BusinessModelAnalysisRequest {
  phase: 'revenue_analysis' | 'customer_segmentation' | 'value_proposition' | 'monetization_strategy' | 'implementation_planning';
  userInput: string;
  sessionData: Partial<BusinessModelPhaseData>;
  elicitationChoice?: number;
}

export interface BusinessModelAnalysisResponse {
  insights: string[];
  recommendations: string[];
  questions: string[];
  data?: RevenueStream[] | CustomerSegment[] | ValueProposition[] | LeanCanvasData;
  confidence: number;
  feasibilityScores?: Record<string, number>;
  implementationPlan?: ActionPlan[];
}

export interface ActionPlan {
  id: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short-term' | 'long-term';
  effort: number; // 1-5 scale
  impact: number; // 1-5 scale
  dependencies: string[];
}

export interface ClaudeMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RevenueStreamAnalysis {
  stream: RevenueStream;
  marketSize: string;
  competitionLevel: 'low' | 'medium' | 'high';
  implementationComplexity: 'low' | 'medium' | 'high';
  timeToRevenue: string;
  requiredInvestment: string;
}

/**
 * Revenue Stream Analysis Engine
 */
export class RevenueStreamAnalyzer {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/bmad') {
    this.baseUrl = baseUrl;
  }

  /**
   * Analyze current revenue model and identify optimization opportunities
   */
  async analyzeRevenueStreams(request: BusinessModelAnalysisRequest): Promise<BusinessModelAnalysisResponse> {
    const messages: ClaudeMessage[] = [
      {
        role: 'system',
        content: BUSINESS_MODEL_AI_PROMPTS.revenue_analysis.system
      },
      {
        role: 'user',
        content: this.buildRevenueAnalysisPrompt(request)
      }
    ];

    const response = await this.callClaudeAPI(messages, 'revenue_analysis');
    return this.parseAnalysisResponse(response, 'revenue_analysis');
  }

  /**
   * Analyze customer segments and value alignment
   */
  async analyzeCustomerSegmentation(request: BusinessModelAnalysisRequest): Promise<BusinessModelAnalysisResponse> {
    const messages: ClaudeMessage[] = [
      {
        role: 'system',
        content: BUSINESS_MODEL_AI_PROMPTS.customer_segmentation.system
      },
      {
        role: 'user',
        content: this.buildCustomerSegmentationPrompt(request)
      }
    ];

    const response = await this.callClaudeAPI(messages, 'customer_segmentation');
    return this.parseAnalysisResponse(response, 'customer_segmentation');
  }

  /**
   * Analyze and refine value propositions
   */
  async analyzeValueProposition(request: BusinessModelAnalysisRequest): Promise<BusinessModelAnalysisResponse> {
    const messages: ClaudeMessage[] = [
      {
        role: 'system',
        content: BUSINESS_MODEL_AI_PROMPTS.value_proposition.system
      },
      {
        role: 'user',
        content: this.buildValuePropositionPrompt(request)
      }
    ];

    const response = await this.callClaudeAPI(messages, 'value_proposition');
    return this.parseAnalysisResponse(response, 'value_proposition');
  }

  /**
   * Develop monetization strategy recommendations
   */
  async analyzeMonetizationStrategy(request: BusinessModelAnalysisRequest): Promise<BusinessModelAnalysisResponse> {
    const messages: ClaudeMessage[] = [
      {
        role: 'system',
        content: BUSINESS_MODEL_AI_PROMPTS.monetization_strategy.system
      },
      {
        role: 'user',
        content: this.buildMonetizationStrategyPrompt(request)
      }
    ];

    const response = await this.callClaudeAPI(messages, 'monetization_strategy');
    return this.parseAnalysisResponse(response, 'monetization_strategy');
  }

  /**
   * Create implementation roadmap and action plan
   */
  async analyzeImplementationPlanning(request: BusinessModelAnalysisRequest): Promise<BusinessModelAnalysisResponse> {
    const messages: ClaudeMessage[] = [
      {
        role: 'system',
        content: BUSINESS_MODEL_AI_PROMPTS.implementation_planning.system
      },
      {
        role: 'user',
        content: this.buildImplementationPlanningPrompt(request)
      }
    ];

    const response = await this.callClaudeAPI(messages, 'implementation_planning');
    return this.parseAnalysisResponse(response, 'implementation_planning');
  }

  /**
   * Build revenue analysis prompt with systematic questioning
   */
  private buildRevenueAnalysisPrompt(request: BusinessModelAnalysisRequest): string {
    const { userInput, sessionData, elicitationChoice } = request;
    
    let prompt = `${BUSINESS_MODEL_AI_PROMPTS.revenue_analysis.analysis}\n\n`;
    prompt += `Business Context: ${userInput}\n\n`;
    
    if (sessionData.currentModel) {
      prompt += `Current Business Model: ${sessionData.currentModel}\n\n`;
    }
    
    if (sessionData.revenueStreams && sessionData.revenueStreams.length > 0) {
      prompt += `Existing Revenue Streams:\n`;
      sessionData.revenueStreams.forEach((stream, index) => {
        prompt += `${index + 1}. ${stream.name} (${stream.type}) - ${stream.estimatedRevenue}\n`;
      });
      prompt += `\n`;
    }

    // Add systematic questioning based on elicitation choice
    if (elicitationChoice) {
      const questionCategory = this.getRevenueQuestionCategory(elicitationChoice);
      prompt += `Focus specifically on ${questionCategory} and provide detailed analysis.\n\n`;
      prompt += `Use these systematic questions as analysis framework:\n`;
      prompt += this.getSystematicRevenueQuestions(questionCategory);
    }

    prompt += `\nProvide analysis in the following JSON structure:
    {
      "insights": ["insight1", "insight2", ...],
      "recommendations": ["rec1", "rec2", ...],
      "questions": ["question1", "question2", ...],
      "revenueStreams": [{
        "id": "unique-id",
        "name": "stream name",
        "type": "subscription|one-time|freemium|marketplace|advertising|commission|licensing",
        "feasibility": 0-100,
        "estimatedRevenue": "revenue range",
        "implementation": "implementation approach",
        "confidence": 0-100,
        "marketValidation": "validated|assumed|unknown"
      }],
      "confidence": 0-100
    }`;

    return prompt;
  }

  /**
   * Build customer segmentation prompt with systematic analysis
   */
  private buildCustomerSegmentationPrompt(request: BusinessModelAnalysisRequest): string {
    const { userInput, sessionData, elicitationChoice } = request;
    
    let prompt = `${BUSINESS_MODEL_AI_PROMPTS.customer_segmentation.analysis}\n\n`;
    prompt += `Business Context: ${userInput}\n\n`;
    
    if (sessionData.customerSegments && sessionData.customerSegments.length > 0) {
      prompt += `Current Customer Segments:\n`;
      sessionData.customerSegments.forEach((segment, index) => {
        prompt += `${index + 1}. ${segment.name} - Size: ${segment.size}, Priority: ${segment.priority}\n`;
        prompt += `   Pain Points: ${segment.painPoints.join(', ')}\n`;
      });
      prompt += `\n`;
    }

    if (elicitationChoice) {
      const questionCategory = this.getCustomerQuestionCategory(elicitationChoice);
      prompt += `Focus specifically on ${questionCategory} and provide detailed analysis.\n\n`;
      prompt += `Use these systematic questions as analysis framework:\n`;
      prompt += this.getSystematicCustomerQuestions(questionCategory);
    }

    prompt += `\nProvide analysis in the following JSON structure:
    {
      "insights": ["insight1", "insight2", ...],
      "recommendations": ["rec1", "rec2", ...],
      "questions": ["question1", "question2", ...],
      "customerSegments": [{
        "id": "unique-id",
        "name": "segment name",
        "demographics": ["demo1", "demo2"],
        "psychographics": ["psycho1", "psycho2"],
        "painPoints": ["pain1", "pain2"],
        "size": "small|medium|large",
        "acquisitionCost": "cost estimate",
        "lifetimeValue": "LTV estimate",
        "priority": "high|medium|low"
      }],
      "confidence": 0-100
    }`;

    return prompt;
  }

  /**
   * Build value proposition prompt with systematic analysis
   */
  private buildValuePropositionPrompt(request: BusinessModelAnalysisRequest): string {
    const { userInput, sessionData, elicitationChoice } = request;
    
    let prompt = `${BUSINESS_MODEL_AI_PROMPTS.value_proposition.analysis}\n\n`;
    prompt += `Business Context: ${userInput}\n\n`;
    
    if (sessionData.valuePropositions && sessionData.valuePropositions.length > 0) {
      prompt += `Current Value Propositions:\n`;
      sessionData.valuePropositions.forEach((vp, index) => {
        prompt += `${index + 1}. For ${vp.segment}: ${vp.uniqueDifferentiator}\n`;
        prompt += `   Job to be Done: ${vp.jobToBeDone}\n`;
      });
      prompt += `\n`;
    }

    if (elicitationChoice) {
      const questionCategory = this.getValuePropQuestionCategory(elicitationChoice);
      prompt += `Focus specifically on ${questionCategory} and provide detailed analysis.\n\n`;
      prompt += `Use these systematic questions as analysis framework:\n`;
      prompt += this.getSystematicValuePropQuestions(questionCategory);
    }

    prompt += `\nProvide analysis in the following JSON structure:
    {
      "insights": ["insight1", "insight2", ...],
      "recommendations": ["rec1", "rec2", ...],
      "questions": ["question1", "question2", ...],
      "valuePropositions": [{
        "id": "unique-id",
        "segment": "target segment",
        "jobToBeDone": "primary job",
        "painRelievers": ["pain1", "pain2"],
        "gainCreators": ["gain1", "gain2"],
        "uniqueDifferentiator": "unique value",
        "competitiveAdvantage": "advantage description"
      }],
      "confidence": 0-100
    }`;

    return prompt;
  }

  /**
   * Build monetization strategy prompt
   */
  private buildMonetizationStrategyPrompt(request: BusinessModelAnalysisRequest): string {
    const { userInput, sessionData, elicitationChoice } = request;
    
    let prompt = `${BUSINESS_MODEL_AI_PROMPTS.monetization_strategy.analysis}\n\n`;
    prompt += `Business Context: ${userInput}\n\n`;
    
    // Include existing revenue streams for context
    if (sessionData.revenueStreams && sessionData.revenueStreams.length > 0) {
      prompt += `Current Revenue Streams:\n`;
      sessionData.revenueStreams.forEach((stream, index) => {
        prompt += `${index + 1}. ${stream.name} - ${stream.estimatedRevenue} (Feasibility: ${stream.feasibility}%)\n`;
      });
      prompt += `\n`;
    }

    if (elicitationChoice) {
      const questionCategory = this.getMonetizationQuestionCategory(elicitationChoice);
      prompt += `Focus specifically on ${questionCategory}.\n\n`;
    }

    prompt += `\nProvide monetization strategy in JSON format with specific recommendations and implementation plans.`;

    return prompt;
  }

  /**
   * Build implementation planning prompt
   */
  private buildImplementationPlanningPrompt(request: BusinessModelAnalysisRequest): string {
    const { userInput, sessionData } = request;
    
    let prompt = `${BUSINESS_MODEL_AI_PROMPTS.implementation_planning.analysis}\n\n`;
    prompt += `Business Context: ${userInput}\n\n`;
    
    // Include all previous analysis for comprehensive roadmap
    if (sessionData.revenueStreams) {
      prompt += `Recommended Revenue Streams: ${sessionData.revenueStreams.map(s => s.name).join(', ')}\n`;
    }
    if (sessionData.customerSegments) {
      prompt += `Priority Customer Segments: ${sessionData.customerSegments.filter(s => s.priority === 'high').map(s => s.name).join(', ')}\n`;
    }

    prompt += `\nCreate a comprehensive implementation roadmap with prioritized actions and success metrics.`;

    return prompt;
  }

  /**
   * Get systematic revenue questions based on elicitation choice
   */
  private getSystematicRevenueQuestions(category: string): string {
    const questions = {
      'diversification': [
        'What adjacent markets could you serve with minor modifications?',
        'What complementary products or services could you offer?',
        'How could you monetize your existing customer relationships differently?',
        'What data or insights do you have that others would value?',
        'What partnerships could create new revenue streams?'
      ],
      'pricing': [
        'What value metrics matter most to your customers?',
        'How price sensitive are your different customer segments?',
        'What would justify a 2x price increase in your solution?',
        'How does your pricing compare to the cost of alternatives?',
        'What pricing experiments could you run this month?'
      ],
      'validation': [
        'What evidence do you have that customers value your current offering?',
        'How do customers currently measure ROI from your solution?',
        'What would customers pay for your solution if it didn\'t exist?',
        'Which features or services drive the most willingness to pay?',
        'How does customer retention correlate with value delivery?'
      ]
    };

    return questions[category]?.map((q, i) => `${i + 1}. ${q}`).join('\n') || '';
  }

  /**
   * Get systematic customer questions
   */
  private getSystematicCustomerQuestions(category: string): string {
    const questions = {
      'personas': [
        'Describe your highest-value customer in detail',
        'What triggers their need for your solution?',
        'How do they typically discover and evaluate solutions?',
        'What are their decision-making criteria and process?',
        'What would make them recommend you to others?'
      ],
      'segmentation': [
        'What distinct groups of customers have different needs?',
        'Which segments are most underserved by current solutions?',
        'What segments have the highest growth potential?',
        'Which segments are easiest and hardest to serve?',
        'What segments could you dominate with focused effort?'
      ],
      'alignment': [
        'Which customer segments get the most value from your solution?',
        'How does value perception differ across segments?',
        'What value propositions resonate with each segment?',
        'Which segments are most profitable and why?',
        'How should you adjust your offering for different segments?'
      ]
    };

    return questions[category]?.map((q, i) => `${i + 1}. ${q}`).join('\n') || '';
  }

  /**
   * Get systematic value proposition questions
   */
  private getSystematicValuePropQuestions(category: string): string {
    const questions = {
      'clarity': [
        'Complete this sentence: "We help [customer] achieve [outcome] by [unique approach]"',
        'What outcome do customers hire your solution to achieve?',
        'How would customers explain your value to a colleague?',
        'What analogies or comparisons help customers understand your value?',
        'What proof points best demonstrate your value?'
      ],
      'differentiation': [
        'What can you do that competitors fundamentally cannot?',
        'What unique assets, data, or relationships do you have?',
        'What would it cost competitors to replicate your solution?',
        'How do you deliver value differently than alternatives?',
        'What makes your approach unfairly advantageous?'
      ],
      'proof': [
        'What concrete results have you delivered for customers?',
        'What testimonials or case studies showcase your impact?',
        'How do you measure and communicate value delivery?',
        'What guarantees or risk-reduction can you offer?',
        'What third-party validation supports your claims?'
      ]
    };

    return questions[category]?.map((q, i) => `${i + 1}. ${q}`).join('\n') || '';
  }

  /**
   * Helper methods to get question categories based on elicitation choice
   */
  private getRevenueQuestionCategory(choice: number): string {
    const categories = ['diversification', 'pricing', 'validation'];
    return categories[choice - 1] || 'diversification';
  }

  private getCustomerQuestionCategory(choice: number): string {
    const categories = ['personas', 'segmentation', 'alignment'];
    return categories[choice - 1] || 'personas';
  }

  private getValuePropQuestionCategory(choice: number): string {
    const categories = ['clarity', 'differentiation', 'proof'];
    return categories[choice - 1] || 'clarity';
  }

  private getMonetizationQuestionCategory(choice: number): string {
    const categories = ['pricing', 'diversification', 'scaling'];
    return categories[choice - 1] || 'pricing';
  }

  /**
   * Call Claude API for analysis
   */
  private async callClaudeAPI(messages: ClaudeMessage[], analysisType: string): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze_business_model',
          messages,
          analysisType,
          temperature: 0.7,
          maxTokens: 2000
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Claude API call failed:', error);
      throw error;
    }
  }

  /**
   * Parse and structure analysis response
   */
  private parseAnalysisResponse(response: any, phase: string): BusinessModelAnalysisResponse {
    try {
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      
      return {
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
        questions: parsed.questions || [],
        data: parsed.revenueStreams || parsed.customerSegments || parsed.valuePropositions || parsed.leanCanvasData,
        confidence: parsed.confidence || 80,
        feasibilityScores: parsed.feasibilityScores,
        implementationPlan: parsed.implementationPlan
      };
    } catch (error) {
      console.error('Failed to parse analysis response:', error);
      
      // Return fallback response
      return {
        insights: ['Analysis completed but response parsing failed'],
        recommendations: ['Please review the analysis manually'],
        questions: ['What would you like to explore further?'],
        confidence: 60
      };
    }
  }

  /**
   * Generate revenue feasibility assessment
   */
  async assessRevenueFeasibility(revenueStreams: RevenueStream[]): Promise<Record<string, RevenueStreamAnalysis>> {
    const assessments: Record<string, RevenueStreamAnalysis> = {};

    for (const stream of revenueStreams) {
      assessments[stream.id] = {
        stream,
        marketSize: this.estimateMarketSize(stream),
        competitionLevel: this.assessCompetitionLevel(stream),
        implementationComplexity: this.assessImplementationComplexity(stream),
        timeToRevenue: this.estimateTimeToRevenue(stream),
        requiredInvestment: this.estimateRequiredInvestment(stream)
      };
    }

    return assessments;
  }

  /**
   * Helper methods for feasibility assessment
   */
  private estimateMarketSize(stream: RevenueStream): string {
    // Simplified market size estimation based on revenue stream type
    const marketSizes = {
      'subscription': '$10B+ (recurring revenue markets)',
      'marketplace': '$50B+ (platform economy)',
      'advertising': '$400B+ (global ad spend)',
      'freemium': '$5B+ (freemium models)',
      'one-time': 'Varies by category',
      'commission': '$10B+ (transaction-based)',
      'licensing': '$5B+ (IP licensing)'
    };

    return marketSizes[stream.type] || 'Market size analysis required';
  }

  private assessCompetitionLevel(stream: RevenueStream): 'low' | 'medium' | 'high' {
    // Simplified competition assessment
    const competitionLevels = {
      'subscription': 'high',
      'marketplace': 'high', 
      'advertising': 'high',
      'freemium': 'medium',
      'one-time': 'medium',
      'commission': 'medium',
      'licensing': 'low'
    };

    return competitionLevels[stream.type] || 'medium';
  }

  private assessImplementationComplexity(stream: RevenueStream): 'low' | 'medium' | 'high' {
    const complexityLevels = {
      'one-time': 'low',
      'subscription': 'medium',
      'freemium': 'medium',
      'commission': 'medium',
      'advertising': 'high',
      'marketplace': 'high',
      'licensing': 'high'
    };

    return complexityLevels[stream.type] || 'medium';
  }

  private estimateTimeToRevenue(stream: RevenueStream): string {
    const timeEstimates = {
      'one-time': '1-3 months',
      'subscription': '3-6 months',
      'freemium': '6-12 months',
      'commission': '3-9 months',
      'advertising': '6-18 months',
      'marketplace': '12-24 months',
      'licensing': '6-24 months'
    };

    return timeEstimates[stream.type] || '6-12 months';
  }

  private estimateRequiredInvestment(stream: RevenueStream): string {
    const investmentLevels = {
      'one-time': '$5K-50K',
      'subscription': '$10K-100K',
      'freemium': '$50K-500K',
      'commission': '$25K-250K',
      'advertising': '$100K-1M',
      'marketplace': '$250K-2.5M',
      'licensing': '$50K-500K'
    };

    return investmentLevels[stream.type] || '$25K-250K';
  }
}

/**
 * Factory function to create revenue stream analyzer
 */
export function createRevenueStreamAnalyzer(baseUrl?: string): RevenueStreamAnalyzer {
  return new RevenueStreamAnalyzer(baseUrl);
}