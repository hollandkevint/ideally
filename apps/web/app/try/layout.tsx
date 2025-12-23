import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Try ThinkHaven - Free AI Business Strategy Session',
  description: 'Chat with Mary, your AI business strategist. Try 5 free messages - no signup required.',
}

export default function TryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header for guest users */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold text-gray-900">ThinkHaven</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Learn more
              </a>
              <a
                href="/auth?mode=login"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </a>
              <a
                href="/auth?mode=signup"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                Sign up
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="h-[calc(100vh-73px)]">
        {children}
      </main>
    </div>
  )
}
