import { 
  BusinessModelPhaseData, 
  RevenueStream, 
  CustomerSegment, 
  ValueProposition 
} from '../templates/business-model-templates';

/**
 * Comprehensive Revenue and Business Model Feasibility Assessment Engine
 * Evaluates viability of revenue streams, customer segments, and overall business model
 */

export interface FeasibilityAssessment {
  overallScore: number;
  category: 'high' | 'medium' | 'low';
  revenueStreamAssessments: RevenueStreamFeasibility[];
  customerSegmentAssessments: CustomerSegmentFeasibility[];
  businessModelRisks: BusinessModelRisk[];
  recommendations: FeasibilityRecommendation[];
  implementationPlan: ImplementationStep[];
}

export interface RevenueStreamFeasibility {
  streamId: string;
  streamName: string;
  feasibilityScore: number;
  marketValidation: MarketValidationLevel;
  competitiveAnalysis: CompetitiveAssessment;
  resourceRequirements: ResourceAssessment;
  timeToRevenue: TimeToRevenueAssessment;
  riskFactors: RiskFactor[];
  opportunities: OpportunityFactor[];
}

export interface CustomerSegmentFeasibility {
  segmentId: string;
  segmentName: string;
  accessibilityScore: number;
  profitabilityScore: number;
  scalabilityScore: number;
  competitionLevel: 'low' | 'medium' | 'high';
  marketSize: MarketSizeAssessment;
  acquisitionComplexity: AcquisitionComplexity;
}

export interface BusinessModelRisk {
  category: 'market' | 'competitive' | 'operational' | 'financial' | 'regulatory';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  mitigation: string[];
}

export interface FeasibilityRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  expectedImpact: string;
  timeframe: '1-month' | '3-months' | '6-months' | '12-months';
  requiredResources: string[];
}

export interface ImplementationStep {
  id: string;
  step: string;
  order: number;
  dependencies: string[];
  duration: string;
  effort: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  successMetrics: string[];
}

export enum MarketValidationLevel {
  VALIDATED = 'validated',
  PARTIALLY_VALIDATED = 'partially-validated',
  ASSUMED = 'assumed',
  UNKNOWN = 'unknown'
}

export interface CompetitiveAssessment {
  competitorCount: number;
  competitionIntensity: 'low' | 'medium' | 'high';
  differentiation: 'strong' | 'moderate' | 'weak';
  barriers: CompetitiveBarrier[];
}

export interface CompetitiveBarrier {
  type: 'technology' | 'brand' | 'cost' | 'network' | 'regulatory' | 'data';
  strength: 'low' | 'medium' | 'high';
  description: string;
}

export interface ResourceAssessment {
  financial: FinancialRequirement;
  human: HumanResourceRequirement;
  technology: TechnologyRequirement;
  operational: OperationalRequirement;
}

export interface FinancialRequirement {
  initialInvestment: number;
  monthlyOperatingCost: number;
  breakEvenTimeframe: string;
  riskCapital: number;
}

export interface HumanResourceRequirement {
  keyRoles: string[];
  experienceLevel: 'junior' | 'mid' | 'senior' | 'expert';
  teamSize: number;
  specializedSkills: string[];
}

export interface TechnologyRequirement {
  complexity: 'low' | 'medium' | 'high';
  existingSolutions: boolean;
  developmentTime: string;
  maintenanceEffort: 'low' | 'medium' | 'high';
}

export interface OperationalRequirement {
  processComplexity: 'low' | 'medium' | 'high';
  scalingChallenges: string[];
  qualityControlNeeds: string[];
  complianceRequirements: string[];
}

export interface TimeToRevenueAssessment {
  minimumViableProduct: string;
  firstCustomerRevenue: string;
  sustainableRevenue: string;
  scalableRevenue: string;
  criticalMilestones: Milestone[];
}

export interface Milestone {
  name: string;
  timeframe: string;
  requiredInvestment: number;
  riskFactors: string[];
}

export interface MarketSizeAssessment {
  totalAddressableMarket: number;
  serviceableAddressableMarket: number;
  serviceableObtainableMarket: number;
  marketGrowthRate: number;
  marketMaturity: 'emerging' | 'growing' | 'mature' | 'declining';
}

export interface AcquisitionComplexity {
  salesCycleLength: string;
  decisionMakerCount: number;
  acquisitionCost: number;
  conversionRate: number;
  scalingDifficulty: 'low' | 'medium' | 'high';
}

