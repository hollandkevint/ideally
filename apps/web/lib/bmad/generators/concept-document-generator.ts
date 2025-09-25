import { 
  NewIdeaPhaseData, 
  BusinessConcept, 
  MarketOpportunity, 
  CompetitorAnalysis, 
  TargetAudience,
  BusinessModelElements 
} from '../templates/new-idea-templates';

/**
 * Business Concept Document Generator
 * Creates structured documents from New Idea pathway session data
 */

export interface DocumentGenerationOptions {
  format: 'markdown' | 'html' | 'json';
  includeAnalysis: boolean;
  includeRecommendations: boolean;
  includeNextSteps: boolean;
}

export interface GeneratedDocument {
  title: string;
  content: string;
  format: string;
  sections: DocumentSection[];
  metadata: DocumentMetadata;
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface DocumentMetadata {
  generatedAt: Date;
  sessionId?: string;
  pathway: string;
  version: string;
  wordCount: number;
}

/**
 * Main document generator class
 */
export class ConceptDocumentGenerator {
  
  /**
   * Generate complete business concept document
   */
  generateBusinessConcept(
    sessionData: NewIdeaPhaseData,
    options: DocumentGenerationOptions = {
      format: 'markdown',
      includeAnalysis: true,
      includeRecommendations: true,
      includeNextSteps: true
    }
  ): GeneratedDocument {
    const concept = this.buildBusinessConcept(sessionData);
    const sections = this.generateSections(concept, sessionData, options);
    
    const content = this.formatDocument(sections, options.format);
    
    return {
      title: concept.title,
      content,
      format: options.format,
      sections,
      metadata: {
        generatedAt: new Date(),
        pathway: 'NEW_IDEA',
        version: '1.0',
        wordCount: this.countWords(content)
      }
    };
  }

  /**
   * Generate market analysis report
   */
  generateMarketAnalysisReport(
    sessionData: NewIdeaPhaseData,
    options: DocumentGenerationOptions = { format: 'markdown', includeAnalysis: true, includeRecommendations: true, includeNextSteps: false }
  ): GeneratedDocument {
    const sections = this.generateMarketAnalysisSections(sessionData, options);
    const content = this.formatDocument(sections, options.format);
    
    return {
      title: 'Market Analysis Report',
      content,
      format: options.format,
      sections,
      metadata: {
        generatedAt: new Date(),
        pathway: 'NEW_IDEA',
        version: '1.0',
        wordCount: this.countWords(content)
      }
    };
  }

  /**
   * Generate implementation roadmap
   */
  generateImplementationRoadmap(
    sessionData: NewIdeaPhaseData,
    options: DocumentGenerationOptions = { format: 'markdown', includeAnalysis: false, includeRecommendations: true, includeNextSteps: true }
  ): GeneratedDocument {
    const sections = this.generateRoadmapSections(sessionData, options);
    const content = this.formatDocument(sections, options.format);
    
    return {
      title: 'Implementation Roadmap',
      content,
      format: options.format,
      sections,
      metadata: {
        generatedAt: new Date(),
        pathway: 'NEW_IDEA',
        version: '1.0',
        wordCount: this.countWords(content)
      }
    };
  }

  /**
   * Build business concept from session data
   */
  private buildBusinessConcept(sessionData: NewIdeaPhaseData): BusinessConcept {
    const primaryOpportunity = sessionData.marketOpportunities?.[0];
    const primaryValueProp = sessionData.uniqueValueProps?.[0] || 'Unique value proposition to be defined';
    
    return {
      title: this.extractTitle(sessionData),
      executiveSummary: this.generateExecutiveSummary(sessionData),
      problemStatement: this.extractProblemStatement(sessionData),
      solution: this.extractSolution(sessionData),
      uniqueValueProposition: primaryValueProp,
      targetMarket: sessionData.targetAudience || this.generateDefaultTargetAudience(),
      competitiveAdvantage: this.generateCompetitiveAdvantage(sessionData),
      businessModel: sessionData.businessModelElements || this.generateDefaultBusinessModel(),
      marketOpportunity: sessionData.marketOpportunities || [],
      nextSteps: this.generateNextSteps(sessionData),
      risks: this.identifyRisks(sessionData),
      successMetrics: this.generateSuccessMetrics(sessionData)
    };
  }

