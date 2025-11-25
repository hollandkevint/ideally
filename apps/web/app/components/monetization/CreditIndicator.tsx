'use client';

/**
 * CreditIndicator Component
 *
 * Compact header component showing credit balance
 * Links to pricing page for purchase
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CreditBalance {
  balance: number;
  total_granted: number;
  total_purchased: number;
  total_used: number;
}

interface CreditIndicatorProps {
  /** Compact mode shows just the number, expanded shows more context */
  compact?: boolean;
  /** Called when credits are fetched/updated */
  onBalanceChange?: (balance: number) => void;
  /** Custom class name */
  className?: string;
}

export function CreditIndicator({
  compact = false,
  onBalanceChange,
  className = '',
}: CreditIndicatorProps) {
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const response = await fetch('/api/credits/balance');

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const data = await response.json();
      setCredits(data);

      if (onBalanceChange) {
        onBalanceChange(data.balance);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [onBalanceChange]);

  useEffect(() => {
    fetchCredits();

    // Refresh credits every 60 seconds
    const interval = setInterval(fetchCredits, 60000);
    return () => clearInterval(interval);
  }, [fetchCredits]);

  // Refresh credits when window regains focus (e.g., after purchase)
  useEffect(() => {
    const handleFocus = () => {
      fetchCredits();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchCredits]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded h-6 w-20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-xs text-gray-400 ${className}`}>
        --
      </div>
    );
  }

  const balance = credits?.balance ?? 0;
  const isLow = balance <= 1;
  const isEmpty = balance === 0;

  // Determine status color
  const statusColor = isEmpty
    ? 'text-red-600'
    : isLow
      ? 'text-amber-600'
      : 'text-green-600';

  const dotColor = isEmpty
    ? 'bg-red-500'
    : isLow
      ? 'bg-amber-500'
      : 'bg-green-500';

  if (compact) {
    return (
      <Link
        href="/pricing"
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors ${className}`}
        title={`${balance} credits remaining - Click to purchase more`}
      >
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className={`text-sm font-medium ${statusColor}`}>{balance}</span>
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className={`text-sm font-medium ${statusColor}`}>
          {balance} {balance === 1 ? 'credit' : 'credits'}
        </span>
      </div>

      {isEmpty ? (
        <Link href="/pricing">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            Buy Credits
          </Button>
        </Link>
      ) : isLow ? (
        <Link href="/pricing">
          <Button size="sm" variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-50">
            Get More
          </Button>
        </Link>
      ) : null}
    </div>
  );
}

/**
 * Minimal credit badge for tight spaces
 */
export function CreditBadge({ className = '' }: { className?: string }) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch('/api/credits/balance');
        if (response.ok) {
          const data = await response.json();
          setBalance(data.balance);
        }
      } catch {
        // Silently fail for badge
      }
    };

    fetchBalance();
  }, []);

  if (balance === null) return null;

  const bgColor =
    balance === 0
      ? 'bg-red-100 text-red-700'
      : balance <= 1
        ? 'bg-amber-100 text-amber-700'
        : 'bg-green-100 text-green-700';

  return (
    <Link
      href="/pricing"
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${className}`}
    >
      {balance} credits
    </Link>
  );
}
