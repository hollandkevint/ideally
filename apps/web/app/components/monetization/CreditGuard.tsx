'use client';

/**
 * CreditGuard Component
 *
 * Displays credit balance and trial limit messaging
 * Shows feedback form when user runs out of credits
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackForm } from './FeedbackForm';

interface CreditGuardProps {
  userId: string;
  onCreditsUpdated?: (balance: number) => void;
}

interface CreditBalance {
  balance: number;
  total_granted: number;
  total_purchased: number;
  total_used: number;
}

export function CreditGuard({ userId, onCreditsUpdated }: CreditGuardProps) {
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCredits();
  }, [userId]);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/credits/balance');

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const data = await response.json();
      setCredits(data);

      if (onCreditsUpdated) {
        onCreditsUpdated(data.balance);
      }

      // Show feedback form if user has no credits
      if (data.balance === 0 && data.total_used > 0) {
        setShowFeedback(true);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600" />
        <span>Loading credits...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-2 text-sm text-red-600">
        Error loading credits
      </div>
    );
  }

  if (!credits) {
    return null;
  }

  // Zero credits - show trial ended message
  if (credits.balance === 0) {
    return (
      <div className="p-4 space-y-4">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-lg">Trial Complete</CardTitle>
            <CardDescription>
              You've used all {credits.total_granted} free sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-700">
              Ready to continue your strategic thinking journey?
            </p>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">What you've unlocked:</p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>BMad Method frameworks</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>AI-powered strategic coaching</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Canvas visual workspace</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>PDF & Markdown exports</span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled
            >
              Purchase Credits (Coming Soon)
            </Button>
            <p className="text-xs text-center text-gray-600">
              We're finalizing pricing. Share your feedback below!
            </p>
          </CardFooter>
        </Card>

        {showFeedback && (
          <FeedbackForm
            userId={userId}
            onSubmitted={() => setShowFeedback(false)}
          />
        )}
      </div>
    );
  }

  // Has credits - show balance indicator
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          credits.balance === 1 ? 'bg-amber-500' : 'bg-green-500'
        }`} />
        <span className="text-sm font-medium">
          {credits.balance} {credits.balance === 1 ? 'session' : 'sessions'} remaining
        </span>
      </div>

      {credits.balance === 1 && (
        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          Last free session!
        </span>
      )}
    </div>
  );
}
