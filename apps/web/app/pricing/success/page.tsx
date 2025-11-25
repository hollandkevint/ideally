'use client';

/**
 * Purchase Success Page
 *
 * Displayed after successful Stripe checkout
 * Shows confirmation and updated credit balance
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CreditBalance {
  balance: number;
  total_granted: number;
  total_purchased: number;
  total_used: number;
}

export default function PurchaseSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Fetch updated credit balance
    // May need to retry as webhook might not have processed yet
    const fetchCredits = async () => {
      try {
        const response = await fetch('/api/credits/balance');
        if (response.ok) {
          const data = await response.json();
          setCredits(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching credits:', err);
      }
    };

    fetchCredits();

    // Retry a few times in case webhook hasn't processed yet
    if (retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        fetchCredits();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [retryCount]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          {/* Success Animation */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-600"
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
          </div>

          <CardTitle className="text-2xl text-green-800">
            Purchase Successful!
          </CardTitle>
          <CardDescription>
            Your credits have been added to your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Credit Balance */}
          {loading ? (
            <div className="py-4">
              <div className="animate-pulse bg-gray-200 h-12 rounded-lg mx-auto w-32" />
              <p className="text-sm text-gray-500 mt-2">
                Updating your balance...
              </p>
            </div>
          ) : credits ? (
            <div className="py-4 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold text-gray-900">
                {credits.balance}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                credits available
              </p>
              {credits.total_purchased > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Total purchased: {credits.total_purchased} credits
                </p>
              )}
            </div>
          ) : null}

          {/* What's Next */}
          <div className="text-left bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">1.</span>
                Start a new strategic coaching session
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">2.</span>
                Use the BMad Method frameworks
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">3.</span>
                Export your insights as PDF or Markdown
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Go to Dashboard
              </Button>
            </Link>

            <Link href="/workspace" className="w-full">
              <Button variant="outline" className="w-full">
                Start New Session
              </Button>
            </Link>
          </div>

          {/* Receipt Info */}
          <p className="text-xs text-gray-500">
            A receipt has been sent to your email address.
            {sessionId && (
              <span className="block mt-1">
                Session ID: {sessionId.substring(0, 20)}...
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
