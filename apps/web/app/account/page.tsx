'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to new /app/account route
export default function AccountRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/app/account');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
