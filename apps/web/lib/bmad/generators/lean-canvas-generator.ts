import { 
  BusinessModelPhaseData,
  RevenueStream,
  CustomerSegment,
  ValueProposition,
  LeanCanvasData,
  LEAN_CANVAS_TEMPLATE
} from '../templates/business-model-templates';

/**
 * Lean Canvas Generator
 * Creates structured Business Model Canvas and Lean Canvas documents from business model analysis
 */

export interface CanvasGenerationOptions {
  format: 'markdown' | 'html' | 'json' | 'svg';
  includeAnalysis: boolean;
  includeImplementationNotes: boolean;
  includeFeasibilityScores: boolean;
  template: 'lean-canvas' | 'business-model-canvas' | 'value-proposition-canvas';
}

export interface GeneratedCanvas {
  title: string;
  content: string;
  format: string;
  canvasData: LeanCanvasData;
  sections: CanvasSection[];
  metadata: CanvasMetadata;
}

export interface CanvasSection {
  id: string;
  title: string;
  content: string[];
  analysis?: string;
  feasibilityScore?: number;
  implementationNotes?: string[];
}

export interface CanvasMetadata {
  generatedAt: Date;
  sessionId?: string;
  pathway: string;
  version: string;
  template: string;
  completeness: number; // percentage of filled sections
}

export interface BusinessModelCanvasData {
  keyPartners: string[];
  keyActivities: string[];
  keyResources: string[];
  valuePropositions: string[];
  customerRelationships: string[];
  channels: string[];
  customerSegments: string[];
  costStructure: string[];
  revenueStreams: string[];
}

/**
 * Lean Canvas and Business Model Canvas Generator
 */
export class LeanCanvasGenerator {
  
  /**
   * Generate Lean Canvas from business model session data
   */
  generateLeanCanvas(
    sessionData: BusinessModelPhaseData,
    options: CanvasGenerationOptions = {
      format: 'markdown',
      includeAnalysis: true,
      includeImplementationNotes: true,
      includeFeasibilityScores: true,
      template: 'lean-canvas'
    }
  ): GeneratedCanvas {
    const canvasData = this.buildLeanCanvasData(sessionData);
    const sections = this.generateLeanCanvasSections(canvasData, sessionData, options);
    
    const content = this.formatCanvas(sections, options);
    
    return {
      title: 'Lean Canvas - Business Model Analysis',
      content,
      format: options.format,
      canvasData,
      sections,
      metadata: {
        generatedAt: new Date(),
        pathway: 'BUSINESS_MODEL_PROBLEM',
        version: '1.0',
        template: options.template,
        completeness: this.calculateCompleteness(canvasData)
      }
    };
  }

  /**
   * Generate Business Model Canvas (9-block canvas)
   */
  generateBusinessModelCanvas(
    sessionData: BusinessModelPhaseData,
    options: CanvasGenerationOptions
  ): GeneratedCanvas {
    const bmcData = this.buildBusinessModelCanvasData(sessionData);
    const sections = this.generateBusinessModelCanvasSections(bmcData, sessionData, options);
    
    const content = this.formatCanvas(sections, options);
    
    return {
      title: 'Business Model Canvas',
      content,
      format: options.format,
      canvasData: this.convertBMCToLeanCanvas(bmcData),
      sections,
      metadata: {
        generatedAt: new Date(),
        pathway: 'BUSINESS_MODEL_PROBLEM',
        version: '1.0',
        template: 'business-model-canvas',
        completeness: this.calculateBMCCompleteness(bmcData)
      }
    };
  }

  /**
   * Generate Value Proposition Canvas
   */
  generateValuePropositionCanvas(
    sessionData: BusinessModelPhaseData,
    options: CanvasGenerationOptions
  ): GeneratedCanvas {
    const sections = this.generateValuePropositionSections(sessionData, options);
    
    const content = this.formatCanvas(sections, options);
    
    return {
      title: 'Value Proposition Canvas',
      content,
      format: options.format,
      canvasData: this.extractLeanCanvasFromVPC(sessionData),
      sections,
      metadata: {
        generatedAt: new Date(),
        pathway: 'BUSINESS_MODEL_PROBLEM',
        version: '1.0',
        template: 'value-proposition-canvas',
        completeness: this.calculateVPCCompleteness(sessionData)
      }
    };
  }