export interface RiskFactor {
  type: 'market' | 'competitive' | 'operational' | 'regulatory' | 'financial';
  description: string;
  probability: number;
  impact: number;
  mitigation: string;
}

export interface OpportunityFactor {
  type: 'market-trend' | 'competitive-gap' | 'technology-advancement' | 'regulatory-change';
  description: string;
  potential: number;
  timeframe: string;
  requirements: string[];
}

/**
 * Revenue and Business Model Feasibility Assessment Engine
 */
export class FeasibilityAssessmentEngine {

  /**
   * Conduct comprehensive business model feasibility assessment
   */
  assessBusinessModelFeasibility(sessionData: BusinessModelPhaseData): FeasibilityAssessment {
    // Assess revenue streams
    const revenueStreamAssessments = this.assessRevenueStreams(sessionData.revenueStreams || []);
    
    // Assess customer segments  
    const customerSegmentAssessments = this.assessCustomerSegments(sessionData.customerSegments || []);
    
    // Identify business model risks
    const businessModelRisks = this.identifyBusinessModelRisks(sessionData, revenueStreamAssessments, customerSegmentAssessments);
    
    // Generate recommendations
    const recommendations = this.generateFeasibilityRecommendations(revenueStreamAssessments, customerSegmentAssessments, businessModelRisks);
    
    // Create implementation plan
    const implementationPlan = this.createImplementationPlan(revenueStreamAssessments, recommendations);
    
    // Calculate overall feasibility score
    const overallScore = this.calculateOverallFeasibilityScore(revenueStreamAssessments, customerSegmentAssessments, businessModelRisks);
    
    return {
      overallScore,
      category: this.categorizeFeasibility(overallScore),
      revenueStreamAssessments,
      customerSegmentAssessments,
      businessModelRisks,
      recommendations,
      implementationPlan
    };
  }

  /**
   * Assess individual revenue streams
   */
  private assessRevenueStreams(streams: RevenueStream[]): RevenueStreamFeasibility[] {
    return streams.map(stream => {
      const marketValidation = this.assessMarketValidation(stream);
      const competitiveAnalysis = this.assessCompetitivePosition(stream);
      const resourceRequirements = this.assessResourceRequirements(stream);
      const timeToRevenue = this.assessTimeToRevenue(stream);
      const riskFactors = this.identifyRiskFactors(stream);
      const opportunities = this.identifyOpportunities(stream);
      
      const feasibilityScore = this.calculateRevenueStreamFeasibility(
        marketValidation, 
        competitiveAnalysis, 
        resourceRequirements, 
        timeToRevenue, 
        riskFactors
      );

      return {
        streamId: stream.id,
        streamName: stream.name,
        feasibilityScore,
        marketValidation,
        competitiveAnalysis,
        resourceRequirements,
        timeToRevenue,
        riskFactors,
        opportunities
      };
    });
  }

  /**
   * Assess customer segments
   */
  private assessCustomerSegments(segments: CustomerSegment[]): CustomerSegmentFeasibility[] {
    return segments.map(segment => {
      const accessibilityScore = this.calculateAccessibilityScore(segment);
      const profitabilityScore = this.calculateProfitabilityScore(segment);
      const scalabilityScore = this.calculateScalabilityScore(segment);
      const competitionLevel = this.assessSegmentCompetition(segment);
      const marketSize = this.assessSegmentMarketSize(segment);
      const acquisitionComplexity = this.assessAcquisitionComplexity(segment);

      return {
        segmentId: segment.id,
        segmentName: segment.name,
        accessibilityScore,
        profitabilityScore,
        scalabilityScore,
        competitionLevel,
        marketSize,
        acquisitionComplexity
      };
    });
  }

  /**
   * Revenue stream feasibility assessment methods
   */
  private assessMarketValidation(stream: RevenueStream): MarketValidationLevel {
    // Assess based on market validation status and confidence
    if (stream.marketValidation === 'validated' && stream.confidence >= 80) {
      return MarketValidationLevel.VALIDATED;
    } else if (stream.confidence >= 60) {
      return MarketValidationLevel.PARTIALLY_VALIDATED;
    } else if (stream.confidence >= 40) {
      return MarketValidationLevel.ASSUMED;
    }
    return MarketValidationLevel.UNKNOWN;
  }

