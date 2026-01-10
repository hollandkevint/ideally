'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../../../lib/auth/AuthContext'
import { Button } from '../../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { Menu, User, LogOut, LogIn, UserPlus, ChevronDown } from 'lucide-react'
import { CreditGuard } from '../monetization/CreditGuard'

interface NavigationProps {
  className?: string
}

export default function Navigation({ className = '' }: NavigationProps) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Hide global nav on routes that have their own navigation/header
  const hiddenRoutes = ['/app', '/login', '/signup', '/try']
  if (hiddenRoutes.some(route => pathname?.startsWith(route))) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleLogin = () => {
    router.push('/login')
  }

  const handleSignup = () => {
    router.push('/signup')
  }

  if (loading) {
    return (
      <nav className={`flex items-center justify-between p-4 bg-white border-b ${className}`}>
        <div className="font-bold text-xl text-gray-900">Thinkhaven</div>
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
      </nav>
    )
  }

  return (
    <nav className={`flex items-center justify-between p-4 bg-white border-b ${className}`}>
      {/* Logo/Brand */}
      <div 
        className="font-bold text-xl text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
        onClick={() => router.push('/')}
      >
        Thinkhaven
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/demo')}
          className="text-gray-600 hover:text-gray-900"
        >
          Demo
        </Button>

        {/* Credit Balance - only show for logged-in users */}
        {user && <CreditGuard userId={user.id} />}

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                {user.email?.split('@')[0] || 'User'}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push('/app')}>
                <User className="w-4 h-4 mr-2" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleLogin}
              className="text-gray-700 hover:text-gray-900"
            >
              Login
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/try')}
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium"
            >
              Try Free
            </Button>
            <Button
              onClick={handleSignup}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Sign Up
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Menu className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push('/demo')}>
              Demo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            {user ? (
              <>
                <DropdownMenuItem onClick={() => router.push('/app')}>
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={handleLogin}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/try')}>
                  Try Free
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignup}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}