  /**
   * Build Lean Canvas data structure from session data
   */
  private buildLeanCanvasData(sessionData: BusinessModelPhaseData): LeanCanvasData {
    const canvas: LeanCanvasData = {
      problem: [],
      solution: [],
      uniqueValueProposition: '',
      unfairAdvantage: '',
      customerSegments: [],
      keyMetrics: [],
      channels: [],
      costStructure: [],
      revenueStreams: []
    };

    // Extract problems from customer segment pain points
    if (sessionData.customerSegments) {
      sessionData.customerSegments.forEach(segment => {
        canvas.problem.push(...segment.painPoints.slice(0, 3)); // Top 3 problems
        canvas.customerSegments.push(segment.name);
      });
      // Remove duplicates
      canvas.problem = [...new Set(canvas.problem)];
      canvas.customerSegments = [...new Set(canvas.customerSegments)];
    }

    // Extract solution from value propositions
    if (sessionData.valuePropositions) {
      sessionData.valuePropositions.forEach(vp => {
        canvas.solution.push(...vp.gainCreators.slice(0, 2));
        if (!canvas.uniqueValueProposition && vp.uniqueDifferentiator) {
          canvas.uniqueValueProposition = vp.uniqueDifferentiator;
        }
        if (!canvas.unfairAdvantage && vp.competitiveAdvantage) {
          canvas.unfairAdvantage = vp.competitiveAdvantage;
        }
      });
      canvas.solution = [...new Set(canvas.solution)];
    }

    // Extract revenue streams
    if (sessionData.revenueStreams) {
      canvas.revenueStreams = sessionData.revenueStreams.map(stream => 
        `${stream.name} (${stream.type}) - ${stream.estimatedRevenue}`
      );
    }

    // Generate key metrics based on business model
    canvas.keyMetrics = this.generateKeyMetrics(sessionData);

    // Generate channels based on customer segments and business model
    canvas.channels = this.generateChannels(sessionData);

    // Generate cost structure
    canvas.costStructure = this.generateCostStructure(sessionData);

    return canvas;
  }

  /**
   * Build Business Model Canvas data structure
   */
  private buildBusinessModelCanvasData(sessionData: BusinessModelPhaseData): BusinessModelCanvasData {
    return {
      keyPartners: this.generateKeyPartners(sessionData),
      keyActivities: this.generateKeyActivities(sessionData),
      keyResources: this.generateKeyResources(sessionData),
      valuePropositions: sessionData.valuePropositions?.map(vp => vp.uniqueDifferentiator) || [],
      customerRelationships: this.generateCustomerRelationships(sessionData),
      channels: this.generateChannels(sessionData),
      customerSegments: sessionData.customerSegments?.map(cs => cs.name) || [],
      costStructure: this.generateCostStructure(sessionData),
      revenueStreams: sessionData.revenueStreams?.map(rs => `${rs.name} (${rs.type})`) || []
    };
  }