  private assessCompetitivePosition(stream: RevenueStream): CompetitiveAssessment {
    // Simplified competitive assessment based on revenue stream type
    const competitionMap = {
      'subscription': { count: 15, intensity: 'high' as const, differentiation: 'moderate' as const },
      'marketplace': { count: 8, intensity: 'high' as const, differentiation: 'strong' as const },
      'advertising': { count: 25, intensity: 'high' as const, differentiation: 'weak' as const },
      'freemium': { count: 12, intensity: 'medium' as const, differentiation: 'moderate' as const },
      'one-time': { count: 20, intensity: 'medium' as const, differentiation: 'moderate' as const },
      'commission': { count: 10, intensity: 'medium' as const, differentiation: 'moderate' as const },
      'licensing': { count: 5, intensity: 'low' as const, differentiation: 'strong' as const }
    };

    const assessment = competitionMap[stream.type] || { count: 10, intensity: 'medium' as const, differentiation: 'moderate' as const };

    return {
      competitorCount: assessment.count,
      competitionIntensity: assessment.intensity,
      differentiation: assessment.differentiation,
      barriers: this.generateCompetitiveBarriers(stream)
    };
  }

  private generateCompetitiveBarriers(stream: RevenueStream): CompetitiveBarrier[] {
    const barriers: CompetitiveBarrier[] = [];
    
    switch (stream.type) {
      case 'marketplace':
        barriers.push(
          { type: 'network', strength: 'high', description: 'Network effects create strong competitive moat' },
          { type: 'data', strength: 'medium', description: 'Transaction data provides insights' }
        );
        break;
      case 'subscription':
        barriers.push(
          { type: 'brand', strength: 'medium', description: 'Customer loyalty and switching costs' },
          { type: 'cost', strength: 'low', description: 'Economies of scale in operations' }
        );
        break;
      case 'licensing':
        barriers.push(
          { type: 'regulatory', strength: 'high', description: 'Intellectual property protection' },
          { type: 'technology', strength: 'high', description: 'Proprietary technology or process' }
        );
        break;
      default:
        barriers.push(
          { type: 'brand', strength: 'low', description: 'Basic brand recognition' }
        );
    }
    
    return barriers;
  }

  private assessResourceRequirements(stream: RevenueStream): ResourceAssessment {
    const resourceMap = {
      'subscription': {
        financial: { initial: 100000, monthly: 20000, breakEven: '12-18 months', risk: 50000 },
        teamSize: 8, experience: 'mid' as const, complexity: 'medium' as const
      },
      'marketplace': {
        financial: { initial: 500000, monthly: 75000, breakEven: '18-36 months', risk: 250000 },
        teamSize: 15, experience: 'senior' as const, complexity: 'high' as const
      },
      'advertising': {
        financial: { initial: 250000, monthly: 40000, breakEven: '24-36 months', risk: 100000 },
        teamSize: 10, experience: 'senior' as const, complexity: 'high' as const
      },
      'freemium': {
        financial: { initial: 200000, monthly: 35000, breakEven: '18-24 months', risk: 75000 },
        teamSize: 12, experience: 'mid' as const, complexity: 'medium' as const
      },
      'one-time': {
        financial: { initial: 50000, monthly: 10000, breakEven: '6-12 months', risk: 25000 },
        teamSize: 5, experience: 'junior' as const, complexity: 'low' as const
      },
      'commission': {
        financial: { initial: 75000, monthly: 15000, breakEven: '9-15 months', risk: 35000 },
        teamSize: 6, experience: 'mid' as const, complexity: 'medium' as const
      },
      'licensing': {
        financial: { initial: 150000, monthly: 25000, breakEven: '12-24 months', risk: 50000 },
        teamSize: 8, experience: 'expert' as const, complexity: 'high' as const
      }
    };

    const requirements = resourceMap[stream.type] || resourceMap['one-time'];

    return {
      financial: {
        initialInvestment: requirements.financial.initial,
        monthlyOperatingCost: requirements.financial.monthly,
        breakEvenTimeframe: requirements.financial.breakEven,
        riskCapital: requirements.financial.risk
      },
      human: {
        keyRoles: this.getKeyRoles(stream.type),
        experienceLevel: requirements.experience,
        teamSize: requirements.teamSize,
        specializedSkills: this.getSpecializedSkills(stream.type)
      },
      technology: {
        complexity: requirements.complexity,
        existingSolutions: this.hasExistingSolutions(stream.type),
        developmentTime: this.getDevelopmentTime(stream.type),
        maintenanceEffort: requirements.complexity
      },
      operational: {
        processComplexity: requirements.complexity,
        scalingChallenges: this.getScalingChallenges(stream.type),
        qualityControlNeeds: this.getQualityControlNeeds(stream.type),
        complianceRequirements: this.getComplianceRequirements(stream.type)
      }
    };
  }

