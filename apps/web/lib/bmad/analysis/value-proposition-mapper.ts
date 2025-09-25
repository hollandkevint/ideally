import { 
  BusinessModelPhaseData,
  CustomerSegment, 
  ValueProposition 
} from '../templates/business-model-templates';
import { IdentifiedSegment, CustomerNeed, PainPoint } from './customer-segmentation-analyzer';

/**
 * Value Proposition Canvas and Customer-Need Mapping Engine
 * Maps value propositions to customer needs using sophisticated frameworks
 */

export interface ValuePropositionMapping {
  mappingId: string;
  customerSegment: IdentifiedSegment | CustomerSegment;
  valueProposition: EnhancedValueProposition;
  fitScore: number;
  mappingAnalysis: MappingAnalysis;
  recommendations: MappingRecommendation[];
}

export interface EnhancedValueProposition {
  id: string;
  name: string;
  customerSegmentId: string;
  valuePropositionCanvas: ValuePropositionCanvas;
  competitiveDifferentiation: CompetitiveDifferentiation;
  validationStatus: ValidationStatus;
  implementationComplexity: 'low' | 'medium' | 'high';
  confidenceScore: number;
}

export interface ValuePropositionCanvas {
  gainCreators: GainCreator[];
  painRelievers: PainReliever[];
  productsServices: ProductService[];
  customerJobs: CustomerJob[];
  pains: Pain[];
  gains: Gain[];
}

export interface GainCreator {
  id: string;
  description: string;
  customerGainId: string;
  impact: 'low' | 'medium' | 'high';
  uniqueness: 'commodity' | 'differentiated' | 'unique';
  evidence: string[];
}

export interface PainReliever {
  id: string;
  description: string;
  customerPainId: string;
  effectiveness: 'partial' | 'significant' | 'complete';
  differentiator: boolean;
  evidence: string[];
}

export interface ProductService {
  id: string;
  name: string;
  description: string;
  type: 'core' | 'supporting' | 'augmenting';
  customerJobs: string[];
}

export interface CustomerJob {
  id: string;
  description: string;
  type: 'functional' | 'emotional' | 'social';
  importance: 'low' | 'medium' | 'high';
  satisfaction: number; // 1-10 scale with current solutions
  frequency: string;
}

export interface Pain {
  id: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  frequency: 'rare' | 'occasional' | 'frequent';
  cost: string;
  emotionalImpact: string;
}

export interface Gain {
  id: string;
  description: string;
  type: 'required' | 'expected' | 'desired' | 'unexpected';
  importance: 'nice-to-have' | 'important' | 'critical';
  currentSatisfaction: number;
}

export interface CompetitiveDifferentiation {
  uniqueFactors: UniqueFactor[];
  competitiveAdvantages: CompetitiveAdvantage[];
  positioningStatement: string;
  defensibility: 'weak' | 'moderate' | 'strong';
}

export interface UniqueFactor {
  factor: string;
  description: string;
  competitorComparison: string;
  sustainability: 'temporary' | 'medium-term' | 'sustainable';
}

export interface CompetitiveAdvantage {
  type: 'cost' | 'differentiation' | 'focus' | 'innovation';
  description: string;
  strength: 'weak' | 'moderate' | 'strong';
  timeframe: string;
}

export interface ValidationStatus {
  level: 'hypothesis' | 'assumption' | 'validated' | 'proven';
  evidence: ValidationEvidence[];
  confidenceScore: number;
  nextValidationSteps: string[];
}

export interface ValidationEvidence {
  type: 'customer-interview' | 'survey' | 'prototype-test' | 'market-data' | 'case-study';
  description: string;
  strength: 'weak' | 'moderate' | 'strong';
  date?: string;
}

export interface MappingAnalysis {
  jobFitAnalysis: JobFitAnalysis;
  painFitAnalysis: PainFitAnalysis;
  gainFitAnalysis: GainFitAnalysis;
  overallFit: 'poor' | 'moderate' | 'good' | 'excellent';
  criticalGaps: string[];
  strengthAreas: string[];
}

