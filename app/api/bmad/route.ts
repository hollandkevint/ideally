import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sessionOrchestrator } from '@/lib/bmad/session-orchestrator';
import { pathwayRouter } from '@/lib/bmad/pathway-router';
import { bmadKnowledgeBase } from '@/lib/bmad/knowledge-base';
import { BmadDatabase } from '@/lib/bmad/database';
import { PathwayType } from '@/lib/bmad/types';

/**
 * BMad Method API Endpoints
 * Handles all BMad Method session management and strategic workflows
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'analyze_intent':
        return await handleAnalyzeIntent(params);
        
      case 'create_session':
        return await handleCreateSession(user.id, params);
        
      case 'advance_session':
        return await handleAdvanceSession(params);
        
      case 'get_session':
        return await handleGetSession(params);
        
      case 'search_knowledge':
        return await handleSearchKnowledge(params);
        
      case 'get_user_sessions':
        return await handleGetUserSessions(user.id, params);

      case 'analyze_new_idea':
        return await handleAnalyzeNewIdea(params);

      case 'generate_concept_document':
        return await handleGenerateConceptDocument(params);

      case 'complete_session':
        return await handleCompleteSession(params);

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
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'pathways':
        return await handleGetPathways();
        
      case 'knowledge':
        const query = searchParams.get('query') || '';
        if (!query.trim()) {
          return NextResponse.json(
            { 
              error: 'Knowledge search failed: Missing query parameter',
              code: 'MISSING_QUERY',
              details: 'query parameter is required for knowledge search'
            }, 
            { status: 400 }
          );
        }
        return await handleSearchKnowledge({ query });
        
      case 'sessions':
        const workspaceId = searchParams.get('workspaceId') || undefined;
        const status = searchParams.get('status') as 'active' | 'paused' | 'completed' | 'abandoned' | undefined;
        
        // Validate status parameter if provided
        if (status && !['active', 'paused', 'completed', 'abandoned'].includes(status)) {
          return NextResponse.json(
            {
              error: 'Session retrieval failed: Invalid status parameter',
              code: 'INVALID_STATUS',
              details: 'status must be one of: active, paused, completed, abandoned'
            },
            { status: 400 }
          );
        }
        
        return await handleGetUserSessions(user.id, { workspaceId, status });

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
    return NextResponse.json(
      { 
        error: 'Intent analysis failed: Missing userInput parameter',
        code: 'MISSING_USER_INPUT',
        details: 'userInput is required for intent analysis'
      }, 
      { status: 400 }
    );
  }

  try {
    const pathwayRecommendation = await pathwayRouter.analyzeUserIntent(userInput);
    
    // Transform recommendation to match PathwaySelector interface expectations
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
  } catch (error) {
    console.error('Intent analysis error:', error);
    
    return NextResponse.json(
      {
        error: 'Intent analysis failed: Processing error',
        code: 'INTENT_ANALYSIS_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
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
      { 
        error: 'Session creation failed: Missing required parameters',
        code: 'MISSING_PARAMETERS',
        details: 'workspaceId and pathway are required' 
      }, 
      { status: 400 }
    );
  }

  try {
    const session = await sessionOrchestrator.createSession({
      userId,
      workspaceId,
      pathway,
      initialContext
    });

    return NextResponse.json({
      success: true,
      data: { session }
    });
  } catch (error) {
    console.error('Session creation error:', error);
    
    // Return specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('auth')) {
        return NextResponse.json(
          {
            error: 'Session creation failed: User not authenticated',
            code: 'AUTH_REQUIRED',
            details: 'Valid authentication token required for session creation'
          },
          { status: 401 }
        );
      }
      
      if (error.message.includes('pathway')) {
        return NextResponse.json(
          {
            error: 'Session creation failed: Invalid pathway type',
            code: 'INVALID_PATHWAY', 
            details: 'Pathway must be one of: new-idea, business-model, strategic-optimization'
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        {
          error: 'Session creation failed: Database error',
          code: 'DB_ERROR',
          details: error.message
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Session creation failed: Unknown error',
        code: 'UNKNOWN_ERROR',
        details: 'An unexpected error occurred during session creation'
      },
      { status: 500 }
    );
  }
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
      { 
        error: 'Session advancement failed: Missing required parameters',
        code: 'MISSING_PARAMETERS',
        details: 'sessionId and userInput are required'
      }, 
      { status: 400 }
    );
  }

  try {
    const advancement = await sessionOrchestrator.advanceSession(sessionId, userInput);

    return NextResponse.json({
      success: true,
      data: advancement
    });
  } catch (error) {
    console.error('Session advancement error:', error);
    
    return NextResponse.json(
      {
        error: 'Session advancement failed: Processing error',
        code: 'SESSION_ADVANCEMENT_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * Get session by ID
 */
