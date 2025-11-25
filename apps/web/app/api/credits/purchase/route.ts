/**
 * Credit Purchase API
 *
 * POST /api/credits/purchase
 * Creates a Stripe Checkout session for credit package purchase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createCheckoutSession,
  PackageType,
  CREDIT_PACKAGES,
} from '@/lib/monetization/stripe-service';

interface PurchaseRequest {
  packageType: PackageType;
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
          message: 'You must be logged in to purchase credits',
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body: PurchaseRequest = await request.json();
    const { packageType } = body;

    if (!packageType || !CREDIT_PACKAGES[packageType]) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid package type. Must be: starter, professional, or business',
        },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession(
      user.id,
      packageType,
      user.email || undefined
    );

    if (!session.url) {
      return NextResponse.json(
        {
          error: 'Stripe Error',
          message: 'Failed to create checkout session URL',
        },
        { status: 500 }
      );
    }

    // Return checkout URL for client redirect
    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      package: {
        id: packageType,
        name: CREDIT_PACKAGES[packageType].name,
        credits: CREDIT_PACKAGES[packageType].credits,
        priceCents: CREDIT_PACKAGES[packageType].priceCents,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/credits/purchase:', error);

    // Handle specific Stripe errors
    if (error instanceof Error && error.message.includes('Stripe Price ID not configured')) {
      return NextResponse.json(
        {
          error: 'Configuration Error',
          message: 'Payment system is not fully configured. Please try again later.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