export interface JobFitAnalysis {
  functionalJobFit: number;
  emotionalJobFit: number;
  socialJobFit: number;
  overallJobFit: number;
  jobImportanceAlignment: number;
}

export interface PainFitAnalysis {
  painReliefCoverage: number;
  painSeverityAlignment: number;
  painFrequencyMatch: number;
  overallPainFit: number;
  unresolvedPains: string[];
}

export interface GainFitAnalysis {
  gainDeliveryCoverage: number;
  gainImportanceAlignment: number;
  gainUniqueness: number;
  overallGainFit: number;
  unaddressedGains: string[];
}

export interface MappingRecommendation {
  type: 'enhance' | 'add' | 'modify' | 'remove';
  priority: 'high' | 'medium' | 'low';
  description: string;
  rationale: string;
  expectedImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
}

/**
 * Value Proposition Canvas and Mapping Engine
 */
export class ValuePropositionMapper {

  /**
   * Create comprehensive value proposition mapping for customer segments
   */
  async mapValuePropositionsToSegments(
    segments: IdentifiedSegment[], 
    currentValueProps?: ValueProposition[]
  ): Promise<ValuePropositionMapping[]> {
    const mappings: ValuePropositionMapping[] = [];

    for (const segment of segments) {
      // Generate value proposition for segment if none exists
      let valueProposition: EnhancedValueProposition;
      
      const existingVP = currentValueProps?.find(vp => vp.segment === segment.name);
      if (existingVP) {
        valueProposition = await this.enhanceValueProposition(existingVP, segment);
      } else {
        valueProposition = await this.generateValueProposition(segment);
      }

      // Create detailed mapping
      const mapping = await this.createValuePropositionMapping(segment, valueProposition);
      mappings.push(mapping);
    }

    return mappings;
  }

  /**
   * Generate Value Proposition Canvas for a customer segment
   */
  async generateValuePropositionCanvas(segment: IdentifiedSegment): Promise<ValuePropositionCanvas> {
    // Extract customer jobs from needs
    const customerJobs = this.extractCustomerJobs(segment.needs);
    
    // Extract pains from pain points
    const pains = this.extractPains(segment.painPoints);
    
    // Generate gains from unmet needs and aspirations
    const gains = this.generateGains(segment);
    
    // Generate value proposition elements
    const gainCreators = await this.generateGainCreators(gains, segment);
    const painRelievers = await this.generatePainRelievers(pains, segment);
    const productsServices = await this.generateProductServices(customerJobs, segment);

    return {
      gainCreators,
      painRelievers,
      productsServices,
      customerJobs,
      pains,
      gains
    };
  }

  /**
   * Analyze value proposition fit with customer segment
   */
  analyzeValuePropositionFit(
    canvas: ValuePropositionCanvas, 
    segment: IdentifiedSegment
  ): MappingAnalysis {
    const jobFitAnalysis = this.analyzeJobFit(canvas, segment);
    const painFitAnalysis = this.analyzePainFit(canvas, segment);
    const gainFitAnalysis = this.analyzeGainFit(canvas, segment);

    const overallFit = this.calculateOverallFit(jobFitAnalysis, painFitAnalysis, gainFitAnalysis);
    const criticalGaps = this.identifyCriticalGaps(canvas, segment);
    const strengthAreas = this.identifyStrengthAreas(canvas, segment);

    return {
      jobFitAnalysis,
      painFitAnalysis,
      gainFitAnalysis,
      overallFit,
      criticalGaps,
      strengthAreas
    };
  }

