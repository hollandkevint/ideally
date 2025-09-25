import { MaryPersona, maryPersona, type CoachingContext } from '@/lib/ai/mary-persona';

describe('MaryPersona', () => {
  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MaryPersona.getInstance();
      const instance2 = MaryPersona.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateSystemPrompt', () => {
    it('should generate basic system prompt without context', () => {
      const prompt = maryPersona.generateSystemPrompt();
      
      expect(prompt).toContain('Mary');
      expect(prompt).toContain('AI Business Strategist');
      expect(prompt).toContain('PERSONALITY & APPROACH');
      expect(prompt).toContain('STRATEGIC EXPERTISE');
      expect(prompt).toContain('CONVERSATION APPROACH');
      expect(prompt).toContain('BMAD METHOD INTEGRATION');
    });

    it('should adapt persona based on user experience level', () => {
      const beginnerContext: CoachingContext = {
        userProfile: { experienceLevel: 'beginner' }
      };
      
      const expertContext: CoachingContext = {
        userProfile: { experienceLevel: 'expert' }
      };

      const beginnerPrompt = maryPersona.generateSystemPrompt(beginnerContext);
      const expertPrompt = maryPersona.generateSystemPrompt(expertContext);

      expect(beginnerPrompt).toContain('supportive');
      expect(expertPrompt).toContain('challenging');
    });

    it('should include workspace context when provided', () => {
      const context: CoachingContext = {
        workspaceId: 'workspace-123',
        userProfile: {
          experienceLevel: 'intermediate',
          industry: 'Technology',
          role: 'Product Manager'
        }
      };

      const prompt = maryPersona.generateSystemPrompt(context);
      
      expect(prompt).toContain('workspace-123');
      expect(prompt).toContain('Technology');
      expect(prompt).toContain('Product Manager');
    });

    it('should include BMad session context when active', () => {
      const context: CoachingContext = {
        currentBmadSession: {
          pathway: 'business-model',
          phase: 'analysis',
          progress: 65
        }
      };

      const prompt = maryPersona.generateSystemPrompt(context);
      
      expect(prompt).toContain('business-model');
      expect(prompt).toContain('analysis');
      expect(prompt).toContain('65%');
    });

    it('should adapt conversation style based on BMad phase', () => {
      const analysisContext: CoachingContext = {
        currentBmadSession: {
          pathway: 'new-idea',
          phase: 'analysis',
          progress: 50
        }
      };

      const ideationContext: CoachingContext = {
        currentBmadSession: {
          pathway: 'new-idea',
          phase: 'ideation',
          progress: 30
        }
      };

      const analysisPrompt = maryPersona.generateSystemPrompt(analysisContext);
      const ideationPrompt = maryPersona.generateSystemPrompt(ideationContext);

      expect(analysisPrompt).toContain('detailed');
      expect(ideationPrompt).toContain('moderate');
    });
  });

  describe('generateQuickActions', () => {
    it('should return default actions without context', () => {
      const actions = maryPersona.generateQuickActions();
      
      expect(actions).toContain('Challenge my assumptions');
      expect(actions).toContain('Explore alternative approaches');
      expect(actions).toContain('Identify potential risks');
      expect(actions).toHaveLength(5);
    });

    it('should return phase-specific actions for discovery phase', () => {
      const context: CoachingContext = {
        currentBmadSession: {
          pathway: 'new-idea',
          phase: 'discovery',
          progress: 20
        }
      };

      const actions = maryPersona.generateQuickActions(context);
      
      expect(actions).toContain('Help me dig deeper');
      expect(actions).toContain('What am I missing?');
      expect(actions).toContain('Challenge my assumptions');
    });

    it('should return phase-specific actions for analysis phase', () => {
      const context: CoachingContext = {
        currentBmadSession: {
          pathway: 'business-model',
          phase: 'analysis',
          progress: 60
        }
      };

      const actions = maryPersona.generateQuickActions(context);
      
      expect(actions).toContain('Validate this approach');
      expect(actions).toContain('What are the risks?');
      expect(actions).toContain('Compare alternatives');
    });

    it('should return phase-specific actions for planning phase', () => {
      const context: CoachingContext = {
        currentBmadSession: {
          pathway: 'strategic-optimization',
          phase: 'planning',
          progress: 80
        }
      };

      const actions = maryPersona.generateQuickActions(context);
      
      expect(actions).toContain('Help me prioritize');
      expect(actions).toContain('What\'s my next step?');
      expect(actions).toContain('How do I measure success?');
    });
  });

  describe('persona adaptation', () => {
    it('should maintain professional tone across all contexts', () => {
      const contexts: CoachingContext[] = [
        { userProfile: { experienceLevel: 'beginner' } },
        { userProfile: { experienceLevel: 'expert' } },
        { currentBmadSession: { pathway: 'new-idea', phase: 'discovery', progress: 10 } },
        { currentBmadSession: { pathway: 'business-model', phase: 'planning', progress: 90 } }
      ];

      contexts.forEach(context => {
        const prompt = maryPersona.generateSystemPrompt(context);
        expect(prompt).toContain('professional');
        expect(prompt).toContain('actionable');
        expect(prompt).toContain('strategic');
      });
    });

    it('should include formatting guidelines in all prompts', () => {
      const prompt = maryPersona.generateSystemPrompt();
      
      expect(prompt).toContain('FORMATTING GUIDELINES');
      expect(prompt).toContain('markdown');
      expect(prompt).toContain('**bold**');
      expect(prompt).toContain('bullet points');
    });
  });
});