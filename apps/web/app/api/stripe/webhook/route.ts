/**
 * Stripe Webhook Handler
 *
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for payment processing
 *
 * CRITICAL: This endpoint must:
 * 1. Verify webhook signatures (prevent fraud)
 * 2. Handle idempotency (same event can be sent multiple times)
 * 3. Grant credits atomically after successful payment
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  constructWebhookEvent,
  retrieveCheckoutSession,
  getPackageByPriceId,
  CREDIT_PACKAGES,
} from '@/lib/monetization/stripe-service';
import {
  addCredits,
  getTransactionByStripePayment,
  updatePaymentStatus,
} from '@/lib/monetization/credit-manager';
import Stripe from 'stripe';

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Webhook error: Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    // Handle specific event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[Stripe Webhook] Checkout session expired: ${session.id}`);
        // Update payment status to failed if we have a record
        await updatePaymentStatus(session.id, 'failed');
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);
        // Payment failures are logged but don't require action
        // User can retry from the checkout session
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log(`[Stripe Webhook] Charge refunded: ${charge.id}`);
        // Note: Credit reversal should be handled manually by admin
        // to prevent abuse. Log for record-keeping.
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout completion
 * Grants credits to user after payment is confirmed
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log(`[Stripe Webhook] Processing checkout: ${session.id}`);

  // Extract metadata from session
  const userId = session.client_reference_id || session.metadata?.userId;
  const packageType = session.metadata?.packageType as keyof typeof CREDIT_PACKAGES;
  const creditsStr = session.metadata?.credits;

  if (!userId) {
    console.error('[Stripe Webhook] Missing userId in session:', session.id);
    return;
  }

  if (!packageType || !creditsStr) {
    console.error('[Stripe Webhook] Missing package info in session:', session.id);
    return;
  }

  const credits = parseInt(creditsStr, 10);
  if (isNaN(credits) || credits <= 0) {
    console.error('[Stripe Webhook] Invalid credits amount:', creditsStr);
    return;
  }

  // Get payment intent ID for idempotency
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntentId) {
    console.error('[Stripe Webhook] Missing payment_intent in session:', session.id);
    return;
  }

  // Check for idempotency - has this payment already been processed?
  const existingTransaction = await getTransactionByStripePayment(paymentIntentId);
  if (existingTransaction) {
    console.log(
      `[Stripe Webhook] Payment ${paymentIntentId} already processed, skipping`
    );
    return;
  }

  // Grant credits to user
  console.log(
    `[Stripe Webhook] Granting ${credits} credits to user ${userId} for ${packageType}`
  );

  const packageName = CREDIT_PACKAGES[packageType]?.name || String(packageType);
  const result = await addCredits({
    userId,
    amount: credits,
    source: 'purchase',
    stripePaymentId: paymentIntentId,
    description: `Purchased ${packageName} (${credits} credits)`,
  });

  if (result.success) {
    console.log(
      `[Stripe Webhook] Successfully granted ${credits} credits. New balance: ${result.balance}`
    );

    // Update payment record status
    await updatePaymentStatus(
      session.id,
      'succeeded',
      session.receipt_url || undefined
    );
  } else {
    console.error('[Stripe Webhook] Failed to grant credits:', result.message);
    // Don't fail the webhook - log for manual intervention
    // The payment was successful, so we need to ensure credits are granted
  }
}
