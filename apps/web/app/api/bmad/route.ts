import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sessionOrchestrator } from '@/lib/bmad/session-orchestrator';
import { pathwayRouter } from '@/lib/bmad/pathway-router';
import { bmadKnowledgeBase } from '@/lib/bmad/knowledge-base';
import { BmadDatabase } from '@/lib/bmad/database';
import { PathwayType, FeatureInputData, PriorityScoring } from '@/lib/bmad/types';
import {
  validateFeatureInput,
  createFeatureAnalysisPrompt,
  analyzeFeatureInput,
  generateAnalysisId
} from '@/lib/bmad/pathways/feature-input';
import {
  selectBestQuestions,
  getFallbackQuestions,
  validateQuestions
} from '@/lib/bmad/analysis/feature-questions';
import {
  calculatePriority,
  validatePriorityScoring,
  getPriorityRecommendations,
  analyzePriority
} from '@/lib/bmad/pathways/priority-scoring';

/**
 * BMad Method API Endpoints
 * Handles all BMad Method session management and strategic workflows
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Allow test access from test pages
    const referer = request.headers.get('referer') || '';
    const isTestRequest = referer.includes('/test-bmad-buttons');
    
    if ((authError || !user) && !isTestRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Enable test mode for database operations when in test
    if (isTestRequest) {
      (global as { BMAD_TEST_MODE?: boolean }).BMAD_TEST_MODE = true;
    }
    
    // Use test user ID for test requests
    const userId = user?.id || 'test-user-id';

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'analyze_intent':
        return await handleAnalyzeIntent(params);
        
      case 'create_session':
        return await handleCreateSession(userId, params);
        
      case 'advance_session':
        return await handleAdvanceSession(params);
        
      case 'get_session':
        return await handleGetSession(params);
        
      case 'search_knowledge':
        return await handleSearchKnowledge(params);
        
      case 'get_user_sessions':
        return await handleGetUserSessions(userId, params);

      case 'analyze_feature_input':
        return await handleAnalyzeFeatureInput(params);

      case 'save_feature_input':
        return await handleSaveFeatureInput(userId, params);

      case 'calculate_priority':
        return await handleCalculatePriority(params);

      case 'save_priority_scoring':
        return await handleSavePriorityScoring(userId, params);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('BMad API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Allow test access from test pages
    const referer = request.headers.get('referer') || '';
    const isTestRequest = referer.includes('/test-bmad-buttons');
    
    if ((authError || !user) && !isTestRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Enable test mode for database operations when in test
    if (isTestRequest) {
      (global as { BMAD_TEST_MODE?: boolean }).BMAD_TEST_MODE = true;
    }
    
    // Use test user ID for test requests
    const userId = user?.id || 'test-user-id';

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'pathways':
        return await handleGetPathways();
        
      case 'knowledge':
        const query = searchParams.get('query') || '';
        return await handleSearchKnowledge({ query });
        
      case 'sessions':
        const workspaceId = searchParams.get('workspaceId') || undefined;
        return await handleGetUserSessions(userId, { workspaceId });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('BMad API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Analyze user intent and recommend pathway
 */
async function handleAnalyzeIntent(params: { userInput: string }) {
  const { userInput } = params;
  
  if (!userInput) {
    return NextResponse.json({ error: 'userInput is required' }, { status: 400 });
  }

  const pathwayRecommendation = await pathwayRouter.analyzeUserIntent(userInput);
  
  // Transform PathwayRecommendation to expected format
  const recommendation = {
    recommendedPathway: pathwayRecommendation.primary,
    confidence: pathwayRecommendation.confidence,
    reasoning: pathwayRecommendation.reasoning,
    alternativePathways: pathwayRecommendation.alternatives.map(alt => alt.pathway)
  };
  
  return NextResponse.json({
    success: true,
    data: {
      recommendation,
      availablePathways: pathwayRouter.getAllPathways()
    }
  });
}

/**
 * Create new BMad Method session
 */