  /**
   * Generate Lean Canvas sections with analysis
   */
  private generateLeanCanvasSections(
    canvasData: LeanCanvasData,
    sessionData: BusinessModelPhaseData,
    options: CanvasGenerationOptions
  ): CanvasSection[] {
    const sections: CanvasSection[] = [];

    // Problem section
    sections.push({
      id: 'problem',
      title: 'Problem',
      content: canvasData.problem,
      analysis: options.includeAnalysis ? this.analyzeProblems(canvasData.problem, sessionData) : undefined,
      implementationNotes: options.includeImplementationNotes ? [
        'Validate these problems through customer interviews',
        'Prioritize problems by frequency and intensity',
        'Quantify the cost of these problems to customers'
      ] : undefined
    });

    // Solution section
    sections.push({
      id: 'solution',
      title: 'Solution',
      content: canvasData.solution,
      analysis: options.includeAnalysis ? this.analyzeSolution(canvasData.solution, sessionData) : undefined,
      implementationNotes: options.includeImplementationNotes ? [
        'Build MVP with core features only',
        'Test solution-problem fit with early users',
        'Iterate based on user feedback'
      ] : undefined
    });

    // Unique Value Proposition
    sections.push({
      id: 'unique-value-proposition',
      title: 'Unique Value Proposition',
      content: [canvasData.uniqueValueProposition],
      analysis: options.includeAnalysis ? this.analyzeUVP(canvasData.uniqueValueProposition, sessionData) : undefined,
      implementationNotes: options.includeImplementationNotes ? [
        'Test messaging with target customers',
        'A/B test different value proposition statements',
        'Align all marketing materials with this UVP'
      ] : undefined
    });

    // Unfair Advantage
    sections.push({
      id: 'unfair-advantage',
      title: 'Unfair Advantage',
      content: [canvasData.unfairAdvantage],
      analysis: options.includeAnalysis ? this.analyzeUnfairAdvantage(canvasData.unfairAdvantage) : undefined,
      implementationNotes: options.includeImplementationNotes ? [
        'Strengthen this advantage through strategic actions',
        'Build moats around your competitive position',
        'Patent or protect key intellectual property'
      ] : undefined
    });

    // Customer Segments
    sections.push({
      id: 'customer-segments',
      title: 'Customer Segments',
      content: canvasData.customerSegments,
      analysis: options.includeAnalysis ? this.analyzeCustomerSegments(sessionData.customerSegments || []) : undefined,
      feasibilityScore: options.includeFeasibilityScores ? this.calculateCustomerSegmentScore(sessionData.customerSegments || []) : undefined,
      implementationNotes: options.includeImplementationNotes ? [
        'Start with the most accessible segment',
        'Develop detailed buyer personas',
        'Map the customer journey for each segment'
      ] : undefined
    });

    // Key Metrics
    sections.push({
      id: 'key-metrics',
      title: 'Key Metrics',
      content: canvasData.keyMetrics,
      analysis: options.includeAnalysis ? 'Track these metrics weekly to measure business health and growth' : undefined,
      implementationNotes: options.includeImplementationNotes ? [
        'Set up analytics tracking for all metrics',
        'Create dashboards for real-time monitoring',
        'Review metrics weekly and adjust strategy'
      ] : undefined
    });

    // Channels
    sections.push({
      id: 'channels',
      title: 'Channels',
      content: canvasData.channels,
      analysis: options.includeAnalysis ? this.analyzeChannels(canvasData.channels) : undefined,
      implementationNotes: options.includeImplementationNotes ? [
        'Test channels with small budgets first',
        'Focus on 2-3 channels maximum initially',
        'Optimize successful channels before expanding'
      ] : undefined
    });

    // Cost Structure
    sections.push({
      id: 'cost-structure',
      title: 'Cost Structure',
      content: canvasData.costStructure,
      analysis: options.includeAnalysis ? this.analyzeCostStructure(canvasData.costStructure) : undefined,
      implementationNotes: options.includeImplementationNotes ? [
        'Track unit economics closely',
        'Identify variable vs fixed costs',
        'Plan for scale economies'
      ] : undefined
    });

    // Revenue Streams
    sections.push({
      id: 'revenue-streams',
      title: 'Revenue Streams',
      content: canvasData.revenueStreams,
      feasibilityScore: options.includeFeasibilityScores ? this.calculateRevenueStreamScore(sessionData.revenueStreams || []) : undefined,
      analysis: options.includeAnalysis ? this.analyzeRevenueStreams(sessionData.revenueStreams || []) : undefined,
      implementationNotes: options.includeImplementationNotes ? [
        'Start with the highest feasibility revenue stream',
        'Test pricing with early customers',
        'Consider multiple revenue models for diversification'
      ] : undefined
    });

    return sections;
  }

  /**
   * Generate Business Model Canvas sections
   */
  private generateBusinessModelCanvasSections(
    bmcData: BusinessModelCanvasData,
    sessionData: BusinessModelPhaseData,
    options: CanvasGenerationOptions
  ): CanvasSection[] {
    return [
      {
        id: 'key-partners',
        title: 'Key Partners',
        content: bmcData.keyPartners,
        analysis: options.includeAnalysis ? 'Strategic partnerships for key activities, resources, and market access' : undefined
      },
      {
        id: 'key-activities',
        title: 'Key Activities',
        content: bmcData.keyActivities,
        analysis: options.includeAnalysis ? 'Critical activities required to deliver value proposition' : undefined
      },
      {
        id: 'key-resources',
        title: 'Key Resources',
        content: bmcData.keyResources,
        analysis: options.includeAnalysis ? 'Essential assets needed to create and deliver value' : undefined
      },
      {
        id: 'value-propositions',
        title: 'Value Propositions',
        content: bmcData.valuePropositions,
        analysis: options.includeAnalysis ? 'Unique value created for each customer segment' : undefined
      },
      {
        id: 'customer-relationships',
        title: 'Customer Relationships',
        content: bmcData.customerRelationships,
        analysis: options.includeAnalysis ? 'How you acquire, retain, and grow customers' : undefined
      },
      {
        id: 'channels',
        title: 'Channels',
        content: bmcData.channels,
        analysis: options.includeAnalysis ? 'How you reach and deliver value to customers' : undefined
      },
      {
        id: 'customer-segments',
        title: 'Customer Segments',
        content: bmcData.customerSegments,
        feasibilityScore: options.includeFeasibilityScores ? this.calculateCustomerSegmentScore(sessionData.customerSegments || []) : undefined
      },
      {
        id: 'cost-structure',
        title: 'Cost Structure',
        content: bmcData.costStructure,
        analysis: options.includeAnalysis ? 'Major costs required to operate the business model' : undefined
      },
      {
        id: 'revenue-streams',
        title: 'Revenue Streams',
        content: bmcData.revenueStreams,
        feasibilityScore: options.includeFeasibilityScores ? this.calculateRevenueStreamScore(sessionData.revenueStreams || []) : undefined
      }
    ];
  }