  /**
   * Generate document sections for business concept
   */
  private generateSections(
    concept: BusinessConcept,
    sessionData: NewIdeaPhaseData,
    options: DocumentGenerationOptions
  ): DocumentSection[] {
    const sections: DocumentSection[] = [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        content: concept.executiveSummary,
        order: 1
      },
      {
        id: 'problem-solution',
        title: 'Problem & Solution',
        content: `**Problem Statement:**\n${concept.problemStatement}\n\n**Solution:**\n${concept.solution}`,
        order: 2
      },
      {
        id: 'value-proposition',
        title: 'Unique Value Proposition',
        content: concept.uniqueValueProposition,
        order: 3
      },
      {
        id: 'target-market',
        title: 'Target Market',
        content: this.formatTargetMarket(concept.targetMarket),
        order: 4
      },
      {
        id: 'competitive-advantage',
        title: 'Competitive Advantage',
        content: concept.competitiveAdvantage,
        order: 5
      },
      {
        id: 'business-model',
        title: 'Business Model',
        content: this.formatBusinessModel(concept.businessModel),
        order: 6
      }
    ];

    if (concept.marketOpportunity.length > 0) {
      sections.push({
        id: 'market-opportunity',
        title: 'Market Opportunity',
        content: this.formatMarketOpportunities(concept.marketOpportunity),
        order: 7
      });
    }

    if (options.includeNextSteps) {
      sections.push({
        id: 'next-steps',
        title: 'Next Steps',
        content: this.formatList(concept.nextSteps),
        order: 8
      });
    }

    if (options.includeAnalysis) {
      sections.push({
        id: 'risks',
        title: 'Risks & Mitigations',
        content: this.formatList(concept.risks),
        order: 9
      });
    }

    sections.push({
      id: 'success-metrics',
      title: 'Success Metrics',
      content: this.formatList(concept.successMetrics),
      order: 10
    });

    return sections.sort((a, b) => a.order - b.order);
  }

  /**
   * Generate market analysis sections
   */
  private generateMarketAnalysisSections(
    sessionData: NewIdeaPhaseData,
    options: DocumentGenerationOptions
  ): DocumentSection[] {
    const sections: DocumentSection[] = [
      {
        id: 'market-overview',
        title: 'Market Overview',
        content: this.generateMarketOverview(sessionData),
        order: 1
      },
      {
        id: 'market-opportunities',
        title: 'Market Opportunities',
        content: this.formatMarketOpportunities(sessionData.marketOpportunities || []),
        order: 2
      },
      {
        id: 'competitive-landscape',
        title: 'Competitive Landscape',
        content: this.formatCompetitiveLandscape(sessionData.competitiveLandscape || []),
        order: 3
      }
    ];

    if (sessionData.targetAudience) {
      sections.push({
        id: 'target-audience',
        title: 'Target Audience Analysis',
        content: this.formatTargetMarket(sessionData.targetAudience),
        order: 4
      });
    }

    return sections.sort((a, b) => a.order - b.order);
  }