async function handleCreateSession(
  userId: string, 
  params: { 
    workspaceId: string; 
    pathway: PathwayType; 
    initialContext?: Record<string, unknown>;
  }
) {
  const { workspaceId, pathway, initialContext } = params;
  
  if (!workspaceId || !pathway) {
    return NextResponse.json(
      { error: 'workspaceId and pathway are required' }, 
      { status: 400 }
    );
  }

  const session = await sessionOrchestrator.createSession({
    userId,
    workspaceId,
    pathway,
    initialContext
  });

  // Record pathway analytics if we have user input from initial context
  if (initialContext?.userInput && initialContext?.recommendation) {
    try {
      await BmadDatabase.recordPathwayAnalytics(
        userId,
        workspaceId,
        initialContext.userInput as string,
        (initialContext.recommendation as {
          recommendedPathway: PathwayType;
          confidence: number;
          reasoning: string;
          alternativePathways: PathwayType[];
        }).recommendedPathway,
        pathway,
        (initialContext.recommendation as {
          confidence: number;
        }).confidence,
        (initialContext.recommendation as {
          reasoning: string;
        }).reasoning,
        (initialContext.recommendation as {
          alternativePathways: PathwayType[];
        }).alternativePathways,
        session.id
      );
    } catch (error) {
      // Don't fail session creation if analytics fail
      console.error('Failed to record pathway analytics:', error);
    }
  }

  return NextResponse.json({
    success: true,
    data: { session }
  });
}

/**
 * Advance session with user input
 */
async function handleAdvanceSession(
  params: { 
    sessionId: string; 
    userInput: string;
  }
) {
  const { sessionId, userInput } = params;
  
  if (!sessionId || !userInput) {
    return NextResponse.json(
      { error: 'sessionId and userInput are required' }, 
      { status: 400 }
    );
  }

  const advancement = await sessionOrchestrator.advanceSession(sessionId, userInput);

  return NextResponse.json({
    success: true,
    data: advancement
  });
}

/**
 * Get session by ID
 */
async function handleGetSession(params: { sessionId: string }) {
  const { sessionId } = params;
  
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const session = await sessionOrchestrator.getSession(sessionId);
  
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: { session }
  });
}

/**
 * Search knowledge base
 */
async function handleSearchKnowledge(
  params: { 
    query: string;
    type?: 'framework' | 'technique' | 'template' | 'case_study';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    phaseId?: string;
  }
) {
  const { query, type, difficulty, phaseId } = params;
  
  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  let results;
  
  if (phaseId) {
    results = await bmadKnowledgeBase.getPhaseKnowledge(phaseId);
  } else {
    results = await bmadKnowledgeBase.searchKnowledge(query, {
      type,
      difficulty
    });
  }

  return NextResponse.json({
    success: true,
    data: { results }
  });
}

/**
 * Get user sessions
 */
async function handleGetUserSessions(
  userId: string,
  params: { 
    workspaceId?: string;
    status?: 'active' | 'paused' | 'completed' | 'abandoned';
  }
) {
  const { workspaceId, status } = params;

  const sessions = await BmadDatabase.getUserSessions(userId, workspaceId, status);

  return NextResponse.json({
    success: true,
    data: { sessions }
  });
}

/**
 * Get all available pathways
 */
async function handleGetPathways() {
  const pathways = pathwayRouter.getAllPathways();

  return NextResponse.json({
    success: true,
    data: { pathways }
  });
}

/**
 * Analyze feature input and generate validation questions
 */