  private assessTimeToRevenue(stream: RevenueStream): TimeToRevenueAssessment {
    const timeMap = {
      'one-time': { mvp: '2-4 weeks', first: '1-3 months', sustainable: '3-6 months', scalable: '6-12 months' },
      'subscription': { mvp: '4-8 weeks', first: '3-6 months', sustainable: '6-12 months', scalable: '12-24 months' },
      'freemium': { mvp: '8-16 weeks', first: '6-12 months', sustainable: '12-18 months', scalable: '18-36 months' },
      'commission': { mvp: '6-12 weeks', first: '3-9 months', sustainable: '9-18 months', scalable: '18-30 months' },
      'advertising': { mvp: '12-24 weeks', first: '6-18 months', sustainable: '18-36 months', scalable: '36-60 months' },
      'marketplace': { mvp: '16-32 weeks', first: '12-24 months', sustainable: '24-48 months', scalable: '48-84 months' },
      'licensing': { mvp: '8-20 weeks', first: '6-24 months', sustainable: '12-36 months', scalable: '24-60 months' }
    };

    const timeline = timeMap[stream.type] || timeMap['one-time'];

    return {
      minimumViableProduct: timeline.mvp,
      firstCustomerRevenue: timeline.first,
      sustainableRevenue: timeline.sustainable,
      scalableRevenue: timeline.scalable,
      criticalMilestones: this.generateMilestones(stream)
    };
  }

  private generateMilestones(stream: RevenueStream): Milestone[] {
    const commonMilestones = [
      {
        name: 'MVP Launch',
        timeframe: '3 months',
        requiredInvestment: 25000,
        riskFactors: ['Technical delays', 'Feature scope creep']
      },
      {
        name: 'First Customer',
        timeframe: '6 months',
        requiredInvestment: 50000,
        riskFactors: ['Market fit validation', 'Sales process efficiency']
      },
      {
        name: 'Product-Market Fit',
        timeframe: '12 months',
        requiredInvestment: 100000,
        riskFactors: ['Customer retention', 'Unit economics validation']
      }
    ];

    // Add stream-specific milestones
    switch (stream.type) {
      case 'subscription':
        commonMilestones.push({
          name: 'Recurring Revenue Target',
          timeframe: '18 months',
          requiredInvestment: 150000,
          riskFactors: ['Churn rate', 'Customer acquisition cost']
        });
        break;
      case 'marketplace':
        commonMilestones.push({
          name: 'Network Effects',
          timeframe: '24 months',
          requiredInvestment: 300000,
          riskFactors: ['Supply-demand balance', 'Platform adoption']
        });
        break;
    }

    return commonMilestones;
  }

  private identifyRiskFactors(stream: RevenueStream): RiskFactor[] {
    const risks: RiskFactor[] = [];
    
    // Universal risks
    risks.push({
      type: 'market',
      description: 'Market demand may not materialize as expected',
      probability: 0.3,
      impact: 0.8,
      mitigation: 'Conduct thorough market validation before full investment'
    });

    risks.push({
      type: 'competitive',
      description: 'Competitors may enter market with superior offering',
      probability: 0.4,
      impact: 0.6,
      mitigation: 'Build strong competitive moats and customer loyalty'
    });

    // Stream-specific risks
    switch (stream.type) {
      case 'subscription':
        risks.push({
          type: 'operational',
          description: 'High customer churn rates',
          probability: 0.5,
          impact: 0.9,
          mitigation: 'Focus on customer success and value delivery'
        });
        break;
      case 'marketplace':
        risks.push({
          type: 'operational',
          description: 'Chicken-and-egg problem for supply/demand',
          probability: 0.7,
          impact: 0.9,
          mitigation: 'Start with one side and incentivize early adoption'
        });
        break;
      case 'advertising':
        risks.push({
          type: 'regulatory',
          description: 'Privacy regulations affecting ad targeting',
          probability: 0.6,
          impact: 0.7,
          mitigation: 'Develop privacy-compliant advertising solutions'
        });
        break;
    }

    return risks;
  }

