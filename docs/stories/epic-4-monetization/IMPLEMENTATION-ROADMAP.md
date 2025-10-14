# Epic 4: Monetization - Implementation Roadmap

**Status**: 🟡 IN PROGRESS (30% complete)
**Last Updated**: 2025-10-14
**Estimated Time Remaining**: 1.5-2 days

---

## ✅ Completed (Day 1 - Session 1)

### Dependencies Installed
- ✅ `stripe` - Stripe Node.js SDK
- ✅ `@stripe/stripe-js` - Stripe client-side library
- ✅ `resend` - Email service
- ✅ `@react-email/components` - React email templates
- ✅ `@types/stripe` - TypeScript types (note: deprecated, Stripe provides its own types)

### Database Schema Created
**File**: `apps/web/supabase/migrations/005_session_credit_system.sql`

**Tables**:
- ✅ `user_credits` - Credit balance tracking
- ✅ `credit_transactions` - Audit trail
- ✅ `credit_packages` - Pricing tiers (3 packages seeded)
- ✅ `payment_history` - Stripe payment records

**Functions**:
- ✅ `grant_free_credit()` - Auto-grant 1 credit on registration
- ✅ `deduct_credit_transaction()` - Atomic deduction with locking
- ✅ `add_credits_transaction()` - Add credits from purchase/grant

**Triggers**:
- ✅ `trigger_grant_free_credit` - Fires on new user creation
- ✅ Timestamp update triggers for all tables

**RLS Policies**: All tables secured with user isolation

### Backend Services Created
**File**: `apps/web/lib/monetization/credit-manager.ts` (370 lines)

**Exports**:
- ✅ `getCreditBalance(userId)` - Fetch balance
- ✅ `hasCredits(userId, required)` - Check availability
- ✅ `deductCredit(userId, sessionId?)` - Atomic deduction
- ✅ `addCredits({ userId, amount, source, ... })` - Add credits
- ✅ `getCreditHistory(userId, limit)` - Transaction history
- ✅ `getTransactionByStripePayment(stripePaymentId)` - Idempotency check
- ✅ `getCreditPackages()` - Fetch active packages
- ✅ `getCreditPackage(packageId)` - Get specific package
- ✅ `createPaymentRecord(...)` - Create payment record
- ✅ `updatePaymentStatus(...)` - Update payment status
- ✅ `getPaymentHistory(userId, limit)` - User payment history

**File**: `apps/web/lib/monetization/stripe-service.ts` (340 lines)

**Exports**:
- ✅ `stripe` - Configured Stripe instance
- ✅ `CREDIT_PACKAGES` - Package definitions (starter, professional, business)
- ✅ `createCheckoutSession(userId, packageType, email?)` - Create checkout
- ✅ `constructWebhookEvent(body, signature)` - Verify webhooks
- ✅ `retrieveCheckoutSession(sessionId)` - Get session details
- ✅ `retrievePaymentIntent(paymentIntentId)` - Get payment intent
- ✅ `createRefund(paymentIntentId, reason?)` - Process refunds
- ✅ `getOrCreateCustomer(userId, email, name?)` - Manage customers
- ✅ `formatCurrency(cents)` - Format dollars
- ✅ `getPackageByPriceId(priceId)` - Find package by Stripe price ID
- ✅ `verifyStripeConnection()` - Health check

### API Endpoints Created
**File**: `apps/web/app/api/credits/balance/route.ts`
- ✅ GET `/api/credits/balance` - Returns user's credit balance
- ✅ Optional `?include_history=true` for recent transactions
- ✅ Authentication check
- ✅ Handles users without credit records (returns zero balance)

---

## 🔨 Next Steps (Remaining Work)

### Phase 1: Complete API Endpoints (2-3 hours)

#### 1.1 Credit Purchase API
**File**: `apps/web/app/api/credits/purchase/route.ts`

