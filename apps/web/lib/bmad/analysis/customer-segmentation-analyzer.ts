import { 
  BusinessModelPhaseData, 
  CustomerSegment, 
  ValueProposition 
} from '../templates/business-model-templates';

/**
 * Advanced Customer Segmentation Analysis Engine
 * Uses sophisticated AI prompts and frameworks for customer segment identification and analysis
 */

export interface CustomerSegmentationRequest {
  businessContext: string;
  currentCustomers?: string;
  marketData?: string;
  competitiveInfo?: string;
  analysisType: 'demographic' | 'psychographic' | 'behavioral' | 'needs-based' | 'value-based';
}

export interface CustomerSegmentationResponse {
  segments: IdentifiedSegment[];
  segmentationStrategy: SegmentationStrategy;
  priorityMatrix: SegmentPriorityMatrix;
  actionableInsights: string[];
  recommendedFocus: string[];
}

export interface IdentifiedSegment {
  id: string;
  name: string;
  description: string;
  demographics: DemographicProfile;
  psychographics: PsychographicProfile;
  behaviors: BehavioralProfile;
  needs: CustomerNeed[];
  painPoints: PainPoint[];
  size: MarketSize;
  accessibility: AccessibilityScore;
  profitability: ProfitabilityMetrics;
  competitivePosition: CompetitivePosition;
}

export interface DemographicProfile {
  ageRange?: string;
  income?: string;
  education?: string;
  occupation?: string;
  geography?: string;
  companySize?: string;
  industry?: string;
  decisionRole?: string;
}

export interface PsychographicProfile {
  values: string[];
  attitudes: string[];
  interests: string[];
  lifestyle: string[];
  personality: string[];
  motivations: string[];
}

export interface BehavioralProfile {
  purchaseFrequency: string;
  spendingPattern: string;
  channelPreference: string[];
  decisionSpeed: 'fast' | 'moderate' | 'slow';
  researchBehavior: string;
  loyaltyLevel: 'low' | 'medium' | 'high';
}

export interface CustomerNeed {
  category: 'functional' | 'emotional' | 'social';
  description: string;
  priority: 'high' | 'medium' | 'low';
  currentSolution: string;
  satisfactionLevel: number;
}

export interface PainPoint {
  description: string;
  frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  intensity: number; // 1-10 scale
  currentCost: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface MarketSize {
  totalAddressable: number;
  serviceable: number;
  obtainable: number;
  growthRate: number;
  confidence: number;
}

export interface AccessibilityScore {
  score: number;
  factors: AccessibilityFactor[];
}

export interface AccessibilityFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface ProfitabilityMetrics {
  lifetimeValue: number;
  acquisitionCost: number;
  paybackPeriod: string;
  profitMargin: number;
  confidence: number;
}

export interface CompetitivePosition {
  competitorCount: number;
  competitionLevel: 'low' | 'medium' | 'high';
  differentiationOpportunity: number;
  marketShare: number;
}

export interface SegmentationStrategy {
  primaryDimension: 'demographic' | 'psychographic' | 'behavioral' | 'needs-based' | 'value-based';
  secondaryDimensions: string[];
  rationale: string;
  expectedOutcomes: string[];
}

export interface SegmentPriorityMatrix {
  highPriority: string[];
  mediumPriority: string[];
  lowPriority: string[];
  reasoning: Record<string, string>;
}

/**
 * Advanced Customer Segmentation Analyzer
 */
export class CustomerSegmentationAnalyzer {
  
  /**
   * Comprehensive customer segmentation analysis using advanced AI prompts
   */
  async analyzeCustomerSegmentation(request: CustomerSegmentationRequest): Promise<CustomerSegmentationResponse> {
    const prompt = this.buildSegmentationPrompt(request);
    
    // Call Claude API with sophisticated prompts
    const response = await this.executeSegmentationAnalysis(prompt, request.analysisType);
    
    return this.parseSegmentationResponse(response);
  }