  /**
   * Generate recommendations for improving value proposition fit
   */
  generateMappingRecommendations(
    analysis: MappingAnalysis, 
    canvas: ValuePropositionCanvas,
    segment: IdentifiedSegment
  ): MappingRecommendation[] {
    const recommendations: MappingRecommendation[] = [];

    // Address critical gaps
    analysis.criticalGaps.forEach(gap => {
      recommendations.push({
        type: 'add',
        priority: 'high',
        description: `Address critical gap: ${gap}`,
        rationale: 'Unaddressed critical customer need represents major opportunity',
        expectedImpact: 'Significantly improve value proposition fit and customer satisfaction',
        implementationEffort: this.estimateEffort(gap)
      });
    });

    // Enhance areas of strength
    analysis.strengthAreas.forEach(strength => {
      recommendations.push({
        type: 'enhance',
        priority: 'medium',
        description: `Strengthen existing advantage: ${strength}`,
        rationale: 'Build on existing strengths to create competitive moat',
        expectedImpact: 'Increase competitive differentiation and customer loyalty',
        implementationEffort: 'low'
      });
    });

    // Job fit improvements
    if (analysis.jobFitAnalysis.overallJobFit < 70) {
      recommendations.push({
        type: 'modify',
        priority: 'high',
        description: 'Improve functional job alignment',
        rationale: `Job fit score of ${analysis.jobFitAnalysis.overallJobFit}% indicates poor customer job alignment`,
        expectedImpact: 'Better address core customer needs and increase adoption',
        implementationEffort: 'medium'
      });
    }

    // Pain fit improvements
    if (analysis.painFitAnalysis.unresolvedPains.length > 0) {
      recommendations.push({
        type: 'add',
        priority: 'high',
        description: `Address ${analysis.painFitAnalysis.unresolvedPains.length} unresolved pain points`,
        rationale: 'Unresolved pains represent barriers to customer satisfaction',
        expectedImpact: 'Reduce customer friction and improve value perception',
        implementationEffort: 'high'
      });
    }

    // Gain fit improvements
    if (analysis.gainFitAnalysis.unaddressedGains.length > 0) {
      recommendations.push({
        type: 'add',
        priority: 'medium',
        description: `Create gain creators for ${analysis.gainFitAnalysis.unaddressedGains.length} unaddressed gains`,
        rationale: 'Unaddressed gains represent opportunity for differentiation',
        expectedImpact: 'Increase customer delight and willingness to pay premium',
        implementationEffort: 'medium'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Private helper methods
   */
  private async enhanceValueProposition(
    existing: ValueProposition, 
    segment: IdentifiedSegment
  ): Promise<EnhancedValueProposition> {
    const canvas = await this.generateValuePropositionCanvas(segment);
    const competitiveDiff = this.analyzeCompetitiveDifferentiation(existing, segment);
    const validation = this.assessValidationStatus(existing);

    return {
      id: existing.id,
      name: `${existing.uniqueDifferentiator} for ${segment.name}`,
      customerSegmentId: segment.id,
      valuePropositionCanvas: canvas,
      competitiveDifferentiation: competitiveDiff,
      validationStatus: validation,
      implementationComplexity: 'medium',
      confidenceScore: 75
    };
  }

  private async generateValueProposition(segment: IdentifiedSegment): Promise<EnhancedValueProposition> {
    const canvas = await this.generateValuePropositionCanvas(segment);
    const competitiveDiff = this.generateCompetitiveDifferentiation(segment);
    const validation = this.initializeValidationStatus();

    return {
      id: `vp-${segment.id}`,
      name: `Value Proposition for ${segment.name}`,
      customerSegmentId: segment.id,
      valuePropositionCanvas: canvas,
      competitiveDifferentiation: competitiveDiff,
      validationStatus: validation,
      implementationComplexity: 'medium',
      confidenceScore: 60
    };
  }

  private async createValuePropositionMapping(
    segment: IdentifiedSegment, 
    valueProposition: EnhancedValueProposition
  ): Promise<ValuePropositionMapping> {
    const analysis = this.analyzeValuePropositionFit(valueProposition.valuePropositionCanvas, segment);
    const fitScore = this.calculateFitScore(analysis);
    const recommendations = this.generateMappingRecommendations(analysis, valueProposition.valuePropositionCanvas, segment);

    return {
      mappingId: `mapping-${segment.id}-${valueProposition.id}`,
      customerSegment: segment,
      valueProposition,
      fitScore,
      mappingAnalysis: analysis,
      recommendations
    };
  }

  private extractCustomerJobs(needs: CustomerNeed[]): CustomerJob[] {
    return needs.map((need, index) => ({
      id: `job-${index + 1}`,
      description: need.description,
      type: need.category,
      importance: need.priority,
      satisfaction: need.satisfactionLevel,
      frequency: this.estimateJobFrequency(need)
    }));
  }

  private extractPains(painPoints: PainPoint[]): Pain[] {
    return painPoints.map((pain, index) => ({
      id: `pain-${index + 1}`,
      description: pain.description,
      severity: this.mapIntensityToSeverity(pain.intensity),
      frequency: pain.frequency,
      cost: pain.currentCost,
      emotionalImpact: this.estimateEmotionalImpact(pain)
    }));
  }

  private generateGains(segment: IdentifiedSegment): Gain[] {
    const gains: Gain[] = [];

    // Generate gains from psychographic motivations
    segment.psychographics.motivations.forEach((motivation, index) => {
      gains.push({
        id: `gain-${index + 1}`,
        description: `Achieve ${motivation}`,
        type: 'desired',
        importance: 'important',
        currentSatisfaction: 5 // Default mid-range satisfaction
      });
    });

    // Generate gains from unmet needs
    segment.needs
      .filter(need => need.satisfactionLevel < 7)
      .forEach((need, index) => {
        gains.push({
          id: `gain-unmet-${index + 1}`,
          description: `Better ${need.description}`,
          type: 'required',
          importance: need.priority === 'high' ? 'critical' : 'important',
          currentSatisfaction: need.satisfactionLevel
        });
      });

    return gains;
  }

  private async generateGainCreators(gains: Gain[], segment: IdentifiedSegment): Promise<GainCreator[]> {
    return gains.map((gain, index) => ({
      id: `gc-${index + 1}`,
      description: this.generateGainCreatorDescription(gain, segment),
      customerGainId: gain.id,
      impact: gain.importance === 'critical' ? 'high' : 'medium',
      uniqueness: 'differentiated',
      evidence: []
    }));
  }

  private async generatePainRelievers(pains: Pain[], segment: IdentifiedSegment): Promise<PainReliever[]> {
    return pains.map((pain, index) => ({
      id: `pr-${index + 1}`,
      description: this.generatePainRelieverDescription(pain, segment),
      customerPainId: pain.id,
      effectiveness: pain.severity === 'severe' ? 'complete' : 'significant',
      differentiator: pain.severity === 'severe',
      evidence: []
    }));
  }

  private async generateProductServices(jobs: CustomerJob[], segment: IdentifiedSegment): Promise<ProductService[]> {
    const coreJobs = jobs.filter(job => job.importance === 'high');
    
    return coreJobs.map((job, index) => ({
      id: `ps-${index + 1}`,
      name: this.generateProductServiceName(job, segment),
      description: this.generateProductServiceDescription(job, segment),
      type: 'core',
      customerJobs: [job.id]
    }));
  }

  private analyzeJobFit(canvas: ValuePropositionCanvas, segment: IdentifiedSegment): JobFitAnalysis {
    const functionalJobs = canvas.customerJobs.filter(job => job.type === 'functional');
    const emotionalJobs = canvas.customerJobs.filter(job => job.type === 'emotional');
    const socialJobs = canvas.customerJobs.filter(job => job.type === 'social');

    const functionalJobFit = this.calculateJobTypeFit(functionalJobs, canvas.productsServices);
    const emotionalJobFit = this.calculateJobTypeFit(emotionalJobs, canvas.productsServices);
    const socialJobFit = this.calculateJobTypeFit(socialJobs, canvas.productsServices);

    const overallJobFit = (functionalJobFit * 0.5) + (emotionalJobFit * 0.3) + (socialJobFit * 0.2);
    const jobImportanceAlignment = this.calculateJobImportanceAlignment(canvas.customerJobs, canvas.productsServices);

    return {
      functionalJobFit,
      emotionalJobFit,
      socialJobFit,
      overallJobFit,
      jobImportanceAlignment
    };
  }

  private analyzePainFit(canvas: ValuePropositionCanvas, segment: IdentifiedSegment): PainFitAnalysis {
    const totalPains = canvas.pains.length;
    const addressedPains = canvas.painRelievers.length;
    
    const painReliefCoverage = totalPains > 0 ? (addressedPains / totalPains) * 100 : 0;
    const painSeverityAlignment = this.calculatePainSeverityAlignment(canvas.pains, canvas.painRelievers);
    const painFrequencyMatch = this.calculatePainFrequencyMatch(canvas.pains, canvas.painRelievers);
    
    const overallPainFit = (painReliefCoverage * 0.4) + (painSeverityAlignment * 0.4) + (painFrequencyMatch * 0.2);
    
    const unresolvedPains = canvas.pains
      .filter(pain => !canvas.painRelievers.some(reliever => reliever.customerPainId === pain.id))
      .map(pain => pain.description);

    return {
      painReliefCoverage,
      painSeverityAlignment,
      painFrequencyMatch,
      overallPainFit,
      unresolvedPains
    };
  }

  private analyzeGainFit(canvas: ValuePropositionCanvas, segment: IdentifiedSegment): GainFitAnalysis {
    const totalGains = canvas.gains.length;
    const addressedGains = canvas.gainCreators.length;
    
    const gainDeliveryCoverage = totalGains > 0 ? (addressedGains / totalGains) * 100 : 0;
    const gainImportanceAlignment = this.calculateGainImportanceAlignment(canvas.gains, canvas.gainCreators);
    const gainUniqueness = this.calculateGainUniqueness(canvas.gainCreators);
    
    const overallGainFit = (gainDeliveryCoverage * 0.4) + (gainImportanceAlignment * 0.4) + (gainUniqueness * 0.2);
    
    const unaddressedGains = canvas.gains
      .filter(gain => !canvas.gainCreators.some(creator => creator.customerGainId === gain.id))
      .map(gain => gain.description);

    return {
      gainDeliveryCoverage,
      gainImportanceAlignment,
      gainUniqueness,
      overallGainFit,
      unaddressedGains
    };
  }

  private calculateOverallFit(
    jobFit: JobFitAnalysis, 
    painFit: PainFitAnalysis, 
    gainFit: GainFitAnalysis
  ): 'poor' | 'moderate' | 'good' | 'excellent' {
    const overallScore = (jobFit.overallJobFit * 0.4) + (painFit.overallPainFit * 0.4) + (gainFit.overallGainFit * 0.2);
    
    if (overallScore >= 85) return 'excellent';
    if (overallScore >= 70) return 'good';
    if (overallScore >= 50) return 'moderate';
    return 'poor';
  }

  private calculateFitScore(analysis: MappingAnalysis): number {
    return Math.round(
      (analysis.jobFitAnalysis.overallJobFit * 0.4) + 
      (analysis.painFitAnalysis.overallPainFit * 0.4) + 
      (analysis.gainFitAnalysis.overallGainFit * 0.2)
    );
  }

  private identifyCriticalGaps(canvas: ValuePropositionCanvas, segment: IdentifiedSegment): string[] {
    const gaps: string[] = [];
    
    // High-importance unaddressed jobs
    const unaddressedHighImportanceJobs = canvas.customerJobs
      .filter(job => job.importance === 'high' && 
        !canvas.productsServices.some(ps => ps.customerJobs.includes(job.id)))
      .map(job => `Unaddressed high-importance job: ${job.description}`);
    
    gaps.push(...unaddressedHighImportanceJobs);
    
    // Severe unaddressed pains
    const severeUnaddressedPains = canvas.pains
      .filter(pain => pain.severity === 'severe' && 
        !canvas.painRelievers.some(pr => pr.customerPainId === pain.id))
      .map(pain => `Severe unaddressed pain: ${pain.description}`);
    
    gaps.push(...severeUnaddressedPains);
    
    return gaps;
  }

  private identifyStrengthAreas(canvas: ValuePropositionCanvas, segment: IdentifiedSegment): string[] {
    const strengths: string[] = [];
    
    // Unique gain creators
    const uniqueGainCreators = canvas.gainCreators
      .filter(gc => gc.uniqueness === 'unique')
      .map(gc => `Unique gain creator: ${gc.description}`);
    
    strengths.push(...uniqueGainCreators);
    
    // Complete pain relievers
    const completePainRelievers = canvas.painRelievers
      .filter(pr => pr.effectiveness === 'complete')
      .map(pr => `Complete pain reliever: ${pr.description}`);
    
    strengths.push(...completePainRelievers);
    
    return strengths;
  }

  // Utility methods
  private estimateJobFrequency(need: CustomerNeed): string {
    if (need.priority === 'high') return 'daily';
    if (need.priority === 'medium') return 'weekly';
    return 'monthly';
  }

  private mapIntensityToSeverity(intensity: number): 'mild' | 'moderate' | 'severe' {
    if (intensity >= 8) return 'severe';
    if (intensity >= 5) return 'moderate';
    return 'mild';
  }

  private estimateEmotionalImpact(pain: PainPoint): string {
    if (pain.intensity >= 8) return 'High stress and frustration';
    if (pain.intensity >= 5) return 'Moderate concern and worry';
    return 'Minor annoyance';
  }

  private generateGainCreatorDescription(gain: Gain, segment: IdentifiedSegment): string {
    return `Solution that enables ${gain.description.toLowerCase()} for ${segment.name}`;
  }

  private generatePainRelieverDescription(pain: Pain, segment: IdentifiedSegment): string {
    return `Eliminate ${pain.description.toLowerCase()} through automated solution`;
  }

  private generateProductServiceName(job: CustomerJob, segment: IdentifiedSegment): string {
    return `${job.type.charAt(0).toUpperCase() + job.type.slice(1)} Solution for ${segment.name}`;
  }

  private generateProductServiceDescription(job: CustomerJob, segment: IdentifiedSegment): string {
    return `Service designed to help ${segment.name} achieve ${job.description.toLowerCase()}`;
  }

  private calculateJobTypeFit(jobs: CustomerJob[], products: ProductService[]): number {
    if (jobs.length === 0) return 100; // No jobs to address
    
    const addressedJobs = jobs.filter(job => 
      products.some(product => product.customerJobs.includes(job.id))
    );
    
    return (addressedJobs.length / jobs.length) * 100;
  }

  private calculateJobImportanceAlignment(jobs: CustomerJob[], products: ProductService[]): number {
    const highImportanceJobs = jobs.filter(job => job.importance === 'high');
    if (highImportanceJobs.length === 0) return 100;
    
    const addressedHighImportanceJobs = highImportanceJobs.filter(job =>
      products.some(product => product.customerJobs.includes(job.id))
    );
    
    return (addressedHighImportanceJobs.length / highImportanceJobs.length) * 100;
  }

  private calculatePainSeverityAlignment(pains: Pain[], relievers: PainReliever[]): number {
    const severePains = pains.filter(pain => pain.severity === 'severe');
    if (severePains.length === 0) return 100;
    
    const addressedSeverePains = severePains.filter(pain =>
      relievers.some(reliever => reliever.customerPainId === pain.id)
    );
    
    return (addressedSeverePains.length / severePains.length) * 100;
  }

  private calculatePainFrequencyMatch(pains: Pain[], relievers: PainReliever[]): number {
    const frequentPains = pains.filter(pain => pain.frequency === 'frequent');
    if (frequentPains.length === 0) return 100;
    
    const addressedFrequentPains = frequentPains.filter(pain =>
      relievers.some(reliever => reliever.customerPainId === pain.id)
    );
    
    return (addressedFrequentPains.length / frequentPains.length) * 100;
  }

  private calculateGainImportanceAlignment(gains: Gain[], creators: GainCreator[]): number {
    const criticalGains = gains.filter(gain => gain.importance === 'critical');
    if (criticalGains.length === 0) return 100;
    
    const addressedCriticalGains = criticalGains.filter(gain =>
      creators.some(creator => creator.customerGainId === gain.id)
    );
    
    return (addressedCriticalGains.length / criticalGains.length) * 100;
  }

  private calculateGainUniqueness(creators: GainCreator[]): number {
    if (creators.length === 0) return 0;
    
    const uniquenessScore = creators.reduce((sum, creator) => {
      if (creator.uniqueness === 'unique') return sum + 100;
      if (creator.uniqueness === 'differentiated') return sum + 70;
      return sum + 30; // commodity
    }, 0);
    
    return uniquenessScore / creators.length;
  }

  private analyzeCompetitiveDifferentiation(vp: ValueProposition, segment: IdentifiedSegment): CompetitiveDifferentiation {
    return {
      uniqueFactors: [{
        factor: vp.uniqueDifferentiator,
        description: vp.competitiveAdvantage,
        competitorComparison: 'Analysis pending',
        sustainability: 'medium-term'
      }],
      competitiveAdvantages: [{
        type: 'differentiation',
        description: vp.competitiveAdvantage,
        strength: 'moderate',
        timeframe: '12-24 months'
      }],
      positioningStatement: vp.uniqueDifferentiator,
      defensibility: 'moderate'
    };
  }

  private generateCompetitiveDifferentiation(segment: IdentifiedSegment): CompetitiveDifferentiation {
    const topNeed = segment.needs.find(need => need.priority === 'high');
    const uniqueFactor = topNeed ? `Specialized solution for ${topNeed.description}` : 'Tailored approach';
    
    return {
      uniqueFactors: [{
        factor: uniqueFactor,
        description: `Specifically designed for ${segment.name}`,
        competitorComparison: 'Most solutions are generic',
        sustainability: 'medium-term'
      }],
      competitiveAdvantages: [{
        type: 'focus',
        description: `Focused on ${segment.name} specific needs`,
        strength: 'moderate',
        timeframe: '6-18 months'
      }],
      positioningStatement: `The only solution built specifically for ${segment.name}`,
      defensibility: 'moderate'
    };
  }

  private assessValidationStatus(vp: ValueProposition): ValidationStatus {
    return {
      level: 'assumption',
      evidence: [],
      confidenceScore: 60,
      nextValidationSteps: [
        'Conduct customer interviews',
        'Create prototype for testing',
        'Analyze competitor responses'
      ]
    };
  }

  private initializeValidationStatus(): ValidationStatus {
    return {
      level: 'hypothesis',
      evidence: [],
      confidenceScore: 40,
      nextValidationSteps: [
        'Define validation hypotheses',
        'Design validation experiments',
        'Conduct initial customer research'
      ]
    };
  }

  private estimateEffort(gap: string): 'low' | 'medium' | 'high' {
    if (gap.includes('severe') || gap.includes('critical')) return 'high';
    if (gap.includes('high-importance')) return 'medium';
    return 'low';
  }
}

/**
 * Factory function to create value proposition mapper
 */
export function createValuePropositionMapper(): ValuePropositionMapper {
  return new ValuePropositionMapper();
}