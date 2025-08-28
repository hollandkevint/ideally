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
        return await handleSearchKnowledge({ query });
        
      case 'sessions':
        const workspaceId = searchParams.get('workspaceId') || undefined;
        return await handleGetUserSessions(user.id, { workspaceId });

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

  const recommendation = await pathwayRouter.analyzeUserIntent(userInput);
  
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