```typescript
/**
 * POST /api/credits/purchase
 * Body: { packageType: 'starter' | 'professional' | 'business' }
 * Returns: { checkoutUrl: string, sessionId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession, CREDIT_PACKAGES, PackageType } from '@/lib/monetization/stripe-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { packageType } = await request.json();

    // Validate package type
    if (!packageType || !(packageType in CREDIT_PACKAGES)) {
      return NextResponse.json(
        { error: 'Invalid package type' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession(
      user.id,
      packageType as PackageType,
      user.email
    );

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

#### 1.2 Stripe Webhook Handler
**File**: `apps/web/app/api/stripe/webhook/route.ts`

**CRITICAL**: Must use raw request body for signature verification

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { constructWebhookEvent } from '@/lib/monetization/stripe-service';
import { addCredits } from '@/lib/monetization/credit-manager';
import { updatePaymentStatus } from '@/lib/monetization/credit-manager';

export async function POST(request: NextRequest) {
  const body = await request.text(); // MUST be raw text, not JSON
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  try {
    // Verify webhook signature
    const event = constructWebhookEvent(body, signature);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Extract metadata
        const userId = session.metadata?.userId;
        const credits = parseInt(session.metadata?.credits || '0');
        const paymentIntentId = session.payment_intent as string;

        if (!userId || !credits) {
          console.error('Missing metadata in checkout session');
          return NextResponse.json({ received: true });
        }

        // Add credits to user account
        const result = await addCredits({
          userId,
          amount: credits,
          source: 'purchase',
          stripePaymentId: paymentIntentId,
          description: `Purchased ${credits} credits`,
        });

        // Update payment status
        await updatePaymentStatus(session.id, 'succeeded', session.receipt_url);

        // TODO: Send confirmation email

        console.log('Credits added:', result);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // TODO: Update payment status to failed
        // TODO: Send failure notification email
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs';
```

**Important**: Configure Stripe webhook endpoint:
```bash
# For local testing
stripe listen --forward-to localhost:3000/api/stripe/webhook

# For production
# Add webhook endpoint in Stripe Dashboard:
# https://dashboard.stripe.com/webhooks
# URL: https://www.thinkhaven.co/api/stripe/webhook
# Events: checkout.session.completed, payment_intent.payment_failed
```

#### 1.3 Credit Packages API (Optional)
**File**: `apps/web/app/api/credits/packages/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getCreditPackages } from '@/lib/monetization/credit-manager';

export async function GET() {
  try {
    const packages = await getCreditPackages();
    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
```

---

### Phase 2: Protect AI Endpoints with Credits (1 hour)

#### 2.1 Update Chat Stream API
**File**: `apps/web/app/api/chat/stream/route.ts` (line ~30)

**Add credit check before streaming**:

```typescript
// After user authentication (around line 30)
import { hasCredits, deductCredit } from '@/lib/monetization/credit-manager';

// Check if user has credits
const hasSufficientCredits = await hasCredits(user.id, 1);

if (!hasSufficientCredits) {
  return new Response(JSON.stringify({
    error: 'Insufficient credits',
    message: 'You need at least 1 credit to start a session. Please purchase credits to continue.',
    code: 'INSUFFICIENT_CREDITS'
  }), {
    status: 402, // Payment Required
    headers: { 'Content-Type': 'application/json' }
  });
}

// Deduct credit atomically
const deductResult = await deductCredit(user.id);

if (!deductResult.success) {
  return new Response(JSON.stringify({
    error: 'Credit deduction failed',
    message: deductResult.message,
    code: 'DEDUCTION_FAILED'
  }), {
    status: 402,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Continue with existing stream logic...
```

#### 2.2 Update BMad API
**File**: `apps/web/app/api/bmad/route.ts`

**Add same credit check logic at the beginning of the POST handler**

---

### Phase 3: UI Components (3-4 hours)

#### 3.1 Credit Indicator Component
**File**: `apps/web/app/components/monetization/CreditIndicator.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, AlertCircle } from 'lucide-react';

interface CreditBalance {
  balance: number;
  total_used: number;
  total_purchased: number;
  total_granted: number;
}

export function CreditIndicator() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBalance();
  }, []);

  async function fetchBalance() {
    try {
      const response = await fetch('/api/credits/balance');
      if (response.ok) {
        const data = await response.json();
        setBalance(data);
      }
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <CreditCard className="h-4 w-4" />
        <span>...</span>
      </div>
    );
  }

  if (!balance) return null;

  const isLow = balance.balance <= 1;
  const isZero = balance.balance === 0;

  return (
    <button
      onClick={() => router.push('/pricing')}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
        isZero
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : isLow
          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {isLow ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <CreditCard className="h-4 w-4" />
      )}
      <span className="text-sm font-medium">
        {balance.balance} {balance.balance === 1 ? 'credit' : 'credits'}
      </span>
    </button>
  );
}
```

