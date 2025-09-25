import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { 
  MarketPositioningAnalyzer, 
  createMarketPositioningAnalyzer,
  type AnalysisRequest,
  type AnalysisResponse 
} from '../../../lib/bmad/analysis/market-positioning';

// Mock fetch globally
global.fetch = vi.fn() as Mock;

describe('MarketPositioningAnalyzer', () => {
  let analyzer: MarketPositioningAnalyzer;
  let mockFetch: Mock;

  beforeEach(() => {
    analyzer = createMarketPositioningAnalyzer();
    mockFetch = global.fetch as Mock;
    mockFetch.mockClear();
  });

  describe('initialization', () => {
    it('should create analyzer with default base URL', () => {
      expect(analyzer).toBeInstanceOf(MarketPositioningAnalyzer);
    });

    it('should create analyzer with custom base URL', () => {
      const customAnalyzer = new MarketPositioningAnalyzer('https://custom.api.com');
      expect(customAnalyzer).toBeInstanceOf(MarketPositioningAnalyzer);
    });
  });

  describe('analyzeIdeation', () => {
    const mockRequest: AnalysisRequest = {
      phase: 'ideation',
      userInput: 'I want to build a food delivery app',
      sessionData: {
        ideationInsights: [],
        marketOpportunities: [],
        uniqueValueProps: [],
        competitiveLandscape: []
      }
    };

    it('should analyze ideation phase successfully', async () => {
      const mockResponse = {
        insights: ['Strong market potential', 'Clear problem definition'],
        recommendations: ['Research competitors', 'Define target market'],
        questions: ['Who is your target customer?'],
        confidence: 0.8
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analysis: JSON.stringify(mockResponse) })
      });

      const result = await analyzer.analyzeIdeation(mockRequest);
      
      expect(result.insights).toHaveLength(2);
      expect(result.recommendations).toHaveLength(2);
      expect(result.confidence).toBe(0.8);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      });

      await expect(analyzer.analyzeIdeation(mockRequest)).rejects.toThrow('Analysis API call failed: Internal Server Error');
    });

    it('should build correct ideation prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analysis: '{}' })
      });

      await analyzer.analyzeIdeation(mockRequest);
      
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(requestBody.action).toBe('analyze_new_idea');
      expect(requestBody.data.phase).toBe('ideation');
      expect(requestBody.data.messages).toHaveLength(2);
      expect(requestBody.data.messages[0].role).toBe('system');
      expect(requestBody.data.messages[1].role).toBe('user');
    });
  });

  describe('analyzeMarketExploration', () => {
    const mockRequest: AnalysisRequest = {
      phase: 'market_exploration',
      userInput: 'Target market is busy professionals',
      sessionData: {
        ideationInsights: ['Previous insights'],
        marketOpportunities: [],
        uniqueValueProps: [],
        competitiveLandscape: []
      }
    };

    it('should analyze market exploration successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          analysis: JSON.stringify({
            insights: ['Large addressable market', 'Growing segment'],
            recommendations: ['Focus on urban areas', 'Premium pricing strategy'],
            questions: ['What is the market size?'],
            confidence: 0.75
          })
        })
      });

      const result = await analyzer.analyzeMarketExploration(mockRequest);
      
      expect(result.insights).toContain('Large addressable market');
      expect(result.recommendations).toContain('Focus on urban areas');
      expect(result.confidence).toBe(0.75);
    });
  });

  describe('analyzeConceptRefinement', () => {
    const mockRequest: AnalysisRequest = {
      phase: 'concept_refinement',
      userInput: 'Revenue model will be subscription-based',
      sessionData: {
        ideationInsights: [],
        marketOpportunities: [
          {
            id: '1',
            description: 'Urban professionals market',
            marketSize: 'Large',
            growthPotential: 'high',
            confidence: 0.8,
            insights: ['High demand']
          }
        ],
        uniqueValueProps: [],
        competitiveLandscape: []
      }
    };

    it('should analyze concept refinement successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          analysis: JSON.stringify({
            insights: ['Strong revenue model', 'Scalable approach'],
            recommendations: ['Start with freemium', 'Focus on retention'],
            questions: ['What is customer LTV?'],
            confidence: 0.85
          })
        })
      });

      const result = await analyzer.analyzeConceptRefinement(mockRequest);
      
      expect(result.insights).toContain('Strong revenue model');
      expect(result.recommendations).toContain('Start with freemium');
    });
  });

  describe('analyzePositioning', () => {
    const mockRequest: AnalysisRequest = {
      phase: 'positioning',
      userInput: 'Positioning as premium convenience service',
      sessionData: {
        ideationInsights: [],
        marketOpportunities: [],
        uniqueValueProps: ['Fast delivery', 'High quality'],
        competitiveLandscape: [
          {
            name: 'Competitor A',
            strengths: ['Large network'],
            weaknesses: ['Poor quality'],
            marketPosition: 'Mass market',
            differentiators: []
          }
        ]
      }
    };

    it('should analyze positioning successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          analysis: JSON.stringify({
            insights: ['Clear differentiation', 'Premium positioning viable'],
            recommendations: ['Focus on quality messaging', 'Target affluent customers'],
            questions: ['How will you communicate quality?'],
            confidence: 0.9
          })
        })
      });

      const result = await analyzer.analyzePositioning(mockRequest);
      
      expect(result.insights).toContain('Clear differentiation');
      expect(result.confidence).toBe(0.9);
    });
  });

  describe('response parsing', () => {
    it('should parse JSON response correctly', async () => {
      const mockJsonResponse = {
        insights: ['Insight 1', 'Insight 2'],
        recommendations: ['Rec 1'],
        questions: ['Question 1'],
        confidence: 0.8
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analysis: JSON.stringify(mockJsonResponse) })
      });

      const result = await analyzer.analyzeIdeation({
        phase: 'ideation',
        userInput: 'test',
        sessionData: {
          ideationInsights: [],
          marketOpportunities: [],
          uniqueValueProps: [],
          competitiveLandscape: []
        }
      });
      
      expect(result).toEqual(mockJsonResponse);
    });

    it('should parse text response when JSON parsing fails', async () => {
      const textResponse = `
        Insights:
        - Market shows strong potential
        - Competition is fragmented
        
        Recommendations:
        - Conduct customer interviews
        - Research pricing models
        
        Questions:
        - What is your target market size?
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analysis: textResponse })
      });

      const result = await analyzer.analyzeIdeation({
        phase: 'ideation',
        userInput: 'test',
        sessionData: {
          ideationInsights: [],
          marketOpportunities: [],
          uniqueValueProps: [],
          competitiveLandscape: []
        }
      });
      
      expect(result.confidence).toBe(0.7); // Default for text parsing
      expect(result.insights.length).toBeGreaterThan(0);
    });
  });

  describe('data generation', () => {
    it('should generate market opportunities from analysis', () => {
      const analysisResponse: AnalysisResponse = {
        insights: ['Large market potential', 'Growing demand'],
        recommendations: ['Focus on quality'],
        questions: ['What is the size?'],
        confidence: 0.8
      };

      const opportunities = analyzer.generateMarketOpportunities(analysisResponse);
      
      expect(opportunities).toHaveLength(2);
      expect(opportunities[0].description).toBe('Large market potential');
      expect(opportunities[0].confidence).toBe(0.8);
      expect(opportunities[0].growthPotential).toBe('medium');
    });

    it('should generate competitor analysis from insights', () => {
      const analysisResponse: AnalysisResponse = {
        insights: ['Strong competition exists'],
        recommendations: ['Competitor A has weak customer service', 'Alternative solutions are expensive'],
        questions: [],
        confidence: 0.7
      };

      const competitors = analyzer.generateCompetitorAnalysis(analysisResponse);
      
      expect(competitors).toHaveLength(2);
      expect(competitors[0].name).toBe('Competitor 1');
      expect(competitors[1].marketPosition).toContain('Alternative solutions are expensive');
    });
  });

  describe('elicitation focus', () => {
    it('should get correct focus description for ideation phase', () => {
      const focus = (analyzer as any).getElicitationFocus(1, 'ideation');
      expect(focus).toBe('Problem validation - Is this a real problem worth solving?');
    });

    it('should get correct focus description for market exploration', () => {
      const focus = (analyzer as any).getElicitationFocus(2, 'market_exploration');
      expect(focus).toBe('Competitive landscape - Map existing solutions');
    });

    it('should return general analysis for unknown choices', () => {
      const focus = (analyzer as any).getElicitationFocus(99, 'unknown_phase');
      expect(focus).toBe('General analysis');
    });
  });
});

describe('Factory Function', () => {
  it('should create analyzer instance', () => {
    const analyzer1 = createMarketPositioningAnalyzer();
    const analyzer2 = createMarketPositioningAnalyzer('/custom/api');
    
    expect(analyzer1).toBeInstanceOf(MarketPositioningAnalyzer);
    expect(analyzer2).toBeInstanceOf(MarketPositioningAnalyzer);
    expect(analyzer1).not.toBe(analyzer2);
  });
});