  /**
   * Generate Value Proposition Canvas sections
   */
  private generateValuePropositionSections(
    sessionData: BusinessModelPhaseData,
    options: CanvasGenerationOptions
  ): CanvasSection[] {
    const sections: CanvasSection[] = [];

    if (sessionData.valuePropositions) {
      sessionData.valuePropositions.forEach((vp, index) => {
        sections.push({
          id: `value-prop-${index}`,
          title: `Value Proposition for ${vp.segment}`,
          content: [
            `Job to be Done: ${vp.jobToBeDone}`,
            `Pain Relievers: ${vp.painRelievers.join(', ')}`,
            `Gain Creators: ${vp.gainCreators.join(', ')}`,
            `Unique Differentiator: ${vp.uniqueDifferentiator}`
          ],
          analysis: options.includeAnalysis ? `This value proposition addresses ${vp.segment} customers' core job of ${vp.jobToBeDone}` : undefined
        });
      });
    }

    return sections;
  }

  /**
   * Format canvas content based on format option
   */
  private formatCanvas(sections: CanvasSection[], options: CanvasGenerationOptions): string {
    switch (options.format) {
      case 'markdown':
        return this.formatAsMarkdown(sections, options);
      case 'html':
        return this.formatAsHTML(sections, options);
      case 'json':
        return JSON.stringify(sections, null, 2);
      case 'svg':
        return this.formatAsSVG(sections, options);
      default:
        return this.formatAsMarkdown(sections, options);
    }
  }

  /**
   * Format as Markdown
   */
  private formatAsMarkdown(sections: CanvasSection[], options: CanvasGenerationOptions): string {
    let markdown = `# ${options.template === 'lean-canvas' ? 'Lean Canvas' : 'Business Model Canvas'}\n\n`;
    markdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;

    sections.forEach(section => {
      markdown += `## ${section.title}\n\n`;
      
      if (section.content.length > 0) {
        section.content.forEach(item => {
          markdown += `- ${item}\n`;
        });
      } else {
        markdown += '*To be defined*\n';
      }
      
      if (section.feasibilityScore) {
        markdown += `\n**Feasibility Score:** ${section.feasibilityScore}%\n`;
      }
      
      if (section.analysis) {
        markdown += `\n**Analysis:** ${section.analysis}\n`;
      }
      
      if (section.implementationNotes) {
        markdown += `\n**Implementation Notes:**\n`;
        section.implementationNotes.forEach(note => {
          markdown += `- ${note}\n`;
        });
      }
      
      markdown += '\n---\n\n';
    });

    return markdown;
  }

  /**
   * Format as HTML
   */
  private formatAsHTML(sections: CanvasSection[], options: CanvasGenerationOptions): string {
    let html = `<div class="business-model-canvas">`;
    html += `<h1>${options.template === 'lean-canvas' ? 'Lean Canvas' : 'Business Model Canvas'}</h1>`;
    
    sections.forEach(section => {
      html += `<div class="canvas-section" data-section="${section.id}">`;
      html += `<h2>${section.title}</h2>`;
      html += `<ul>`;
      section.content.forEach(item => {
        html += `<li>${item}</li>`;
      });
      html += `</ul>`;
      
      if (section.analysis) {
        html += `<div class="analysis"><strong>Analysis:</strong> ${section.analysis}</div>`;
      }
      
      html += `</div>`;
    });
    
    html += `</div>`;
    return html;
  }