  private identifyOpportunities(stream: RevenueStream): OpportunityFactor[] {
    const opportunities: OpportunityFactor[] = [];

    // Universal opportunities
    opportunities.push({
      type: 'technology-advancement',
      description: 'AI and automation can reduce operational costs',
      potential: 0.6,
      timeframe: '12-24 months',
      requirements: ['Technology investment', 'Team training']
    });

    // Stream-specific opportunities
    switch (stream.type) {
      case 'subscription':
        opportunities.push({
          type: 'market-trend',
          description: 'Growing preference for subscription-based services',
          potential: 0.8,
          timeframe: '6-18 months',
          requirements: ['Strong value proposition', 'Customer success program']
        });
        break;
      case 'marketplace':
        opportunities.push({
          type: 'competitive-gap',
          description: 'Underserved niche markets in platform economy',
          potential: 0.7,
          timeframe: '18-36 months',
          requirements: ['Market research', 'Platform development']
        });
        break;
    }

    return opportunities;
  }

  /**
   * Customer segment assessment methods
   */
  private calculateAccessibilityScore(segment: CustomerSegment): number {
    let score = 50; // Base score
    
    // Size factor
    if (segment.size === 'large') score += 20;
    else if (segment.size === 'medium') score += 10;
    
    // Pain points factor
    score += Math.min(segment.painPoints.length * 5, 20);
    
    // Priority factor
    if (segment.priority === 'high') score += 10;
    else if (segment.priority === 'medium') score += 5;
    
    return Math.min(score, 100);
  }

  private calculateProfitabilityScore(segment: CustomerSegment): number {
    let score = 40; // Base score
    
    // Estimate based on LTV and size
    if (segment.lifetimeValue.includes('100K+')) score += 40;
    else if (segment.lifetimeValue.includes('10K-100K')) score += 30;
    else if (segment.lifetimeValue.includes('1K-10K')) score += 20;
    else if (segment.lifetimeValue.includes('$100-1K')) score += 10;
    
    // Size multiplier
    if (segment.size === 'large') score += 20;
    else if (segment.size === 'medium') score += 10;
    
    return Math.min(score, 100);
  }

  private calculateScalabilityScore(segment: CustomerSegment): number {
    let score = 30; // Base score
    
    // Size is a key scalability factor
    if (segment.size === 'large') score += 30;
    else if (segment.size === 'medium') score += 20;
    else score += 10;
    
    // Demographics-based scalability
    const scalableDemo = segment.demographics.some(demo => 
      demo.toLowerCase().includes('online') || 
      demo.toLowerCase().includes('global') ||
      demo.toLowerCase().includes('b2b')
    );
    if (scalableDemo) score += 25;
    
    // Priority factor
    if (segment.priority === 'high') score += 15;
    else if (segment.priority === 'medium') score += 10;
    
    return Math.min(score, 100);
  }

  private assessSegmentCompetition(segment: CustomerSegment): 'low' | 'medium' | 'high' {
    // Simplified assessment based on segment characteristics
    const highCompetitionIndicators = segment.demographics.filter(demo =>
      demo.toLowerCase().includes('enterprise') ||
      demo.toLowerCase().includes('fortune') ||
      demo.toLowerCase().includes('mainstream')
    );
    
    if (highCompetitionIndicators.length >= 2) return 'high';
    if (highCompetitionIndicators.length === 1) return 'medium';
    return 'low';
  }

  private assessSegmentMarketSize(segment: CustomerSegment): MarketSizeAssessment {
    // Simplified market size assessment
    const sizeMultipliers = {
      'small': 1,
      'medium': 5,
      'large': 20
    };
    
    const baseMarket = 10000000; // $10M base market
    const multiplier = sizeMultipliers[segment.size];
    
    return {
      totalAddressableMarket: baseMarket * multiplier,
      serviceableAddressableMarket: baseMarket * multiplier * 0.1,
      serviceableObtainableMarket: baseMarket * multiplier * 0.01,
      marketGrowthRate: 0.15, // 15% default growth rate
      marketMaturity: 'growing'
    };
  }

  private assessAcquisitionComplexity(segment: CustomerSegment): AcquisitionComplexity {
    // Determine complexity based on segment characteristics
    const isB2B = segment.demographics.some(demo => 
      demo.toLowerCase().includes('b2b') ||
      demo.toLowerCase().includes('enterprise') ||
      demo.toLowerCase().includes('business')
    );
    
    if (isB2B) {
      return {
        salesCycleLength: '3-9 months',
        decisionMakerCount: 4,
        acquisitionCost: 5000,
        conversionRate: 0.05,
        scalingDifficulty: 'high'
      };
    } else {
      return {
        salesCycleLength: '1-4 weeks',
        decisionMakerCount: 1,
        acquisitionCost: 100,
        conversionRate: 0.15,
        scalingDifficulty: 'low'
      };
    }
  }