**Integration**: Add to navigation component:
- File: `apps/web/app/components/ui/navigation.tsx`
- Import and render `<CreditIndicator />` in the header/nav bar

#### 3.2 Low Credit Modal
**File**: `apps/web/app/components/monetization/LowCreditModal.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { X, AlertTriangle } from 'lucide-react';

interface LowCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

export function LowCreditModal({ isOpen, onClose, currentBalance }: LowCreditModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    router.push('/pricing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 rounded-full p-2">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold">
              {currentBalance === 0 ? 'Out of Credits' : 'Low Credits'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          {currentBalance === 0 ? (
            <>
              You've used all your credits. Purchase more to continue
              creating strategic coaching sessions with Mary.
            </>
          ) : (
            <>
              You have {currentBalance} credit{currentBalance !== 1 && 's'} remaining.
              Consider purchasing more to avoid interruptions.
            </>
          )}
        </p>

        <div className="space-y-3">
          <button
            onClick={handleUpgrade}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View Pricing
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 3.3 Pricing Page
**File**: `apps/web/app/pricing/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    price: '$19',
    credits: 5,
    description: 'Perfect for trying out ThinkHaven',
    features: [
      '5 strategic coaching sessions',
      'Full BMad Method access',
      'PDF & Markdown export',
      'Canvas workspace',
      '30 days to use',
    ],
  },
  {
    id: 'professional',
    name: 'Professional Pack',
    price: '$39',
    credits: 10,
    description: 'Best value for regular users',
    features: [
      '10 strategic coaching sessions',
      'Full BMad Method access',
      'PDF & Markdown export',
      'Canvas workspace',
      'Priority support',
      '60 days to use',
    ],
    popular: true,
  },
  {
    id: 'business',
    name: 'Business Pack',
    price: '$79',
    credits: 20,
    description: 'For teams and frequent users',
    features: [
      '20 strategic coaching sessions',
      'Full BMad Method access',
      'PDF & Markdown export',
      'Canvas workspace',
      'Priority support',
      'Team collaboration features',
      '90 days to use',
    ],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handlePurchase = async (packageType: string) => {
    setLoading(packageType);

    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageType }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();

      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;

    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">
            Pay only for the sessions you need. No subscriptions, no commitments.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white rounded-lg shadow-lg p-8 relative ${
                pkg.popular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
              <p className="text-gray-600 mb-4">{pkg.description}</p>

              <div className="mb-6">
                <span className="text-5xl font-bold">{pkg.price}</span>
                <span className="text-gray-600 ml-2">for {pkg.credits} credits</span>
              </div>

              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={loading !== null}
                className={`w-full py-3 rounded-lg font-medium transition-colors mb-6 ${
                  pkg.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading === pkg.id ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Purchase Now'
                )}
              </button>

              <ul className="space-y-3">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p className="mb-2">New users get 1 free credit automatically!</p>
          <p>Questions? Contact support@thinkhaven.co</p>
        </div>
      </div>
    </div>
  );
}
```

#### 3.4 Purchase Success Page
**File**: `apps/web/app/pricing/success/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function PurchaseSuccessPage() {
  const [verified, setVerified] = useState(false);
  const [credits, setCredits] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Verify the purchase by fetching updated balance
    async function verifyPurchase() {
      const response = await fetch('/api/credits/balance');
      if (response.ok) {
        const data = await response.json();
        setCredits(data.balance);
        setVerified(true);
      }
    }

    if (sessionId) {
      verifyPurchase();
    }
  }, [sessionId]);

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Purchase Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your credits have been added to your account.
        </p>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Your new balance</p>
          <p className="text-4xl font-bold text-blue-600">{credits}</p>
          <p className="text-sm text-gray-600">
            {credits === 1 ? 'credit' : 'credits'} available
          </p>
        </div>

        <p className="text-gray-600 mb-6">
          A receipt has been sent to your email address.
        </p>

        <button
          onClick={() => router.push('/workspace')}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Start a Session
        </button>
      </div>
    </div>
  );
}
```

---

### Phase 4: Email Templates (1-2 hours)

#### 4.1 Welcome Email Template
**File**: `apps/web/lib/email/templates/welcome-credit.tsx`

```typescript
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
} from '@react-email/components';

interface WelcomeCreditEmailProps {
  userName: string;
  credits: number;
}

export function WelcomeCreditEmail({ userName, credits = 1 }: WelcomeCreditEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <Section style={{ backgroundColor: 'white', borderRadius: '8px', padding: '40px' }}>
            <Heading style={{ fontSize: '28px', marginBottom: '20px' }}>
              Welcome to ThinkHaven! 🎉
            </Heading>

            <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
              Hi {userName},
            </Text>

            <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
              Welcome to ThinkHaven! We're excited to help you transform your ideas into
              actionable strategic frameworks.
            </Text>

            <Section style={{
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              padding: '20px',
              margin: '24px 0',
              textAlign: 'center',
            }}>
              <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                Your free credit
              </Text>
              <Text style={{ fontSize: '48px', fontWeight: 'bold', color: '#2563eb', margin: '0' }}>
                {credits}
              </Text>
              <Text style={{ fontSize: '14px', color: '#6b7280', margin: '8px 0 0 0' }}>
                strategic coaching session
              </Text>
            </Section>

            <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
              Your first session is on us! Use it to:
            </Text>

            <ul style={{ fontSize: '16px', lineHeight: '28px', color: '#374151' }}>
              <li>Refine a new business idea</li>
              <li>Build a comprehensive business model</li>
              <li>Create professional feature briefs</li>
            </ul>

            <Button
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.thinkhaven.co'}/workspace`}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '24px',
              }}
            >
              Start Your Free Session
            </Button>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginTop: '32px' }}>
              Questions? Reply to this email or visit our{' '}
              <a href="https://www.thinkhaven.co/help" style={{ color: '#2563eb' }}>
                help center
              </a>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