  /**
   * Generate roadmap sections
   */
  private generateRoadmapSections(
    sessionData: NewIdeaPhaseData,
    options: DocumentGenerationOptions
  ): DocumentSection[] {
    const nextSteps = this.generateNextSteps(sessionData);
    
    return [
      {
        id: 'immediate-actions',
        title: 'Immediate Actions (Next 30 Days)',
        content: this.formatList(nextSteps.slice(0, 3)),
        order: 1
      },
      {
        id: 'short-term-goals',
        title: 'Short-term Goals (3-6 Months)',
        content: this.formatList(nextSteps.slice(3, 6)),
        order: 2
      },
      {
        id: 'long-term-vision',
        title: 'Long-term Vision (6-12 Months)',
        content: this.formatList(nextSteps.slice(6)),
        order: 3
      },
      {
        id: 'success-metrics',
        title: 'Key Performance Indicators',
        content: this.formatList(this.generateSuccessMetrics(sessionData)),
        order: 4
      }
    ];
  }

  /**
   * Helper methods for content generation
   */
  private extractTitle(sessionData: NewIdeaPhaseData): string {
    if (sessionData.rawIdea) {
      const firstSentence = sessionData.rawIdea.split('.')[0];
      return firstSentence.length > 50 ? 'New Business Concept' : firstSentence;
    }
    return 'New Business Concept';
  }

  private generateExecutiveSummary(sessionData: NewIdeaPhaseData): string {
    const insights = sessionData.ideationInsights?.join(' ') || '';
    const opportunities = sessionData.marketOpportunities?.map(o => o.description).join(' ') || '';
    
    return `This business concept addresses a significant market opportunity through innovative solution design. ${insights} ${opportunities}`.trim();
  }

  private extractProblemStatement(sessionData: NewIdeaPhaseData): string {
    const insights = sessionData.ideationInsights?.find(insight => 
      insight.toLowerCase().includes('problem') || insight.toLowerCase().includes('issue')
    );
    return insights || 'Problem statement to be refined based on market research.';
  }

  private extractSolution(sessionData: NewIdeaPhaseData): string {
    const insights = sessionData.ideationInsights?.find(insight => 
      insight.toLowerCase().includes('solution') || insight.toLowerCase().includes('solves')
    );
    return insights || sessionData.rawIdea || 'Solution approach to be detailed.';
  }

  private generateDefaultTargetAudience(): TargetAudience {
    return {
      primarySegment: 'To be defined through market research',
      demographics: ['Age range to be determined', 'Income level analysis needed'],
      psychographics: ['Values and motivations to be researched'],
      painPoints: ['Specific pain points to be validated'],
      desiredOutcomes: ['Success outcomes to be identified']
    };
  }

  private generateDefaultBusinessModel(): BusinessModelElements {
    return {
      revenueStreams: ['Primary revenue model to be determined'],
      costStructure: ['Key cost drivers to be identified'],
      keyActivities: ['Core business activities to be defined'],
      keyResources: ['Critical resources to be secured'],
      channels: ['Distribution channels to be established'],
      customerRelationships: ['Customer relationship strategy to be developed']
    };
  }

  private generateCompetitiveAdvantage(sessionData: NewIdeaPhaseData): string {
    if (sessionData.uniqueValueProps && sessionData.uniqueValueProps.length > 0) {
      return sessionData.uniqueValueProps.join('. ');
    }
    return 'Competitive advantages to be validated through market analysis.';
  }

  private generateNextSteps(sessionData: NewIdeaPhaseData): string[] {
    const steps = [
      'Conduct customer interviews to validate problem-solution fit',
      'Develop minimum viable product (MVP) or prototype',
      'Test initial market response and gather feedback',
      'Refine business model based on early learning',
      'Secure initial funding or investment',
      'Build core team and establish operations',
      'Develop go-to-market strategy',
      'Launch beta program with select customers',
      'Scale operations based on proven model'
    ];
    
    return steps;
  }

  private identifyRisks(sessionData: NewIdeaPhaseData): string[] {
    return [
      'Market acceptance may be lower than anticipated',
      'Competition could emerge with similar solutions',
      'Technical implementation challenges may arise',
      'Customer acquisition costs might exceed projections',
      'Regulatory or compliance issues could impact operations'
    ];
  }