  /**
   * Format as SVG (simplified canvas visualization)
   */
  private formatAsSVG(sections: CanvasSection[], options: CanvasGenerationOptions): string {
    // This would generate an SVG representation of the canvas
    // For now, return a placeholder
    return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <text x="400" y="300" text-anchor="middle">Canvas Visualization (SVG format coming soon)</text>
    </svg>`;
  }

  /**
   * Helper methods for generating canvas content
   */
  private generateKeyMetrics(sessionData: BusinessModelPhaseData): string[] {
    const metrics = [];
    
    // Add metrics based on revenue streams
    if (sessionData.revenueStreams) {
      if (sessionData.revenueStreams.some(rs => rs.type === 'subscription')) {
        metrics.push('Monthly Recurring Revenue (MRR)', 'Customer Churn Rate', 'Customer Lifetime Value');
      }
      if (sessionData.revenueStreams.some(rs => rs.type === 'marketplace')) {
        metrics.push('Gross Merchandise Volume (GMV)', 'Take Rate', 'Active Users');
      }
    }
    
    // Add general business metrics
    metrics.push('Customer Acquisition Cost', 'Revenue Growth Rate', 'User Engagement');
    
    return [...new Set(metrics)];
  }

  private generateChannels(sessionData: BusinessModelPhaseData): string[] {
    const channels = [];
    
    // Generate channels based on customer segments
    if (sessionData.customerSegments) {
      sessionData.customerSegments.forEach(segment => {
        if (segment.demographics.some(demo => demo.toLowerCase().includes('b2b'))) {
          channels.push('Direct Sales', 'Partner Channel', 'Industry Events');
        } else {
          channels.push('Digital Marketing', 'Social Media', 'Content Marketing');
        }
      });
    }
    
    // Default channels
    if (channels.length === 0) {
      channels.push('Website', 'Digital Marketing', 'Word of Mouth');
    }
    
    return [...new Set(channels)];
  }

  private generateCostStructure(sessionData: BusinessModelPhaseData): string[] {
    const costs = ['Technology Infrastructure', 'Customer Acquisition', 'Personnel'];
    
    // Add costs based on revenue streams
    if (sessionData.revenueStreams) {
      if (sessionData.revenueStreams.some(rs => rs.type === 'marketplace')) {
        costs.push('Platform Operations', 'Payment Processing');
      }
      if (sessionData.revenueStreams.some(rs => rs.type === 'subscription')) {
        costs.push('Customer Support', 'Retention Programs');
      }
    }
    
    return costs;
  }

  private generateKeyPartners(sessionData: BusinessModelPhaseData): string[] {
    return ['Technology Providers', 'Distribution Partners', 'Suppliers', 'Strategic Alliances'];
  }

  private generateKeyActivities(sessionData: BusinessModelPhaseData): string[] {
    return ['Product Development', 'Marketing & Sales', 'Customer Support', 'Operations'];
  }

  private generateKeyResources(sessionData: BusinessModelPhaseData): string[] {
    return ['Technology Platform', 'Brand & Reputation', 'Customer Data', 'Team & Expertise'];
  }

  private generateCustomerRelationships(sessionData: BusinessModelPhaseData): string[] {
    return ['Self-Service', 'Personal Assistance', 'Community', 'Co-creation'];
  }

  /**
   * Analysis methods for each section
   */
  private analyzeProblems(problems: string[], sessionData: BusinessModelPhaseData): string {
    return `Identified ${problems.length} core problems. Focus on validating the most critical problem first.`;
  }

  private analyzeSolution(solutions: string[], sessionData: BusinessModelPhaseData): string {
    return `${solutions.length} solution approaches identified. Build MVP with core features to test problem-solution fit.`;
  }

  private analyzeUVP(uvp: string, sessionData: BusinessModelPhaseData): string {
    return uvp ? 'Clear unique value proposition defined. Test messaging with target customers.' : 'UVP needs refinement and validation.';
  }

  private analyzeUnfairAdvantage(advantage: string): string {
    return advantage ? 'Competitive advantage identified. Strengthen through strategic actions.' : 'Need to develop defensible competitive moats.';
  }

  private analyzeCustomerSegments(segments: CustomerSegment[]): string {
    const highPrioritySegments = segments.filter(s => s.priority === 'high').length;
    return `${segments.length} customer segments identified, ${highPrioritySegments} high-priority. Start with most accessible segment.`;
  }

  private analyzeChannels(channels: string[]): string {
    return `${channels.length} channels identified. Test 2-3 channels initially and optimize successful ones.`;
  }

  private analyzeCostStructure(costs: string[]): string {
    return `${costs.length} major cost categories. Monitor unit economics and optimize for profitability.`;
  }

  private analyzeRevenueStreams(streams: RevenueStream[]): string {
    const avgFeasibility = streams.length > 0 ? streams.reduce((sum, s) => sum + s.feasibility, 0) / streams.length : 0;
    return `${streams.length} revenue streams with average feasibility of ${avgFeasibility.toFixed(0)}%. Focus on highest feasibility streams first.`;
  }

  /**
   * Scoring methods
   */
  private calculateCustomerSegmentScore(segments: CustomerSegment[]): number {
    if (segments.length === 0) return 0;
    
    const scores = segments.map(segment => {
      let score = 0;
      if (segment.priority === 'high') score += 40;
      else if (segment.priority === 'medium') score += 25;
      else score += 10;
      
      if (segment.size === 'large') score += 30;
      else if (segment.size === 'medium') score += 20;
      else score += 10;
      
      if (segment.painPoints.length >= 3) score += 20;
      else if (segment.painPoints.length >= 2) score += 15;
      else score += 5;
      
      return Math.min(score, 100);
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private calculateRevenueStreamScore(streams: RevenueStream[]): number {
    if (streams.length === 0) return 0;
    
    const avgFeasibility = streams.reduce((sum, s) => sum + s.feasibility, 0) / streams.length;
    const avgConfidence = streams.reduce((sum, s) => sum + s.confidence, 0) / streams.length;
    
    return Math.round((avgFeasibility + avgConfidence) / 2);
  }

  /**
   * Completeness calculation
   */
  private calculateCompleteness(canvasData: LeanCanvasData): number {
    const sections = [
      canvasData.problem.length > 0,
      canvasData.solution.length > 0,
      canvasData.uniqueValueProposition.length > 0,
      canvasData.unfairAdvantage.length > 0,
      canvasData.customerSegments.length > 0,
      canvasData.keyMetrics.length > 0,
      canvasData.channels.length > 0,
      canvasData.costStructure.length > 0,
      canvasData.revenueStreams.length > 0
    ];
    
    const completedSections = sections.filter(Boolean).length;
    return Math.round((completedSections / sections.length) * 100);
  }

  private calculateBMCCompleteness(bmcData: BusinessModelCanvasData): number {
    const sections = [
      bmcData.keyPartners.length > 0,
      bmcData.keyActivities.length > 0,
      bmcData.keyResources.length > 0,
      bmcData.valuePropositions.length > 0,
      bmcData.customerRelationships.length > 0,
      bmcData.channels.length > 0,
      bmcData.customerSegments.length > 0,
      bmcData.costStructure.length > 0,
      bmcData.revenueStreams.length > 0
    ];
    
    const completedSections = sections.filter(Boolean).length;
    return Math.round((completedSections / sections.length) * 100);
  }

  private calculateVPCCompleteness(sessionData: BusinessModelPhaseData): number {
    const vpCount = sessionData.valuePropositions?.length || 0;
    return vpCount > 0 ? 100 : 0;
  }

  /**
   * Utility methods
   */
  private convertBMCToLeanCanvas(bmcData: BusinessModelCanvasData): LeanCanvasData {
    return {
      problem: [], // Would need to infer from value propositions
      solution: [], // Would need to infer from value propositions
      uniqueValueProposition: bmcData.valuePropositions[0] || '',
      unfairAdvantage: '',
      customerSegments: bmcData.customerSegments,
      keyMetrics: [],
      channels: bmcData.channels,
      costStructure: bmcData.costStructure,
      revenueStreams: bmcData.revenueStreams
    };
  }

  private extractLeanCanvasFromVPC(sessionData: BusinessModelPhaseData): LeanCanvasData {
    // Extract basic Lean Canvas data from Value Proposition Canvas session
    return this.buildLeanCanvasData(sessionData);
  }
}

/**
 * Factory function to create canvas generator
 */
export function createLeanCanvasGenerator(): LeanCanvasGenerator {
  return new LeanCanvasGenerator();
}