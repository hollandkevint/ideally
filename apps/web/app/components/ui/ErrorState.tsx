'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Wifi, Database, Shield } from 'lucide-react'

interface ErrorStateProps {
  error: string
  onRetry?: () => void
  onSignOut?: () => void
  retryCount?: number
  maxRetries?: number
  isRetrying?: boolean
  showSignOut?: boolean
}

export function ErrorState({
  error,
  onRetry,
  onSignOut,
  retryCount = 0,
  maxRetries = 3,
  isRetrying = false,
  showSignOut = false
}: ErrorStateProps) {
  const getErrorIcon = () => {
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) {
      return <Wifi className="w-6 h-6 text-orange-500" />
    } else if (error.toLowerCase().includes('database') || error.toLowerCase().includes('pgrst')) {
      return <Database className="w-6 h-6 text-red-500" />
    } else if (error.toLowerCase().includes('authentication') || error.toLowerCase().includes('auth')) {
      return <Shield className="w-6 h-6 text-yellow-500" />
    }
    return <AlertTriangle className="w-6 h-6 text-red-500" />
  }

  const getErrorTitle = () => {
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) {
      return 'Connection Problem'
    } else if (error.toLowerCase().includes('database') || error.toLowerCase().includes('pgrst')) {
      return 'Database Error'
    } else if (error.toLowerCase().includes('authentication') || error.toLowerCase().includes('auth')) {
      return 'Authentication Issue'
    }
    return 'Something went wrong'
  }

  const getErrorDescription = () => {
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) {
      return 'Please check your internet connection and try again.'
    } else if (error.toLowerCase().includes('database')) {
      return 'Our database is temporarily unavailable. This is usually resolved quickly.'
    } else if (error.toLowerCase().includes('authentication')) {
      return 'Your session may have expired. Please sign out and sign in again.'
    }
    return 'An unexpected error occurred.'
  }

  const canRetry = retryCount < maxRetries && !isRetrying && onRetry
  const shouldShowSignOut = showSignOut || error.toLowerCase().includes('authentication')

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getErrorIcon()}
            {getErrorTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              {getErrorDescription()}
            </p>
            <p className="text-sm text-gray-500">
              {error}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {canRetry && (
              <Button
                onClick={onRetry}
                disabled={isRetrying}
                className="w-full"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  `Retry ${retryCount > 0 ? `(${retryCount + 1}/${maxRetries})` : ''}`
                )}
              </Button>
            )}

            {shouldShowSignOut && onSignOut && (
              <Button
                variant="outline"
                onClick={onSignOut}
                className="w-full"
              >
                Sign Out
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={() => window.location.reload()}
              className="w-full text-sm"
            >
              Refresh Page
            </Button>
          </div>

          {retryCount >= 2 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="text-yellow-800">
                Multiple attempts failed. If this continues, please contact support or try again later.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ErrorState