  /**
   * Identify customer segments using Jobs-to-be-Done framework
   */
  async identifyJTBDSegments(businessContext: string, currentCustomers?: string): Promise<CustomerSegmentationResponse> {
    const prompt = this.buildJTBDSegmentationPrompt(businessContext, currentCustomers);
    
    const response = await this.executeSegmentationAnalysis(prompt, 'needs-based');
    
    return this.parseSegmentationResponse(response);
  }

  /**
   * Create detailed customer personas from segment data
   */
  createCustomerPersonas(segments: IdentifiedSegment[]): CustomerPersona[] {
    return segments.map(segment => this.convertSegmentToPersona(segment));
  }

  /**
   * Build sophisticated customer segmentation prompt
   */
  private buildSegmentationPrompt(request: CustomerSegmentationRequest): string {
    let prompt = this.getSegmentationSystemPrompt(request.analysisType);
    
    prompt += `\n\nBusiness Context: ${request.businessContext}\n\n`;
    
    if (request.currentCustomers) {
      prompt += `Current Customer Information: ${request.currentCustomers}\n\n`;
    }
    
    if (request.marketData) {
      prompt += `Market Data: ${request.marketData}\n\n`;
    }
    
    if (request.competitiveInfo) {
      prompt += `Competitive Information: ${request.competitiveInfo}\n\n`;
    }
    
    prompt += this.getSegmentationAnalysisInstructions(request.analysisType);
    
    prompt += this.getSegmentationOutputFormat();
    
    return prompt;
  }

  /**
   * Build Jobs-to-be-Done segmentation prompt
   */
  private buildJTBDSegmentationPrompt(businessContext: string, currentCustomers?: string): string {
    let prompt = `You are an expert in Jobs-to-be-Done (JTBD) customer segmentation methodology.
    Your role is to identify customer segments based on the jobs customers are trying to get done,
    not just their demographic or psychographic characteristics.

    Focus on:
    1. Functional jobs (practical tasks customers want to accomplish)
    2. Emotional jobs (feelings customers want to achieve or avoid)
    3. Social jobs (how customers want to be perceived by others)
    
    Use Clayton Christensen's JTBD framework to identify segments based on:
    - The job to be done
    - The circumstances that trigger the need
    - The desired outcome
    - The constraints and trade-offs
    - The success metrics\n\n`;
    
    prompt += `Business Context: ${businessContext}\n\n`;
    
    if (currentCustomers) {
      prompt += `Current Customer Insights: ${currentCustomers}\n\n`;
    }
    
    prompt += `Apply JTBD methodology to identify distinct customer segments. For each segment, define:

    1. **Primary Job to be Done**: What is the core functional job?
    2. **Emotional Job**: What emotional outcome do they seek?  
    3. **Social Job**: How do they want to be perceived?
    4. **Job Triggers**: What circumstances create the need?
    5. **Success Metrics**: How do they measure successful job completion?
    6. **Current Alternatives**: How are they getting the job done today?
    7. **Job Constraints**: What limits their ability to get the job done?
    8. **Overserved/Underserved**: Where are current solutions failing?

    Provide this analysis in structured JSON format with 3-5 distinct JTBD segments.`;
    
    return prompt;
  }

  /**
   * Get system prompts for different segmentation types
   */
  private getSegmentationSystemPrompt(analysisType: string): string {
    const prompts = {
      'demographic': `You are a demographic segmentation expert. Focus on age, income, education, 
        occupation, geography, and other statistical characteristics that define customer groups.
        Create segments that are measurable, substantial, accessible, and actionable.`,
      
      'psychographic': `You are a psychographic segmentation specialist. Focus on values, attitudes, 
        interests, lifestyle, personality traits, and motivations. Create segments based on 
        psychological and lifestyle characteristics that drive purchasing decisions.`,
      
      'behavioral': `You are a behavioral segmentation analyst. Focus on purchase behavior, 
        usage patterns, customer journey stages, loyalty levels, and decision-making processes.
        Create segments based on how customers actually behave and interact with products/services.`,
      
      'needs-based': `You are a needs-based segmentation expert using Jobs-to-be-Done methodology.
        Focus on the functional, emotional, and social jobs customers are trying to accomplish.
        Create segments based on underlying needs and desired outcomes, not just characteristics.`,
      
      'value-based': `You are a value-based segmentation specialist. Focus on the economic value 
        customers derive and are willing to pay for. Create segments based on price sensitivity,
        lifetime value potential, and willingness to pay for different value propositions.`
    };
    
    return prompts[analysisType] || prompts['needs-based'];
  }

