import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ConceptDocumentGenerator, 
  createConceptDocumentGenerator,
  type DocumentGenerationOptions 
} from '../../../lib/bmad/generators/concept-document-generator';
import { type NewIdeaPhaseData } from '../../../lib/bmad/templates/new-idea-templates';

describe('ConceptDocumentGenerator', () => {
  let generator: ConceptDocumentGenerator;
  let mockSessionData: NewIdeaPhaseData;

  beforeEach(() => {
    generator = createConceptDocumentGenerator();
    mockSessionData = {
      rawIdea: 'A revolutionary food delivery service for busy professionals',
      ideationInsights: [
        'Food delivery market is growing rapidly',
        'Professionals need convenient, healthy options',
        'Current solutions lack quality control'
      ],
      marketOpportunities: [
        {
          id: '1',
          description: 'Urban professionals market segment',
          marketSize: 'Large ($50B+ globally)',
          growthPotential: 'high',
          confidence: 0.85,
          insights: ['High disposable income', 'Time-constrained lifestyle']
        },
        {
          id: '2', 
          description: 'Corporate catering opportunities',
          marketSize: 'Medium ($10B)',
          growthPotential: 'medium',
          confidence: 0.7,
          insights: ['Regular ordering patterns', 'Bulk discounts possible']
        }
      ],
      uniqueValueProps: [
        'Premium quality ingredients sourced locally',
        'Guaranteed 30-minute delivery or free meal',
        'AI-powered personalized nutrition recommendations'
      ],
      competitiveLandscape: [
        {
          name: 'UberEats',
          strengths: ['Large network', 'Brand recognition', 'Fast delivery'],
          weaknesses: ['Quality inconsistency', 'High fees', 'Limited healthy options'],
          marketPosition: 'Mass market leader',
          differentiators: ['Speed', 'Coverage area']
        },
        {
          name: 'DoorDash',
          strengths: ['Local partnerships', 'Promotions'],
          weaknesses: ['Poor customer service', 'App reliability'],
          marketPosition: 'Strong regional player',
          differentiators: ['Local focus', 'Driver program']
        }
      ],
      targetAudience: {
        primarySegment: 'Urban professionals aged 25-45',
        demographics: ['$75K+ income', 'College educated', 'Urban/suburban'],
        psychographics: ['Health conscious', 'Time-sensitive', 'Tech-savvy'],
        painPoints: ['Limited healthy options', 'Unpredictable delivery times', 'Poor food quality'],
        desiredOutcomes: ['Convenient healthy meals', 'Reliable delivery', 'Good value']
      },
      businessModelElements: {
        revenueStreams: ['Delivery fees', 'Restaurant commissions', 'Premium subscriptions'],
        costStructure: ['Driver payments', 'Technology infrastructure', 'Customer acquisition'],
        keyActivities: ['Order processing', 'Delivery logistics', 'Quality assurance'],
        keyResources: ['Technology platform', 'Driver network', 'Restaurant partnerships'],
        channels: ['Mobile app', 'Website', 'Corporate partnerships'],
        customerRelationships: ['Self-service platform', 'Customer support', 'Loyalty programs']
      }
    };
  });

  describe('initialization', () => {
    it('should create generator instance', () => {
      expect(generator).toBeInstanceOf(ConceptDocumentGenerator);
    });
  });

  describe('generateBusinessConcept', () => {
    it('should generate complete business concept document', () => {
      const options: DocumentGenerationOptions = {
        format: 'markdown',
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true
      };

      const document = generator.generateBusinessConcept(mockSessionData, options);

      expect(document.title).toContain('food delivery');
      expect(document.format).toBe('markdown');
      expect(document.content).toContain('# Executive Summary');
      expect(document.sections).toHaveLength(10); // All sections included
      expect(document.metadata.pathway).toBe('NEW_IDEA');
      expect(document.metadata.wordCount).toBeGreaterThan(0);
    });

    it('should respect options for content inclusion', () => {
      const optionsNoNextSteps: DocumentGenerationOptions = {
        format: 'markdown',
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: false
      };

      const document = generator.generateBusinessConcept(mockSessionData, optionsNoNextSteps);
      const nextStepsSection = document.sections.find(s => s.id === 'next-steps');
      
      expect(nextStepsSection).toBeUndefined();
    });

    it('should generate HTML format correctly', () => {
      const options: DocumentGenerationOptions = {
        format: 'html',
        includeAnalysis: false,
        includeRecommendations: false,
        includeNextSteps: false
      };

      const document = generator.generateBusinessConcept(mockSessionData, options);

      expect(document.format).toBe('html');
      expect(document.content).toContain('<!DOCTYPE html>');
      expect(document.content).toContain('<h2>');
      expect(document.content).toContain('</body>');
    });

    it('should generate JSON format correctly', () => {
      const options: DocumentGenerationOptions = {
        format: 'json',
        includeAnalysis: false,
        includeRecommendations: false,
        includeNextSteps: false
      };

      const document = generator.generateBusinessConcept(mockSessionData, options);

      expect(document.format).toBe('json');
      expect(() => JSON.parse(document.content)).not.toThrow();
    });
  });

  describe('generateMarketAnalysisReport', () => {
    it('should generate market analysis report', () => {
      const document = generator.generateMarketAnalysisReport(mockSessionData);

      expect(document.title).toBe('Market Analysis Report');
      expect(document.sections.find(s => s.id === 'market-opportunities')).toBeDefined();
      expect(document.sections.find(s => s.id === 'competitive-landscape')).toBeDefined();
      expect(document.content).toContain('Urban professionals market segment');
      expect(document.content).toContain('UberEats');
    });

    it('should handle missing data gracefully', () => {
      const emptyData: NewIdeaPhaseData = {
        ideationInsights: [],
        marketOpportunities: [],
        uniqueValueProps: [],
        competitiveLandscape: []
      };

      const document = generator.generateMarketAnalysisReport(emptyData);

      expect(document.title).toBe('Market Analysis Report');
      expect(document.content).toContain('Market opportunities to be identified');
      expect(document.content).toContain('Competitive analysis to be conducted');
    });
  });

  describe('generateImplementationRoadmap', () => {
    it('should generate implementation roadmap', () => {
      const document = generator.generateImplementationRoadmap(mockSessionData);

      expect(document.title).toBe('Implementation Roadmap');
      expect(document.sections.find(s => s.id === 'immediate-actions')).toBeDefined();
      expect(document.sections.find(s => s.id === 'short-term-goals')).toBeDefined();
      expect(document.sections.find(s => s.id === 'long-term-vision')).toBeDefined();
      expect(document.content).toContain('Next 30 Days');
      expect(document.content).toContain('customer interviews');
    });
  });

  describe('content formatting', () => {
    it('should format target market correctly', () => {
      const formatted = (generator as any).formatTargetMarket(mockSessionData.targetAudience!);

      expect(formatted).toContain('**Primary Segment:**');
      expect(formatted).toContain('Urban professionals aged 25-45');
      expect(formatted).toContain('**Demographics:**');
      expect(formatted).toContain('$75K+ income');
      expect(formatted).toContain('**Pain Points:**');
    });

    it('should format business model correctly', () => {
      const formatted = (generator as any).formatBusinessModel(mockSessionData.businessModelElements!);

      expect(formatted).toContain('**Revenue Streams:**');
      expect(formatted).toContain('Delivery fees');
      expect(formatted).toContain('**Cost Structure:**');
      expect(formatted).toContain('Driver payments');
    });

    it('should format market opportunities correctly', () => {
      const formatted = (generator as any).formatMarketOpportunities(mockSessionData.marketOpportunities!);

      expect(formatted).toContain('**Urban professionals market segment**');
      expect(formatted).toContain('Market Size: Large ($50B+ globally)');
      expect(formatted).toContain('Growth Potential: high');
      expect(formatted).toContain('Confidence Level: 85%');
    });

    it('should format competitive landscape correctly', () => {
      const formatted = (generator as any).formatCompetitiveLandscape(mockSessionData.competitiveLandscape!);

      expect(formatted).toContain('**UberEats**');
      expect(formatted).toContain('Strengths: Large network, Brand recognition');
      expect(formatted).toContain('Weaknesses: Quality inconsistency');
    });
  });

  describe('content extraction', () => {
    it('should extract appropriate title from raw idea', () => {
      const title = (generator as any).extractTitle(mockSessionData);
      expect(title).toContain('food delivery');
    });

    it('should generate executive summary from session data', () => {
      const summary = (generator as any).generateExecutiveSummary(mockSessionData);
      expect(summary).toContain('market opportunity');
      expect(summary.length).toBeGreaterThan(20);
    });

    it('should extract problem statement from insights', () => {
      const problemStatement = (generator as any).extractProblemStatement(mockSessionData);
      expect(typeof problemStatement).toBe('string');
      expect(problemStatement.length).toBeGreaterThan(0);
    });

    it('should generate competitive advantage from value props', () => {
      const advantage = (generator as any).generateCompetitiveAdvantage(mockSessionData);
      expect(advantage).toContain('Premium quality ingredients');
    });
  });

  describe('document metadata', () => {
    it('should generate correct metadata', () => {
      const document = generator.generateBusinessConcept(mockSessionData);

      expect(document.metadata.generatedAt).toBeInstanceOf(Date);
      expect(document.metadata.pathway).toBe('NEW_IDEA');
      expect(document.metadata.version).toBe('1.0');
      expect(document.metadata.wordCount).toBeGreaterThan(0);
    });

    it('should count words correctly', () => {
      const text = 'This is a test document with ten words exactly.';
      const wordCount = (generator as any).countWords(text);
      expect(wordCount).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle empty session data', () => {
      const emptyData: NewIdeaPhaseData = {
        ideationInsights: [],
        marketOpportunities: [],
        uniqueValueProps: [],
        competitiveLandscape: []
      };

      const document = generator.generateBusinessConcept(emptyData);

      expect(document.title).toBe('New Business Concept');
      expect(document.sections).toHaveLength(8); // Fewer sections due to missing data
    });

    it('should handle missing optional data', () => {
      const minimalData: NewIdeaPhaseData = {
        ideationInsights: ['Single insight'],
        marketOpportunities: [],
        uniqueValueProps: [],
        competitiveLandscape: []
      };

      const document = generator.generateBusinessConcept(minimalData);

      expect(document.content).toContain('Single insight');
      expect(document.content).toContain('to be defined');
    });

    it('should generate default values when needed', () => {
      const defaultAudience = (generator as any).generateDefaultTargetAudience();
      expect(defaultAudience.primarySegment).toContain('To be defined');

      const defaultBusinessModel = (generator as any).generateDefaultBusinessModel();
      expect(defaultBusinessModel.revenueStreams[0]).toContain('to be determined');
    });
  });

  describe('document sections ordering', () => {
    it('should order sections correctly', () => {
      const document = generator.generateBusinessConcept(mockSessionData);
      const sectionOrder = document.sections.map(s => s.id);

      expect(sectionOrder.indexOf('executive-summary')).toBe(0);
      expect(sectionOrder.indexOf('problem-solution')).toBe(1);
      expect(sectionOrder.indexOf('value-proposition')).toBe(2);
    });
  });
});

describe('Factory Function', () => {
  it('should create generator instance', () => {
    const generator1 = createConceptDocumentGenerator();
    const generator2 = createConceptDocumentGenerator();
    
    expect(generator1).toBeInstanceOf(ConceptDocumentGenerator);
    expect(generator2).toBeInstanceOf(ConceptDocumentGenerator);
    expect(generator1).not.toBe(generator2);
  });
});