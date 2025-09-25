import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import AuthMetricsDashboard from '@/app/components/monitoring/AuthMetricsDashboard'

export default async function MonitoringPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        }
      }
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Authentication Monitoring</h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time authentication metrics and security monitoring
              </p>
            </div>
            <nav className="flex space-x-4">
              <a
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </a>
              <a
                href="/monitoring"
                className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Monitoring
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="py-8">
        <AuthMetricsDashboard />
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>
              Authentication monitoring powered by ThinkHaven •
              Data retention: 7 days •
              Updates every 30 seconds
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export const metadata = {
  title: 'Authentication Monitoring | ThinkHaven',
  description: 'Real-time authentication metrics and security monitoring dashboard',
}