  /**
   * Business model risk identification
   */
  private identifyBusinessModelRisks(
    sessionData: BusinessModelPhaseData, 
    revenueAssessments: RevenueStreamFeasibility[],
    customerAssessments: CustomerSegmentFeasibility[]
  ): BusinessModelRisk[] {
    const risks: BusinessModelRisk[] = [];
    
    // Revenue concentration risk
    if (revenueAssessments.length === 1) {
      risks.push({
        category: 'financial',
        description: 'Single revenue stream creates concentration risk',
        severity: 'high',
        probability: 0.6,
        impact: 0.8,
        mitigation: ['Develop secondary revenue streams', 'Diversify monetization approaches', 'Build multiple value propositions']
      });
    }
    
    // Customer segment concentration risk
    if (customerAssessments.length === 1) {
      risks.push({
        category: 'market',
        description: 'Single customer segment creates market concentration risk',
        severity: 'medium',
        probability: 0.5,
        impact: 0.7,
        mitigation: ['Expand to adjacent customer segments', 'Develop multi-segment value propositions', 'Build scalable customer acquisition']
      });
    }
    
    // Low feasibility revenue streams
    const lowFeasibilityStreams = revenueAssessments.filter(assessment => assessment.feasibilityScore < 60);
    if (lowFeasibilityStreams.length > 0) {
      risks.push({
        category: 'operational',
        description: `${lowFeasibilityStreams.length} revenue streams have low feasibility scores`,
        severity: 'medium',
        probability: 0.7,
        impact: 0.6,
        mitigation: ['Focus on highest feasibility streams first', 'Improve feasibility through validation', 'Consider alternative approaches']
      });
    }
    
    // Competitive risks from high-competition segments
    const highCompetitionSegments = customerAssessments.filter(assessment => assessment.competitionLevel === 'high');
    if (highCompetitionSegments.length > 0) {
      risks.push({
        category: 'competitive',
        description: `${highCompetitionSegments.length} customer segments face high competition`,
        severity: 'medium',
        probability: 0.8,
        impact: 0.6,
        mitigation: ['Develop strong differentiation', 'Build competitive moats', 'Focus on underserved niches']
      });
    }
    
    return risks;
  }

  /**
   * Generate feasibility recommendations
   */
  private generateFeasibilityRecommendations(
    revenueAssessments: RevenueStreamFeasibility[],
    customerAssessments: CustomerSegmentFeasibility[],
    risks: BusinessModelRisk[]
  ): FeasibilityRecommendation[] {
    const recommendations: FeasibilityRecommendation[] = [];
    
    // High-priority recommendations based on assessments
    const highFeasibilityRevenue = revenueAssessments.find(assessment => assessment.feasibilityScore >= 80);
    if (highFeasibilityRevenue) {
      recommendations.push({
        priority: 'high',
        action: `Focus initial efforts on ${highFeasibilityRevenue.streamName} revenue stream`,
        rationale: `Highest feasibility score (${highFeasibilityRevenue.feasibilityScore}%) provides best success probability`,
        expectedImpact: 'Faster time to revenue and lower implementation risk',
        timeframe: '1-month',
        requiredResources: ['Development team', 'Market validation budget', 'Initial marketing investment']
      });
    }
    
    // Customer segment recommendations
    const highValueSegment = customerAssessments.reduce((prev, current) => 
      (current.profitabilityScore > prev.profitabilityScore) ? current : prev
    );
    
    if (highValueSegment) {
      recommendations.push({
        priority: 'high',
        action: `Prioritize ${highValueSegment.segmentName} as primary customer segment`,
        rationale: `Highest profitability score (${highValueSegment.profitabilityScore}%) offers best revenue potential`,
        expectedImpact: 'Higher customer lifetime value and more sustainable revenue',
        timeframe: '3-months',
        requiredResources: ['Customer research', 'Targeted marketing', 'Sales team training']
      });
    }
    
    // Risk mitigation recommendations
    const criticalRisks = risks.filter(risk => risk.severity === 'critical' || risk.severity === 'high');
    criticalRisks.forEach(risk => {
      recommendations.push({
        priority: 'high',
        action: `Mitigate ${risk.category} risk: ${risk.description}`,
        rationale: `High-severity risk with ${(risk.probability * 100).toFixed(0)}% probability`,
        expectedImpact: 'Reduced business model risk and improved success probability',
        timeframe: '3-months',
        requiredResources: risk.mitigation
      });
    });
    
    return recommendations;
  }