async function handleAnalyzeFeatureInput(params: { featureData: FeatureInputData }) {
  const { featureData } = params;

  if (!featureData) {
    return NextResponse.json({ error: 'featureData is required' }, { status: 400 });
  }

  // Validate the input
  const validation = validateFeatureInput(featureData);
  if (!validation.isValid) {
    return NextResponse.json({
      error: 'Invalid feature input',
      details: validation.errors
    }, { status: 400 });
  }

  try {
    // Generate analysis ID
    const analysisId = generateAnalysisId();

    // Analyze the feature for insights
    const insights = analyzeFeatureInput(featureData);

    // Generate questions using AI fallback if needed
    let questions: string[] = [];

    try {
      // Try to use the best question selection logic
      questions = selectBestQuestions(featureData, 4);
    } catch (error) {
      console.warn('Question generation failed, using fallback:', error);
      questions = getFallbackQuestions(featureData);
    }

    // Validate the generated questions
    const questionValidation = validateQuestions(questions);
    if (!questionValidation.isValid) {
      console.warn('Question validation issues:', questionValidation.issues);
      // Use fallback questions if validation fails
      questions = getFallbackQuestions(featureData);
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis_id: analysisId,
        questions,
        insights,
        validation: {
          warnings: validation.warnings
        }
      }
    });

  } catch (error) {
    console.error('Feature analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json(
      { error: 'Feature analysis failed', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Save feature input data
 */
async function handleSaveFeatureInput(
  userId: string,
  params: {
    sessionId: string;
    featureData: FeatureInputData;
    analysisId?: string;
  }
) {
  const { sessionId, featureData, analysisId } = params;

  if (!sessionId || !featureData) {
    return NextResponse.json(
      { error: 'sessionId and featureData are required' },
      { status: 400 }
    );
  }

  // Validate the input
  const validation = validateFeatureInput(featureData);
  if (!validation.isValid) {
    return NextResponse.json({
      error: 'Invalid feature input',
      details: validation.errors
    }, { status: 400 });
  }

  try {
    // Save feature input data to bmad_user_responses table
    await BmadDatabase.recordUserResponse(
      sessionId,
      'feature-input',
      'feature-input-form',
      {
        data: {
          ...featureData,
          analysis_id: analysisId || generateAnalysisId(),
          saved_at: new Date().toISOString(),
          validation_warnings: validation.warnings
        }
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        saved: true,
        session_id: sessionId,
        analysis_id: analysisId || generateAnalysisId(),
        timestamp: new Date().toISOString(),
        validation: {
          warnings: validation.warnings
        }
      }
    });

  } catch (error) {
    console.error('Save feature input error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Save failed';
    return NextResponse.json(
      { error: 'Failed to save feature input', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Calculate priority score for a feature
 */
async function handleCalculatePriority(params: {
  effort_score: number;
  impact_score: number;
  session_id?: string;
}) {
  const { effort_score, impact_score, session_id } = params;

  if (effort_score === undefined || impact_score === undefined) {
    return NextResponse.json(
      { error: 'effort_score and impact_score are required' },
      { status: 400 }
    );
  }

  try {
    // Validate scoring inputs
    const validation = validatePriorityScoring({ effort_score, impact_score });
    if (validation.length > 0) {
      return NextResponse.json({
        error: 'Invalid priority scoring inputs',
        details: validation
      }, { status: 400 });
    }

    // Calculate priority
    const priorityScoring = calculatePriority(impact_score, effort_score);
    const recommendations = getPriorityRecommendations(priorityScoring.quadrant);
    const analysis = analyzePriority(impact_score, effort_score);

    return NextResponse.json({
      success: true,
      data: {
        priority_score: priorityScoring.calculated_priority,
        category: priorityScoring.priority_category,
        quadrant: priorityScoring.quadrant,
        recommendations,
        analysis,
        scoring: priorityScoring
      }
    });

  } catch (error) {
    console.error('Priority calculation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Calculation failed';
    return NextResponse.json(
      { error: 'Priority calculation failed', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Save priority scoring data to session
 */
async function handleSavePriorityScoring(
  userId: string,
  params: {
    sessionId: string;
    priorityScoring: PriorityScoring;
  }
) {
  const { sessionId, priorityScoring } = params;

  if (!sessionId || !priorityScoring) {
    return NextResponse.json(
      { error: 'sessionId and priorityScoring are required' },
      { status: 400 }
    );
  }

  try {
    // Validate priority scoring data
    const validation = validatePriorityScoring(priorityScoring);
    if (validation.length > 0) {
      return NextResponse.json({
        error: 'Invalid priority scoring data',
        details: validation
      }, { status: 400 });
    }

    // Save priority scoring data to bmad_user_responses table
    await BmadDatabase.recordUserResponse(
      sessionId,
      'priority-scoring',
      'priority-scoring-form',
      {
        data: {
          ...priorityScoring,
          saved_at: new Date().toISOString()
        }
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        saved: true,
        session_id: sessionId,
        priority_scoring: priorityScoring,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Save priority scoring error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Save failed';
    return NextResponse.json(
      { error: 'Failed to save priority scoring', details: errorMessage },
      { status: 500 }
    );
  }
}