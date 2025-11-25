'use client';

/**
 * Pricing Page
 *
 * Displays credit packages with Stripe checkout integration
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Package {
  id: 'starter' | 'professional' | 'business';
  name: string;
  credits: number;
  price: number;
  pricePerCredit: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const packages: Package[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 5,
    price: 19,
    pricePerCredit: '$3.80',
    description: 'Perfect for trying out ThinkHaven',
    features: [
      '5 strategic coaching sessions',
      'AI-powered BMad Method',
      'Canvas visual workspace',
      'PDF & Markdown exports',
      'Session history',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 10,
    price: 39,
    pricePerCredit: '$3.90',
    description: 'Best value for regular users',
    features: [
      '10 strategic coaching sessions',
      'Everything in Starter',
      'Priority support',
      'Advanced analytics',
      'Team collaboration (coming soon)',
    ],
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    credits: 20,
    price: 79,
    pricePerCredit: '$3.95',
    description: 'For teams and frequent users',
    features: [
      '20 strategic coaching sessions',
      'Everything in Professional',
      'Dedicated support',
      'Custom integrations',
      'API access (coming soon)',
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled');

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (packageId: Package['id']) => {
    setLoading(packageId);
    setError(null);

    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageType: packageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Unlock Strategic Thinking
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get AI-powered coaching sessions with the BMad Method to transform your ideas into actionable strategies.
          </p>
        </div>

        {/* Cancelled Message */}
        {cancelled && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <p className="text-amber-800">
              Checkout was cancelled. Feel free to try again when you're ready.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative flex flex-col ${
                pkg.popular
                  ? 'border-blue-500 border-2 shadow-lg'
                  : 'border-gray-200'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      ${pkg.price}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {pkg.credits} credits ({pkg.pricePerCredit}/session)
                  </p>
                </div>

                <ul className="space-y-3">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className={`w-full ${
                    pkg.popular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading !== null}
                >
                  {loading === pkg.id ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Get ${pkg.credits} Credits`
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="text-center border-t border-gray-200 pt-8">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure payment via Stripe
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Credits never expire
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              All major cards accepted
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">What is a credit?</h3>
              <p className="text-sm text-gray-600">
                Each credit gives you one complete strategic coaching session with the BMad Method. Sessions include AI-powered analysis, canvas workspace, and professional exports.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Do credits expire?</h3>
              <p className="text-sm text-gray-600">
                No! Your credits never expire. Use them whenever you need strategic thinking support.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Can I get a refund?</h3>
              <p className="text-sm text-gray-600">
                Yes, we offer refunds for unused credits within 30 days of purchase. Contact us at support@thinkhaven.co.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Need more credits?</h3>
              <p className="text-sm text-gray-600">
                For enterprise needs or custom packages, reach out to us at enterprise@thinkhaven.co.
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-12">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