  /**
   * Create implementation plan
   */
  private createImplementationPlan(
    revenueAssessments: RevenueStreamFeasibility[],
    recommendations: FeasibilityRecommendation[]
  ): ImplementationStep[] {
    const steps: ImplementationStep[] = [];
    
    // Sort recommendations by priority and timeframe
    const sortedRecommendations = recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    sortedRecommendations.forEach((rec, index) => {
      steps.push({
        id: `step-${index + 1}`,
        step: rec.action,
        order: index + 1,
        dependencies: index > 0 ? [`step-${index}`] : [],
        duration: rec.timeframe,
        effort: this.determineEffort(rec),
        riskLevel: this.determineRiskLevel(rec),
        successMetrics: this.generateSuccessMetrics(rec)
      });
    });
    
    return steps;
  }

  /**
   * Calculate overall feasibility score
   */
  private calculateOverallFeasibilityScore(
    revenueAssessments: RevenueStreamFeasibility[],
    customerAssessments: CustomerSegmentFeasibility[],
    risks: BusinessModelRisk[]
  ): number {
    // Weight different components
    const revenueScore = revenueAssessments.length > 0 
      ? revenueAssessments.reduce((sum, assessment) => sum + assessment.feasibilityScore, 0) / revenueAssessments.length 
      : 0;
    
    const customerScore = customerAssessments.length > 0
      ? customerAssessments.reduce((sum, assessment) => sum + (assessment.accessibilityScore + assessment.profitabilityScore + assessment.scalabilityScore) / 3, 0) / customerAssessments.length
      : 0;
    
    const riskPenalty = risks.reduce((penalty, risk) => {
      const riskScore = risk.probability * risk.impact * (risk.severity === 'critical' ? 40 : risk.severity === 'high' ? 20 : 10);
      return penalty + riskScore;
    }, 0);
    
    // Combine scores (40% revenue, 40% customer, 20% risk penalty)
    const baseScore = (revenueScore * 0.4) + (customerScore * 0.4) + (20); // 20 points base
    const finalScore = Math.max(0, baseScore - riskPenalty);
    
    return Math.round(Math.min(finalScore, 100));
  }