#### 4.2 Payment Confirmation Email
**File**: `apps/web/lib/email/templates/payment-confirmation.tsx`

```typescript
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
} from '@react-email/components';
import { formatCurrency } from '@/lib/monetization/stripe-service';

interface PaymentConfirmationEmailProps {
  userName: string;
  credits: number;
  amountCents: number;
  receiptUrl: string;
}

export function PaymentConfirmationEmail({
  userName,
  credits,
  amountCents,
  receiptUrl,
}: PaymentConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <Section style={{ backgroundColor: 'white', borderRadius: '8px', padding: '40px' }}>
            <Heading style={{ fontSize: '28px', marginBottom: '20px' }}>
              Payment Received! ✅
            </Heading>

            <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
              Hi {userName},
            </Text>

            <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
              Thank you for your purchase! Your credits have been added to your account
              and are ready to use.
            </Text>

            <Section style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              margin: '24px 0',
            }}>
              <table style={{ width: '100%' }}>
                <tr>
                  <td style={{ paddingBottom: '12px' }}>
                    <Text style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                      Credits Purchased
                    </Text>
                    <Text style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                      {credits}
                    </Text>
                  </td>
                  <td style={{ paddingBottom: '12px', textAlign: 'right' }}>
                    <Text style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                      Amount Paid
                    </Text>
                    <Text style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                      {formatCurrency(amountCents)}
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>

            <Button
              href={receiptUrl}
              style={{
                backgroundColor: '#e5e7eb',
                color: '#1f2937',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block',
                marginRight: '12px',
              }}
            >
              View Receipt
            </Button>

            <Button
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.thinkhaven.co'}/workspace`}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Start a Session
            </Button>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginTop: '32px' }}>
              Need help? Contact us at support@thinkhaven.co
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