async function handleGetSession(params: { sessionId: string }) {
  const { sessionId } = params;
  
  if (!sessionId) {
    return NextResponse.json(
      { 
        error: 'Session retrieval failed: Missing sessionId parameter',
        code: 'MISSING_SESSION_ID',
        details: 'sessionId is required'
      }, 
      { status: 400 }
    );
  }

  try {
    const session = await sessionOrchestrator.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { 
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
          details: `No session found with ID: ${sessionId}`
        }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { session }
    });
  } catch (error) {
    console.error('Get session error:', error);
    
    return NextResponse.json(
      {
        error: 'Session retrieval failed: Database error',
        code: 'SESSION_RETRIEVAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
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
    return NextResponse.json(
      { 
        error: 'Knowledge search failed: Missing query parameter',
        code: 'MISSING_QUERY',
        details: 'query parameter is required'
      }, 
      { status: 400 }
    );
  }

  try {
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
  } catch (error) {
    console.error('Knowledge search error:', error);
    
    return NextResponse.json(
      {
        error: 'Knowledge search failed: Database error',
        code: 'KNOWLEDGE_SEARCH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
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

  try {
    const sessions = await BmadDatabase.getUserSessions(userId, workspaceId, status);

    return NextResponse.json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('auth')) {
        return NextResponse.json(
          {
            error: 'Session retrieval failed: User not authenticated',
            code: 'AUTH_REQUIRED',
            details: 'Valid authentication token required for session retrieval'
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        {
          error: 'Session retrieval failed: Database error',
          code: 'DB_ERROR',
          details: error.message
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Session retrieval failed: Unknown error', 
        code: 'UNKNOWN_ERROR',
        details: 'An unexpected error occurred during session retrieval'
      },
      { status: 500 }
    );
  }
}

/**
 * Get all available pathways
 */
async function handleGetPathways() {
  try {
    const pathways = pathwayRouter.getAllPathways();

    return NextResponse.json({
      success: true,
      data: { pathways }
    });
  } catch (error) {
    console.error('Get pathways error:', error);
    
    return NextResponse.json(
      {
        error: 'Pathway retrieval failed: Unable to load pathways',
        code: 'PATHWAY_LOAD_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * Analyze New Idea input with Claude
 */
async function handleAnalyzeNewIdea(params: {
  messages: Array<{ role: string; content: string }>;
  phase: string;
  maxTokens?: number;
}) {
  const { messages, phase, maxTokens = 2000 } = params;

  if (!messages || messages.length === 0) {
    return NextResponse.json(
      {
        error: 'Analysis failed: Missing messages parameter',
        code: 'MISSING_MESSAGES',
        details: 'messages array is required for analysis'
      },
      { status: 400 }
    );
  }

  try {
    // In a real implementation, this would call Claude API
    // For now, return a structured response
    const mockAnalysis = {
      insights: [
        'This concept shows potential for market validation',
        'Consider focusing on the core problem statement',
        'Market timing appears favorable for this approach'
      ],
      recommendations: [
        'Conduct customer interviews to validate assumptions',
        'Research existing solutions in this space',
        'Define minimum viable product scope'
      ],
      questions: [
        'Who is most affected by this problem?',
        'What alternatives do customers currently use?',
        'How would you measure success?'
      ],
      confidence: 0.85
    };

    return NextResponse.json({
      success: true,
      analysis: JSON.stringify(mockAnalysis),
      phase
    });
  } catch (error) {
    console.error('New Idea analysis error:', error);
    
    return NextResponse.json(
      {
        error: 'Analysis failed: Processing error',
        code: 'ANALYSIS_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate concept document
 */
async function handleGenerateConceptDocument(params: {
  sessionId: string;
  format?: 'markdown' | 'html' | 'json';
}) {
  const { sessionId, format = 'markdown' } = params;

  if (!sessionId) {
    return NextResponse.json(
      {
        error: 'Document generation failed: Missing sessionId parameter',
        code: 'MISSING_SESSION_ID',
        details: 'sessionId is required for document generation'
      },
      { status: 400 }
    );
  }

  try {
    const session = await sessionOrchestrator.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        {
          error: 'Document generation failed: Session not found',
          code: 'SESSION_NOT_FOUND',
          details: `No session found with ID: ${sessionId}`
        },
        { status: 404 }
      );
    }

    // Generate documents would be handled by the session orchestrator
    const documents = await sessionOrchestrator.completeSession(sessionId);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        documents: documents.outputs.finalDocuments,
        format
      }
    });
  } catch (error) {
    console.error('Document generation error:', error);
    
    return NextResponse.json(
      {
        error: 'Document generation failed: Processing error',
        code: 'DOCUMENT_GENERATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * Complete session and generate final outputs
 */
async function handleCompleteSession(params: { sessionId: string }) {
  const { sessionId } = params;

  if (!sessionId) {
    return NextResponse.json(
      {
        error: 'Session completion failed: Missing sessionId parameter',
        code: 'MISSING_SESSION_ID',
        details: 'sessionId is required for session completion'
      },
      { status: 400 }
    );
  }

  try {
    const completedSession = await sessionOrchestrator.completeSession(sessionId);

    return NextResponse.json({
      success: true,
      data: {
        session: completedSession,
        documents: completedSession.outputs.finalDocuments,
        actionItems: completedSession.outputs.actionItems
      }
    });
  } catch (error) {
    console.error('Session completion error:', error);
    
    return NextResponse.json(
      {
        error: 'Session completion failed: Processing error',
        code: 'SESSION_COMPLETION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}