  /**
   * Categorize overall feasibility
   */
  private categorizeFeasibility(score: number): 'high' | 'medium' | 'low' {
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  /**
   * Helper methods
   */
  private getKeyRoles(streamType: RevenueStream['type']): string[] {
    const roleMap = {
      'subscription': ['Product Manager', 'Customer Success Manager', 'Marketing Manager', 'Developer'],
      'marketplace': ['Platform Manager', 'Business Development', 'Operations Manager', 'Data Analyst'],
      'advertising': ['Ad Operations Manager', 'Data Scientist', 'Sales Manager', 'Content Creator'],
      'freemium': ['Product Manager', 'Growth Hacker', 'Customer Success', 'Analytics Specialist'],
      'one-time': ['Sales Manager', 'Product Manager', 'Customer Support', 'Operations'],
      'commission': ['Partnership Manager', 'Sales Manager', 'Financial Analyst', 'Operations'],
      'licensing': ['IP Manager', 'Business Development', 'Legal Counsel', 'Technical Specialist']
    };
    
    return roleMap[streamType] || roleMap['one-time'];
  }

  private getSpecializedSkills(streamType: RevenueStream['type']): string[] {
    const skillMap = {
      'subscription': ['Churn analysis', 'SaaS metrics', 'Customer success'],
      'marketplace': ['Network effects', 'Platform economics', 'Multi-sided markets'],
      'advertising': ['Programmatic advertising', 'Ad tech', 'Data analytics'],
      'freemium': ['Growth hacking', 'Conversion optimization', 'User psychology'],
      'one-time': ['Sales management', 'Deal negotiation', 'Project management'],
      'commission': ['Partnership management', 'Performance tracking', 'Contract negotiation'],
      'licensing': ['IP management', 'Technology transfer', 'Legal compliance']
    };
    
    return skillMap[streamType] || [];
  }

  private hasExistingSolutions(streamType: RevenueStream['type']): boolean {
    // Most revenue stream types have existing solutions/platforms
    return ['subscription', 'marketplace', 'advertising', 'commission'].includes(streamType);
  }

  private getDevelopmentTime(streamType: RevenueStream['type']): string {
    const timeMap = {
      'one-time': '2-8 weeks',
      'subscription': '8-16 weeks', 
      'freemium': '12-24 weeks',
      'commission': '6-16 weeks',
      'advertising': '16-32 weeks',
      'marketplace': '24-52 weeks',
      'licensing': '8-24 weeks'
    };
    
    return timeMap[streamType] || '8-16 weeks';
  }

  private getScalingChallenges(streamType: RevenueStream['type']): string[] {
    const challengeMap = {
      'subscription': ['Customer churn management', 'Feature complexity', 'Support scaling'],
      'marketplace': ['Supply-demand balance', 'Network effects', 'Platform governance'],
      'advertising': ['Ad inventory management', 'Fraud prevention', 'Privacy compliance'],
      'freemium': ['Conversion optimization', 'Feature gating', 'Cost management'],
      'one-time': ['Sales process efficiency', 'Deal size scaling', 'Market expansion'],
      'commission': ['Partner relationship management', 'Performance tracking', 'Incentive alignment'],
      'licensing': ['IP protection', 'Partner enablement', 'Technology transfer']
    };
    
    return challengeMap[streamType] || ['General scaling challenges'];
  }

  private getQualityControlNeeds(streamType: RevenueStream['type']): string[] {
    const qcMap = {
      'subscription': ['Service reliability', 'Feature quality', 'Customer satisfaction'],
      'marketplace': ['Transaction quality', 'User experience', 'Fraud prevention'],
      'advertising': ['Ad quality', 'Brand safety', 'Viewability metrics'],
      'freemium': ['Free tier experience', 'Conversion funnels', 'Premium features'],
      'one-time': ['Product quality', 'Delivery excellence', 'Customer satisfaction'],
      'commission': ['Transaction accuracy', 'Reporting quality', 'Partner satisfaction'],
      'licensing': ['IP compliance', 'Documentation quality', 'Partner enablement']
    };
    
    return qcMap[streamType] || ['Basic quality controls'];
  }

  private getComplianceRequirements(streamType: RevenueStream['type']): string[] {
    const complianceMap = {
      'subscription': ['Payment compliance', 'Data privacy', 'Service terms'],
      'marketplace': ['Payment processing', 'Tax compliance', 'User protection'],
      'advertising': ['Privacy regulations', 'Ad standards', 'Data protection'],
      'freemium': ['Free service terms', 'Premium billing', 'Data privacy'],
      'one-time': ['Sales agreements', 'Tax compliance', 'Product liability'],
      'commission': ['Financial regulations', 'Tax reporting', 'Partner agreements'],
      'licensing': ['IP compliance', 'Technology transfer', 'International trade']
    };
    
    return complianceMap[streamType] || ['General business compliance'];
  }

  private determineEffort(recommendation: FeasibilityRecommendation): 'low' | 'medium' | 'high' {
    if (recommendation.requiredResources.length >= 4) return 'high';
    if (recommendation.requiredResources.length >= 2) return 'medium';
    return 'low';
  }

  private determineRiskLevel(recommendation: FeasibilityRecommendation): 'low' | 'medium' | 'high' {
    if (recommendation.priority === 'high' && recommendation.timeframe === '1-month') return 'medium';
    if (recommendation.priority === 'high') return 'high';
    if (recommendation.priority === 'medium') return 'medium';
    return 'low';
  }

  private generateSuccessMetrics(recommendation: FeasibilityRecommendation): string[] {
    // Generate relevant success metrics based on the recommendation
    const metrics = [
      'Implementation completion rate',
      'Timeline adherence',
      'Budget adherence'
    ];
    
    // Add specific metrics based on action type
    if (recommendation.action.includes('revenue')) {
      metrics.push('Revenue generation', 'Customer acquisition');
    }
    if (recommendation.action.includes('customer')) {
      metrics.push('Customer satisfaction', 'Market validation');
    }
    if (recommendation.action.includes('risk')) {
      metrics.push('Risk mitigation effectiveness', 'Incident reduction');
    }
    
    return metrics;
  }
}

/**
 * Factory function to create feasibility assessment engine
 */
export function createFeasibilityAssessmentEngine(): FeasibilityAssessmentEngine {
  return new FeasibilityAssessmentEngine();
}