  /**
   * Get analysis instructions for each segmentation type
   */
  private getSegmentationAnalysisInstructions(analysisType: string): string {
    const instructions = {
      'demographic': `Analyze and create 3-5 demographic segments using these criteria:
        1. Age ranges and generational differences
        2. Income levels and spending power  
        3. Education and professional background
        4. Geographic location and cultural factors
        5. Company size and industry (for B2B)
        
        For each segment, estimate market size, accessibility, and profitability.`,
      
      'psychographic': `Analyze and create 3-5 psychographic segments focusing on:
        1. Core values and belief systems
        2. Attitudes toward the problem/solution
        3. Lifestyle preferences and choices
        4. Personality traits affecting decisions
        5. Motivations and aspirations
        
        Explain how these psychological factors impact buying decisions.`,
      
      'behavioral': `Analyze and create 3-5 behavioral segments based on:
        1. Purchase frequency and timing patterns
        2. Usage intensity and engagement levels
        3. Channel preferences and shopping behavior
        4. Decision-making speed and process
        5. Loyalty and switching behavior
        
        Focus on actionable behavioral insights for targeting.`,
      
      'needs-based': `Apply Jobs-to-be-Done framework to create 3-5 needs-based segments:
        1. Primary functional job to be done
        2. Emotional and social job dimensions  
        3. Job triggers and circumstances
        4. Current alternative solutions
        5. Unmet needs and improvement opportunities
        
        Focus on the job, not the customer characteristics.`,
      
      'value-based': `Create 3-5 value-based segments analyzing:
        1. Willingness to pay and price sensitivity
        2. Value perception and benefit priorities
        3. Economic impact and ROI expectations
        4. Lifetime value potential
        5. Cost-to-serve considerations
        
        Focus on economic value creation and capture.`
    };
    
    return instructions[analysisType] || instructions['needs-based'];
  }

  /**
   * Get structured output format for segmentation analysis
   */
  private getSegmentationOutputFormat(): string {
    return `\n\nProvide your analysis in the following JSON structure:

    {
      "segments": [
        {
          "id": "segment-1",
          "name": "Segment Name",
          "description": "Detailed description",
          "demographics": {
            "ageRange": "25-45",
            "income": "$50K-100K",
            "education": "College+",
            "occupation": "Professional",
            "geography": "Urban/Suburban",
            "companySize": "50-500 employees",
            "industry": "Technology",
            "decisionRole": "Manager"
          },
          "psychographics": {
            "values": ["efficiency", "innovation"],
            "attitudes": ["tech-forward", "cost-conscious"],
            "interests": ["productivity tools"],
            "lifestyle": ["busy professional"],
            "personality": ["analytical", "pragmatic"],
            "motivations": ["career advancement"]
          },
          "behaviors": {
            "purchaseFrequency": "quarterly",
            "spendingPattern": "deliberate",
            "channelPreference": ["online", "direct"],
            "decisionSpeed": "moderate",
            "researchBehavior": "thorough research",
            "loyaltyLevel": "medium"
          },
          "needs": [
            {
              "category": "functional",
              "description": "Need description",
              "priority": "high",
              "currentSolution": "Current approach",
              "satisfactionLevel": 6
            }
          ],
          "painPoints": [
            {
              "description": "Pain point description",
              "frequency": "frequent",
              "intensity": 8,
              "currentCost": "$5000/month",
              "urgency": "high"
            }
          ],
          "size": {
            "totalAddressable": 1000000,
            "serviceable": 100000,
            "obtainable": 10000,
            "growthRate": 0.15,
            "confidence": 0.7
          },
          "accessibility": {
            "score": 75,
            "factors": [
              {
                "factor": "Digital channels",
                "impact": "positive",
                "weight": 0.3,
                "description": "Active on digital platforms"
              }
            ]
          },
          "profitability": {
            "lifetimeValue": 50000,
            "acquisitionCost": 5000,
            "paybackPeriod": "6 months",
            "profitMargin": 0.4,
            "confidence": 0.8
          },
          "competitivePosition": {
            "competitorCount": 5,
            "competitionLevel": "medium",
            "differentiationOpportunity": 0.6,
            "marketShare": 0.1
          }
        }
      ],
      "segmentationStrategy": {
        "primaryDimension": "needs-based",
        "secondaryDimensions": ["behavioral", "demographic"],
        "rationale": "Why this segmentation approach",
        "expectedOutcomes": ["Outcome 1", "Outcome 2"]
      },
      "priorityMatrix": {
        "highPriority": ["segment-1"],
        "mediumPriority": ["segment-2"],
        "lowPriority": ["segment-3"],
        "reasoning": {
          "segment-1": "High accessibility and profitability"
        }
      },
      "actionableInsights": [
        "Key insight for action",
        "Strategic recommendation"
      ],
      "recommendedFocus": [
        "Primary segment to target first",
        "Secondary segment for expansion"
      ]
    }`;
  }

