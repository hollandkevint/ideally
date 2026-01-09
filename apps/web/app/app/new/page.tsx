'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import AnimatedLoader from '@/app/components/ui/AnimatedLoader';

const sessionMessages = [
  'Preparing your workspace...',
  'Loading strategic frameworks...',
  'Configuring your analysis tools...',
  'Initializing your session...',
];

export default function NewSessionPage() {
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
        router.push(`/app/session/${session.id}`);
      } catch (error) {
        console.error('Error creating session:', error);
        // Fallback to dashboard on error
        router.push('/app');
      }
    };

    createSession();
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <AnimatedLoader messages={sessionMessages} className="min-h-screen" />
    </div>
  );
}