#### 4.3 Email Service Helper
**File**: `apps/web/lib/email/send-email.ts`

```typescript
import { Resend } from 'resend';
import { render } from '@react-email/components';
import { WelcomeCreditEmail } from './templates/welcome-credit';
import { PaymentConfirmationEmail } from './templates/payment-confirmation';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(
  toEmail: string,
  userName: string,
  credits: number = 1
) {
  try {
    const emailHtml = render(
      WelcomeCreditEmail({ userName, credits })
    );

    await resend.emails.send({
      from: 'ThinkHaven <welcome@thinkhaven.co>',
      to: toEmail,
      subject: 'Welcome to ThinkHaven - Your Free Credit Awaits!',
      html: emailHtml,
    });

    console.log('Welcome email sent to:', toEmail);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw - email failures shouldn't block user registration
  }
}

export async function sendPaymentConfirmationEmail(
  toEmail: string,
  userName: string,
  credits: number,
  amountCents: number,
  receiptUrl: string
) {
  try {
    const emailHtml = render(
      PaymentConfirmationEmail({ userName, credits, amountCents, receiptUrl })
    );

    await resend.emails.send({
      from: 'ThinkHaven <receipts@thinkhaven.co>',
      to: toEmail,
      subject: 'Payment Received - Credits Added to Your Account',
      html: emailHtml,
    });

    console.log('Payment confirmation sent to:', toEmail);
  } catch (error) {
    console.error('Failed to send payment confirmation:', error);
  }
}
```

---

### Phase 5: Integration & Testing (2-3 hours)

#### 5.1 Update Workspace Page
**File**: `apps/web/app/workspace/[id]/page.tsx`

**Add at the top of the component**:

```typescript
import { CreditIndicator } from '@/app/components/monetization/CreditIndicator';
import { LowCreditModal } from '@/app/components/monetization/LowCreditModal';

// In component state
const [showLowCreditModal, setShowLowCreditModal] = useState(false);
const [creditBalance, setCreditBalance] = useState(0);

// Fetch balance on mount
useEffect(() => {
  async function fetchBalance() {
    const response = await fetch('/api/credits/balance');
    if (response.ok) {
      const data = await response.json();
      setCreditBalance(data.balance);

      // Show modal if zero credits
      if (data.balance === 0) {
        setShowLowCreditModal(true);
      }
    }
  }
  fetchBalance();
}, []);

// In JSX header section
<CreditIndicator />

// Before closing body tag
<LowCreditModal
  isOpen={showLowCreditModal}
  onClose={() => setShowLowCreditModal(false)}
  currentBalance={creditBalance}
/>
```

#### 5.2 Environment Variables Setup

**Add to `.env.local`**:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create in Stripe Dashboard)
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_PROFESSIONAL=price_...
STRIPE_PRICE_ID_BUSINESS=price_...

# Email Service (Resend)
RESEND_API_KEY=re_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000
```

**Add to Vercel Production**:
```bash
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add RESEND_API_KEY production
# etc...
```

#### 5.3 Database Migration

**Run migration on Supabase**:

```bash
# Option 1: Via Supabase CLI
supabase db push

# Option 2: Via Supabase Dashboard
# Navigate to SQL Editor → New Query → Paste migration content → Run
```

#### 5.4 Stripe Product Setup

**Manual steps in Stripe Dashboard**:

1. Create Products:
   - Starter Pack: $19.00 (5 credits)
   - Professional Pack: $39.00 (10 credits)
   - Business Pack: $79.00 (20 credits)

2. Copy Price IDs to environment variables

3. Create Webhook Endpoint:
   - URL: `https://www.thinkhaven.co/api/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.payment_failed`
   - Copy Signing Secret to `STRIPE_WEBHOOK_SECRET`

#### 5.5 Unit Tests

