'use client';

import React, { useState, useEffect } from 'react';
import { NewIdeaPathway as NewIdeaPathwayLogic, createNewIdeaPathway } from '@/lib/bmad/pathways/new-idea-pathway';
import { NEW_IDEA_PHASES } from '@/lib/bmad/templates/new-idea-templates';
import { PathwayType } from '@/lib/bmad/types';
import IdeationPhase from './IdeationPhase';
import MarketExploration from './MarketExploration';
import PhaseProgress from './PhaseProgress';
import ConceptDocument from './ConceptDocument';

interface NewIdeaPathwayProps {
  sessionId?: string;
  onSessionComplete?: (sessionData: any) => void;
  onError?: (error: string) => void;
}

export default function NewIdeaPathway({
  sessionId,
  onSessionComplete,
  onError
}: NewIdeaPathwayProps) {
  const [pathway, setPathway] = useState<NewIdeaPathwayLogic | null>(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [businessConcept, setBusinessConcept] = useState(null);

  // Initialize pathway
  useEffect(() => {
    const newPathway = createNewIdeaPathway();
    newPathway.startPhase();
    setPathway(newPathway);
  }, []);

  const handlePhaseAdvancement = async (phaseData: any) => {
    if (!pathway) return;

    setIsLoading(true);
    try {
      // Update session data
      pathway.updateSessionData(phaseData);

      // Complete current phase
      const { canAdvance } = pathway.completeCurrentPhase();

      if (canAdvance) {
        // Advance to next phase
        const advancement = pathway.advanceToNextPhase();

        if (advancement.success && advancement.nextPhase) {
          setCurrentPhase(prev => prev + 1);
        } else if (advancement.success && !advancement.nextPhase) {
          // Session complete
          await handleSessionCompletion();
        }
      }
    } catch (error) {
      console.error('Phase advancement error:', error);
      onError?.('Failed to advance to next phase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionCompletion = async () => {
    if (!pathway) return;

    try {
      const sessionSummary = pathway.getSessionSummary();
      const sessionData = pathway.getSessionData();

      // Generate business concept document
      const concept = {
        title: sessionData.rawIdea || 'New Business Concept',
        executiveSummary: sessionData.ideationInsights.join(' '),
        problemStatement: 'Problem identified during ideation phase',
        solution: sessionData.rawIdea || 'Solution concept',
        valueProposition: sessionData.uniqueValueProps.join(', '),
        targetMarket: sessionData.marketOpportunities[0]?.description || 'Market analysis pending',
        marketOpportunities: sessionData.marketOpportunities,
        businessModel: sessionData.businessModelElements || {},
        competitiveAdvantage: sessionData.competitiveLandscape.map(c => c.name).join(', '),
        nextSteps: ['Conduct customer interviews', 'Build MVP', 'Validate market fit']
      };

      setBusinessConcept(concept);
      setSessionComplete(true);
      onSessionComplete?.(sessionSummary);

    } catch (error) {
      console.error('Session completion error:', error);
      onError?.('Failed to complete session');
    }
  };

  const renderCurrentPhase = () => {
    if (!pathway) return null;

    const phaseConfig = NEW_IDEA_PHASES[currentPhase];
    const sessionData = pathway.getSessionData();

    switch (phaseConfig.id) {
      case 'ideation':
        return (
          <IdeationPhase
            sessionData={sessionData}
            onPhaseComplete={handlePhaseAdvancement}
            isLoading={isLoading}
          />
        );

      case 'market_exploration':
        return (
          <MarketExploration
            sessionData={sessionData}
            onPhaseComplete={handlePhaseAdvancement}
            isLoading={isLoading}
          />
        );

      case 'concept_refinement':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">
                Business Concept Refinement
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What unique value does your solution provide?
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Describe your unique value proposition..."
                    onChange={(e) => {
                      const valueProps = e.target.value.split('.').filter(v => v.trim());
                      handlePhaseAdvancement({ uniqueValueProps: valueProps });
                    }}
                  />
                </div>
                <button
                  onClick={() => handlePhaseAdvancement({
                    uniqueValueProps: ['Comprehensive solution', 'Market-validated approach']
                  })}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Continue to Positioning'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'positioning':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-green-900 mb-4">
                Strategic Positioning
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next steps for your business concept:
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    rows={4}
                    placeholder="What are your next concrete steps?"
                    onChange={(e) => {
                      const steps = e.target.value.split('.').filter(s => s.trim());
                      handlePhaseAdvancement({
                        businessModelElements: {
                          revenueStreams: ['Primary revenue stream'],
                          costStructure: [],
                          keyActivities: [],
                          keyResources: [],
                          channels: [],
                          customerRelationships: []
                        }
                      });
                    }}
                  />
                </div>
                <button
                  onClick={() => handlePhaseAdvancement({
                    businessModelElements: {
                      revenueStreams: ['Subscription model'],
                      costStructure: ['Development costs'],
                      keyActivities: ['Product development'],
                      keyResources: ['Technology platform'],
                      channels: ['Direct sales'],
                      customerRelationships: ['Self-service']
                    }
                  })}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Completing Session...' : 'Complete Pathway'}
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown phase</div>;
    }
  };

  if (sessionComplete && businessConcept) {
    return (
      <div className="space-y-6">
        <div className="text-center py-6">
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            🎉 Pathway Complete!
          </h2>
          <p className="text-gray-600">
            Your business concept has been developed and documented.
          </p>
        </div>
        <ConceptDocument
          concept={businessConcept}
          onExport={() => {
            // Export functionality
            const blob = new Blob([JSON.stringify(businessConcept, null, 2)], {
              type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'business-concept.json';
            a.click();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="new-idea-pathway">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="pathway-title">
          New Idea Creative Expansion
        </h1>
        <p className="text-lg text-gray-600">
          Transform your raw business idea into a structured opportunity
        </p>
      </div>

      {/* Progress Tracking */}
      {pathway && (
        <PhaseProgress
          pathway={pathway}
          currentPhaseIndex={currentPhase}
        />
      )}

      {/* Current Phase */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900" data-testid="current-phase">
            {NEW_IDEA_PHASES[currentPhase]?.name || 'Loading...'}
          </h2>
          <div className="text-sm text-gray-500" data-testid="phase-timer">
            {pathway && `${Math.ceil(pathway.getRemainingPhaseTime() / (60 * 1000))} min remaining`}
          </div>
        </div>

        {renderCurrentPhase()}
      </div>

      {/* Session Timer */}
      {pathway && (
        <div className="text-center text-sm text-gray-500" data-testid="total-session-timer">
          Total session time remaining: {Math.ceil(pathway.getRemainingTime() / (60 * 1000))} minutes
        </div>
      )}
    </div>
  );
}