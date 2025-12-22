'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  PlusIcon,
  MoreVertical,
  LogOut,
  Settings,
  Sparkles,
  MessageSquare,
  Lightbulb,
  Folder,
} from 'lucide-react';

interface BmadSession {
  id: string;
  user_id: string;
  session_type: string;
  current_step: string;
  session_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  totalSessions: number;
  totalMessages: number;
  totalInsights: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [sessions, setSessions] = useState<BmadSession[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    totalMessages: 0,
    totalInsights: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSessions();
      fetchStats();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bmad_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const supabase = createClient();

      // Get total sessions
      const { count: sessionCount } = await supabase
        .from('bmad_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Get total messages
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Get total conversations (as proxy for insights)
      const { count: conversationCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      setStats({
        totalSessions: sessionCount || 0,
        totalMessages: messageCount || 0,
        totalInsights: conversationCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleNewSession = () => {
    router.push('/bmad');
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/workspace/${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('bmad_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      // Refresh sessions
      fetchSessions();
      fetchStats();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  const getSessionTitle = (session: BmadSession) => {
    return session.session_data?.title || session.session_data?.concept?.name || 'Untitled Session';
  };

  const getSessionDescription = (session: BmadSession) => {
    return (
      session.session_data?.description ||
      session.session_data?.concept?.description ||
      'No description available'
    );
  };

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Fixed Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 border-r flex flex-col" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
        {/* Logo */}
        <div className="px-4 py-6">
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Thinkhaven</h1>
        </div>

        {/* New Session Button */}
        <div className="px-4 mb-6">
          <Button
            onClick={handleNewSession}
            className="w-full text-white"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
            Recent Sessions
          </h2>
          <div className="space-y-1">
            {sessions.slice(0, 5).map((session) => (
              <button
                key={session.id}
                onClick={() => handleSessionClick(session.id)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted)' }} />
                  <span className="text-sm truncate" style={{ color: 'var(--foreground)' }}>
                    {getSessionTitle(session)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Settings and Account */}
        <div className="border-t px-4 py-4 space-y-2" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => router.push('/settings')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-60 flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-12 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Welcome back, {firstName}
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              Continue your strategic thinking journey
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            <Card className="p-6 border bg-white hover:shadow-sm transition-shadow" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-50">
                  <Sparkles className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {stats.totalSessions}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Sessions</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border bg-white hover:shadow-sm transition-shadow" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-50">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {stats.totalMessages}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Messages</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border bg-white hover:shadow-sm transition-shadow" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-50">
                  <Lightbulb className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {stats.totalInsights}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Insights</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Session Grid or Empty State */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
            </div>
          ) : sessions.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                <Sparkles className="w-12 h-12" style={{ color: 'var(--primary)' }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                Start your first strategic session
              </h2>
              <p className="mb-8 text-center max-w-md" style={{ color: 'var(--muted)' }}>
                Create a new session to begin your strategic thinking journey with AI-powered insights
              </p>
              <Button
                onClick={handleNewSession}
                className="px-8 py-6 text-lg text-white"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                New Session
              </Button>
            </div>
          ) : (
            /* Session Grid */
            <div>
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
                All Sessions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                  <Card
                    key={session.id}
                    className="p-6 border bg-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => handleSessionClick(session.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold mb-2 line-clamp-2" style={{ color: 'var(--foreground)' }}>
                          {getSessionTitle(session)}
                        </h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSessionClick(session.id);
                            }}
                          >
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--muted)' }}>
                      {getSessionDescription(session)}
                    </p>

                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted)' }}>
                      <span className="capitalize">{session.session_type.replace(/-/g, ' ')}</span>
                      <span>{formatTimestamp(session.updated_at)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
