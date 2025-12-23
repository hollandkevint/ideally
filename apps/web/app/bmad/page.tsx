'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';

export default function BmadPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Create a new BMad session and redirect to workspace
    const createSession = async () => {
      try {
        // Create a new session in the database
        const { data: session, error } = await supabase
          .from('bmad_sessions')
          .insert([
            {
              user_id: user.id,
              session_type: 'new-idea',
              current_step: 'concept',
              session_data: {},
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Redirect to the new workspace
        router.push(`/workspace/${session.id}`);
      } catch (error) {
        console.error('Error creating session:', error);
        // Fallback to dashboard on error
        router.push('/dashboard');
      }
    };

    createSession();
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Creating your session...</p>
      </div>
    </div>
  );
}