  private generateSuccessMetrics(sessionData: NewIdeaPhaseData): string[] {
    return [
      'Customer acquisition rate and cost',
      'Monthly recurring revenue (MRR) growth',
      'Customer satisfaction and retention rates',
      'Market share within target segment',
      'Product adoption and usage metrics'
    ];
  }

  /**
   * Formatting helpers
   */
  private formatTargetMarket(audience: TargetAudience): string {
    return `
**Primary Segment:** ${audience.primarySegment}

**Demographics:**
${this.formatList(audience.demographics)}

**Psychographics:**
${this.formatList(audience.psychographics)}

**Pain Points:**
${this.formatList(audience.painPoints)}

**Desired Outcomes:**
${this.formatList(audience.desiredOutcomes)}
    `.trim();
  }

  private formatBusinessModel(model: BusinessModelElements): string {
    return `
**Revenue Streams:**
${this.formatList(model.revenueStreams)}

**Cost Structure:**
${this.formatList(model.costStructure)}

**Key Activities:**
${this.formatList(model.keyActivities)}

**Key Resources:**
${this.formatList(model.keyResources)}

**Distribution Channels:**
${this.formatList(model.channels)}

**Customer Relationships:**
${this.formatList(model.customerRelationships)}
    `.trim();
  }

  private formatMarketOpportunities(opportunities: MarketOpportunity[]): string {
    if (opportunities.length === 0) {
      return 'Market opportunities to be identified through research.';
    }
    
    return opportunities.map(opp => `
**${opp.description}**
- Market Size: ${opp.marketSize}
- Growth Potential: ${opp.growthPotential}
- Confidence Level: ${(opp.confidence * 100).toFixed(0)}%
- Key Insights: ${opp.insights.join(', ')}
    `).join('\n');
  }

  private formatCompetitiveLandscape(competitors: CompetitorAnalysis[]): string {
    if (competitors.length === 0) {
      return 'Competitive analysis to be conducted.';
    }
    
    return competitors.map(comp => `
**${comp.name}**
- Market Position: ${comp.marketPosition}
- Strengths: ${comp.strengths.join(', ')}
- Weaknesses: ${comp.weaknesses.join(', ')}
- Differentiators: ${comp.differentiators.join(', ')}
    `).join('\n');
  }

  private formatList(items: string[]): string {
    return items.map(item => `- ${item}`).join('\n');
  }

  private generateMarketOverview(sessionData: NewIdeaPhaseData): string {
    const opportunities = sessionData.marketOpportunities || [];
    if (opportunities.length === 0) {
      return 'Market overview to be developed through comprehensive research.';
    }
    
    return `The market presents ${opportunities.length} key opportunities with varying growth potential. ${opportunities.map(o => o.description).join(' ')}`;
  }

  /**
   * Document formatting
   */
  private formatDocument(sections: DocumentSection[], format: string): string {
    switch (format) {
      case 'markdown':
        return this.formatAsMarkdown(sections);
      case 'html':
        return this.formatAsHTML(sections);
      case 'json':
        return JSON.stringify(sections, null, 2);
      default:
        return this.formatAsMarkdown(sections);
    }
  }

  private formatAsMarkdown(sections: DocumentSection[]): string {
    return sections.map(section => `
# ${section.title}

${section.content}
    `).join('\n---\n');
  }

  private formatAsHTML(sections: DocumentSection[]): string {
    const content = sections.map(section => `
<section id="${section.id}">
  <h2>${section.title}</h2>
  <div class="content">
    ${section.content.replace(/\n/g, '<br>')}
  </div>
</section>
    `).join('\n');
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Business Concept Document</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    section { margin-bottom: 30px; }
    h2 { border-bottom: 2px solid #333; padding-bottom: 10px; }
  </style>
</head>
<body>
${content}
</body>
</html>
    `;
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }
}

/**
 * Factory function
 */
export function createConceptDocumentGenerator(): ConceptDocumentGenerator {
  return new ConceptDocumentGenerator();
}