  /**
   * Execute segmentation analysis via Claude API
   */
  private async executeSegmentationAnalysis(prompt: string, analysisType: string): Promise<any> {
    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze_customer_segmentation',
          prompt,
          analysisType,
          temperature: 0.7,
          maxTokens: 3000
        }),
      });

      if (!response.ok) {
        throw new Error(`Segmentation analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Customer segmentation analysis failed:', error);
      throw error;
    }
  }

  /**
   * Parse segmentation response from Claude
   */
  private parseSegmentationResponse(response: any): CustomerSegmentationResponse {
    try {
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      
      return {
        segments: parsed.segments || [],
        segmentationStrategy: parsed.segmentationStrategy || {
          primaryDimension: 'needs-based',
          secondaryDimensions: [],
          rationale: 'Default segmentation approach',
          expectedOutcomes: []
        },
        priorityMatrix: parsed.priorityMatrix || {
          highPriority: [],
          mediumPriority: [],
          lowPriority: [],
          reasoning: {}
        },
        actionableInsights: parsed.actionableInsights || [],
        recommendedFocus: parsed.recommendedFocus || []
      };
    } catch (error) {
      console.error('Failed to parse segmentation response:', error);
      
      // Return fallback response
      return {
        segments: [],
        segmentationStrategy: {
          primaryDimension: 'needs-based',
          secondaryDimensions: [],
          rationale: 'Analysis failed, manual review required',
          expectedOutcomes: []
        },
        priorityMatrix: {
          highPriority: [],
          mediumPriority: [],
          lowPriority: [],
          reasoning: {}
        },
        actionableInsights: ['Segmentation analysis requires manual review'],
        recommendedFocus: ['Review business context and retry analysis']
      };
    }
  }

  /**
   * Convert segment to persona
   */
  private convertSegmentToPersona(segment: IdentifiedSegment): CustomerPersona {
    return {
      id: segment.id,
      name: this.generatePersonaName(segment),
      tagline: this.generatePersonaTagline(segment),
      demographics: segment.demographics,
      psychographics: segment.psychographics,
      behaviors: segment.behaviors,
      needs: segment.needs,
      painPoints: segment.painPoints,
      goals: this.extractGoals(segment.needs),
      frustrations: this.extractFrustrations(segment.painPoints),
      preferredChannels: segment.behaviors.channelPreference,
      buyingProcess: this.generateBuyingProcess(segment.behaviors),
      influencers: this.identifyInfluencers(segment),
      quotes: this.generatePersonaQuotes(segment)
    };
  }

  /**
   * Generate persona name from segment data
   */
  private generatePersonaName(segment: IdentifiedSegment): string {
    const names = {
      'professional': ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey'],
      'executive': ['Victoria', 'Michael', 'Sarah', 'David', 'Jennifer'],
      'startup': ['Jake', 'Emma', 'Noah', 'Sophia', 'Ethan'],
      'enterprise': ['Robert', 'Linda', 'James', 'Patricia', 'John'],
      'small-business': ['Maria', 'Chris', 'Lisa', 'Mark', 'Anna']
    };
    
    // Determine persona type from demographics
    let personaType = 'professional';
    if (segment.demographics.decisionRole?.toLowerCase().includes('executive')) {
      personaType = 'executive';
    } else if (segment.demographics.companySize?.includes('1-50')) {
      personaType = 'startup';
    } else if (segment.demographics.companySize?.includes('1000+')) {
      personaType = 'enterprise';
    }
    
    const nameList = names[personaType] || names['professional'];
    return nameList[Math.floor(Math.random() * nameList.length)];
  }

  /**
   * Generate persona tagline
   */
  private generatePersonaTagline(segment: IdentifiedSegment): string {
    const role = segment.demographics.decisionRole || 'Professional';
    const primaryNeed = segment.needs.find(need => need.priority === 'high')?.description || 'efficiency';
    return `${role} focused on ${primaryNeed}`;
  }

  /**
   * Extract goals from needs
   */
  private extractGoals(needs: CustomerNeed[]): string[] {
    return needs
      .filter(need => need.priority === 'high')
      .map(need => need.description)
      .slice(0, 3);
  }

  /**
   * Extract frustrations from pain points
   */
  private extractFrustrations(painPoints: PainPoint[]): string[] {
    return painPoints
      .filter(pain => pain.intensity >= 7)
      .map(pain => pain.description)
      .slice(0, 3);
  }

  /**
   * Generate buying process description
   */
  private generateBuyingProcess(behaviors: BehavioralProfile): string {
    const speed = behaviors.decisionSpeed;
    const research = behaviors.researchBehavior;
    
    if (speed === 'fast') {
      return 'Quick decision-maker who relies on trusted sources and peer recommendations';
    } else if (speed === 'slow') {
      return 'Thorough evaluator who conducts extensive research and seeks multiple stakeholder input';
    } else {
      return 'Balanced approach with moderate research and stakeholder consultation';
    }
  }

  /**
   * Identify key influencers for persona
   */
  private identifyInfluencers(segment: IdentifiedSegment): string[] {
    const influencers = [];
    
    if (segment.demographics.decisionRole?.toLowerCase().includes('manager')) {
      influencers.push('Direct reports', 'Senior leadership', 'Peers in similar roles');
    } else if (segment.demographics.decisionRole?.toLowerCase().includes('executive')) {
      influencers.push('Board members', 'Industry analysts', 'Trusted advisors');
    } else {
      influencers.push('Colleagues', 'Industry experts', 'Online communities');
    }
    
    return influencers;
  }

  /**
   * Generate representative quotes for persona
   */
  private generatePersonaQuotes(segment: IdentifiedSegment): string[] {
    const quotes = [];
    
    // Add quote based on primary pain point
    const topPainPoint = segment.painPoints.find(pain => pain.intensity >= 8);
    if (topPainPoint) {
      quotes.push(`"${topPainPoint.description} is really holding us back"`);
    }
    
    // Add quote based on primary need
    const topNeed = segment.needs.find(need => need.priority === 'high');
    if (topNeed) {
      quotes.push(`"What we really need is ${topNeed.description}"`);
    }
    
    // Add generic quote based on segment characteristics
    if (segment.behaviors.researchBehavior.includes('thorough')) {
      quotes.push(`"I need to see the data and ROI before making any decisions"`);
    }
    
    return quotes;
  }
}

/**
 * Customer Persona interface
 */
export interface CustomerPersona {
  id: string;
  name: string;
  tagline: string;
  demographics: DemographicProfile;
  psychographics: PsychographicProfile;
  behaviors: BehavioralProfile;
  needs: CustomerNeed[];
  painPoints: PainPoint[];
  goals: string[];
  frustrations: string[];
  preferredChannels: string[];
  buyingProcess: string;
  influencers: string[];
  quotes: string[];
}

/**
 * Factory function to create customer segmentation analyzer
 */
export function createCustomerSegmentationAnalyzer(): CustomerSegmentationAnalyzer {
  return new CustomerSegmentationAnalyzer();
}