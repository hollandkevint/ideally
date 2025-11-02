/**
 * Trial Feedback API
 *
 * POST /api/feedback/trial
 * Collects user feedback after completing trial sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface FeedbackPayload {
  userId: string;
  rating: number;
  wouldPay: boolean;
  feedback: string | null;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to submit feedback',
        },
        { status: 401 }
      );
    }

    // Parse request body
    const payload: FeedbackPayload = await request.json();

    // Validate payload
    if (!payload.rating || payload.wouldPay === undefined) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Rating and wouldPay are required',
        },
        { status: 400 }
      );
    }

    // Ensure user matches authenticated user
    if (payload.userId !== user.id) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'User ID mismatch',
        },
        { status: 403 }
      );
    }

    // Store feedback in trial_feedback table
    const { error: insertError } = await supabase.from('trial_feedback').insert({
      user_id: payload.userId,
      rating: payload.rating,
      would_pay: payload.wouldPay,
      feedback_text: payload.feedback,
      user_email: user.email,
      submitted_at: payload.timestamp,
    });

    if (insertError) {
      // If table doesn't exist yet, log to console for now
      console.log('Trial Feedback Submission:', {
        userId: payload.userId,
        email: user.email,
        rating: payload.rating,
        wouldPay: payload.wouldPay,
        feedback: payload.feedback,
        timestamp: payload.timestamp,
      });

      // Return success even if table doesn't exist
      // This allows MVP testing without the table
      return NextResponse.json({
        success: true,
        message: 'Feedback recorded (console log)',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/feedback/trial:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