**File**: `apps/web/lib/monetization/__tests__/credit-manager.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { deductCredit, addCredits, getCreditBalance } from '../credit-manager';

describe('Credit Manager', () => {
  const testUserId = 'test-user-123';

  it('should deduct credit atomically', async () => {
    // TODO: Implement with test database
    const result = await deductCredit(testUserId);
    expect(result.success).toBe(true);
    expect(result.balance).toBeGreaterThanOrEqual(0);
  });

  it('should prevent negative balance', async () => {
    // TODO: Test with user having 0 credits
    const result = await deductCredit(testUserId);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Insufficient');
  });

  it('should add credits from purchase', async () => {
    const result = await addCredits({
      userId: testUserId,
      amount: 5,
      source: 'purchase',
      stripePaymentId: 'pi_test_123',
    });

    expect(result.success).toBe(true);
    expect(result.balance).toBeGreaterThan(0);
  });
});
```

#### 5.6 E2E Tests

**File**: `apps/web/tests/e2e/monetization.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Monetization Flow', () => {
  test('new user receives free credit', async ({ page }) => {
    // TODO: Implement signup flow
    // TODO: Verify credit balance is 1
  });

  test('user can purchase credits', async ({ page }) => {
    await page.goto('/pricing');

    // Click starter package
    await page.click('button:has-text("Purchase Now")');

    // Should redirect to Stripe (check URL contains checkout.stripe.com)
    await expect(page).toHaveURL(/checkout\.stripe\.com/);
  });

  test('starting session deducts credit', async ({ page }) => {
    // TODO: Login, start BMad session
    // TODO: Verify balance decreased by 1
  });

  test('zero credits prevents session start', async ({ page }) => {
    // TODO: Login with user having 0 credits
    // TODO: Attempt to start session
    // TODO: Verify 402 error or modal appears
  });
});
```

---

## 📋 Prerequisites Checklist

Before deploying to production, ensure you have:

- [ ] **Stripe Account**
  - [ ] Test mode configured
  - [ ] Live mode configured
  - [ ] Products created (Starter, Professional, Business)
  - [ ] Price IDs copied to environment variables
  - [ ] Webhook endpoint configured
  - [ ] Webhook secret copied to environment variables

- [ ] **Resend Account** (or alternative email service)
  - [ ] Account created
  - [ ] Domain verified (SPF/DKIM records)
  - [ ] API key generated
  - [ ] Sending email addresses verified

- [ ] **Legal Documents**
  - [ ] Terms of Service drafted
  - [ ] Privacy Policy drafted
  - [ ] Refund policy defined
  - [ ] Legal review completed (if required)

- [ ] **Environment Variables**
  - [ ] All Stripe keys added to Vercel
  - [ ] Email service API key added
  - [ ] APP_URL configured correctly

- [ ] **Database**
  - [ ] Migration 005 executed on production Supabase
  - [ ] Credit packages seeded
  - [ ] RLS policies verified

---

## 🚀 Deployment Checklist

- [ ] All files created and tested locally
- [ ] Environment variables configured in Vercel
- [ ] Database migration executed on production
- [ ] Stripe products and webhooks configured
- [ ] Email templates tested in Resend sandbox
- [ ] Credit deduction tested with real sessions
- [ ] Stripe test mode purchase tested end-to-end
- [ ] Webhook processing verified with Stripe CLI
- [ ] Low credit warnings tested
- [ ] Zero credit blocking tested
- [ ] Legal pages linked in footer and checkout
- [ ] Production deployment completed
- [ ] Live Stripe purchase tested (small amount)
- [ ] Monitor Stripe webhook deliveries for 24 hours

---

## 🎯 Success Criteria

✅ New users receive 1 free credit automatically
✅ Credits deduct atomically when starting sessions
✅ Users can purchase credit packages via Stripe
✅ Webhooks process reliably with signature verification
✅ Email notifications send correctly
✅ UI shows credit balance prominently
✅ Zero credit state prevents session creation with upgrade prompt
✅ All tests passing (90%+ coverage)
✅ No race conditions or double-spending
✅ Revenue tracking functional in Stripe dashboard

---

## 📞 Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Resend Documentation**: https://resend.com/docs
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Supabase RPC Functions**: https://supabase.com/docs/guides/database/functions
- **React Email**: https://react.email/docs/introduction

---

**Last Updated**: 2025-10-14
**Status**: Ready for implementation - all code templates provided
**Estimated Completion**: 1.5-2 days of focused work
