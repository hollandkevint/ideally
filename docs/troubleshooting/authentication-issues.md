# Authentication Issues Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting steps for resolving common and complex authentication issues in the Google One-Tap signin system. It includes diagnostic procedures, solutions, and prevention strategies.

## Quick Reference

### Common Issues & Solutions

| Issue | Quick Fix | Full Solution |
|-------|-----------|--------------|
| Google signin button not appearing | Check browser console for errors | [Google Script Issues](#google-script-loading-issues) |
| "Invalid ID token" error | Verify token expiration and format | [Token Validation Issues](#token-validation-issues) |
| User signed out unexpectedly | Check session expiration and refresh | [Session Management Issues](#session-management-issues) |
| Authentication works in dev but not prod | Verify domain configuration | [Environment Configuration](#environment-configuration-issues) |
| Slow authentication performance | Check network and optimize components | [Performance Issues](#performance-issues) |

## Diagnostic Tools

### Browser Developer Tools Setup

```javascript
// Enable authentication debugging
localStorage.setItem('debug', 'auth:*')

// Authentication diagnostic helper
window.authDiagnostic = {
  // Check Google Identity Services availability
  checkGoogle: () => {
    console.log('Google available:', !!window.google?.accounts?.id)
    console.log('Google methods:', Object.keys(window.google?.accounts?.id || {}))
  },
  
  // Validate current session
  checkSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    console.log('Session:', data.session ? 'Active' : 'None')
    console.log('User:', data.session?.user?.email || 'Not authenticated')
    console.log('Expires:', new Date(data.session?.expires_at * 1000))
    if (error) console.error('Session error:', error)
  },
  
  // Test token validation
  validateToken: (token) => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) throw new Error('Invalid JWT format')
      
      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1]))
      
      console.log('Token header:', header)
      console.log('Token payload:', payload)
      console.log('Token expires:', new Date(payload.exp * 1000))
      console.log('Token valid:', payload.exp > Date.now() / 1000)
      
      return { header, payload, valid: payload.exp > Date.now() / 1000 }
    } catch (error) {
      console.error('Token validation error:', error)
      return { valid: false, error }
    }
  },
  
  // Check environment configuration
  checkConfig: () => {
    console.log('Environment:', process.env.NODE_ENV || 'development')
    console.log('Google Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 20) + '...')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Current domain:', window.location.origin)
    console.log('Secure context:', window.isSecureContext)
  },
  
  // Network connectivity test
  testConnectivity: async () => {
    const tests = [
      { name: 'Google GSI', url: 'https://accounts.google.com/gsi/client' },
      { name: 'Supabase', url: process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/' }
    ]
    
    for (const test of tests) {
      try {
        const start = Date.now()
        const response = await fetch(test.url, { method: 'HEAD' })
        const duration = Date.now() - start
        console.log(`${test.name}: ${response.ok ? 'OK' : 'FAIL'} (${duration}ms)`)
      } catch (error) {
        console.error(`${test.name}: ERROR - ${error.message}`)
      }
    }
  }
}

// Auto-run basic diagnostics
console.log('Authentication Diagnostic Tools loaded. Run window.authDiagnostic.checkConfig() to start.')
```

### Network Analysis

```bash
# Check DNS resolution
nslookup accounts.google.com
nslookup your-supabase-url.supabase.co

# Test SSL certificate
openssl s_client -connect accounts.google.com:443 -servername accounts.google.com

# Check CORS headers
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-api-endpoint.com

# Performance testing
curl -w "@curl-format.txt" -o /dev/null -s "https://accounts.google.com/gsi/client"

# curl-format.txt contents:
# time_namelookup:    %{time_namelookup}\n
# time_connect:       %{time_connect}\n
# time_appconnect:    %{time_appconnect}\n
# time_pretransfer:   %{time_pretransfer}\n
# time_redirect:      %{time_redirect}\n
# time_starttransfer: %{time_starttransfer}\n
# time_total:         %{time_total}\n
```

## Issue Categories

### Google Script Loading Issues

#### Symptoms
- Google signin button doesn't appear
- Console error: "Failed to load Google Identity Services"
- Network errors for accounts.google.com requests
- Blank screen where signin should be

#### Root Causes & Solutions

**1. Network Connectivity Issues**
```javascript
// Diagnostic
async function testGoogleConnectivity() {
  try {
    const response = await fetch('https://accounts.google.com/gsi/client', {
      method: 'HEAD',
      mode: 'no-cors'
    })
    console.log('Google GSI reachable')
  } catch (error) {
    console.error('Cannot reach Google GSI:', error)
  }
}

// Solution: Implement retry with exponential backoff
async function loadGoogleScriptWithRetry(maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await loadGoogleScript()
      return
    } catch (error) {
      console.warn(`Google script load attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to load Google script after ${maxRetries} attempts`)
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
}
```

**2. Content Security Policy (CSP) Issues**
```html
<!-- Required CSP directives -->
<meta http-equiv="Content-Security-Policy" 
      content="script-src 'self' https://accounts.google.com; 
               frame-src 'self' https://accounts.google.com; 
               connect-src 'self' https://accounts.google.com;">

<!-- For Next.js, add to next.config.js -->
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' https://accounts.google.com; frame-src 'self' https://accounts.google.com;"
          }
        ]
      }
    ]
  }
}
```

**3. Ad Blockers and Privacy Extensions**
```javascript
// Detection and user guidance
function detectAdBlocker() {
  return new Promise((resolve) => {
    const testAd = document.createElement('div')
    testAd.innerHTML = '&nbsp;'
    testAd.className = 'adsbox'
    testAd.style.position = 'absolute'
    testAd.style.left = '-10000px'
    document.body.appendChild(testAd)
    
    setTimeout(() => {
      const isBlocked = testAd.offsetHeight === 0
      document.body.removeChild(testAd)
      resolve(isBlocked)
    }, 100)
  })
}

// Usage
detectAdBlocker().then(blocked => {
  if (blocked) {
    showUserMessage('Ad blocker detected. Please disable it for authentication to work properly.')
  }
})
```

**4. HTTPS Requirements in Production**
```javascript
// Validate secure context
function validateSecureContext() {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    throw new Error('Google Identity Services requires HTTPS in production')
  }
  
  if (!window.isSecureContext) {
    console.warn('Not in secure context. Some features may not work.')
  }
}

// Auto-redirect to HTTPS in production
if (location.protocol !== 'https:' && 
    location.hostname !== 'localhost' && 
    location.hostname !== '127.0.0.1') {
  location.replace('https:' + window.location.href.substring(window.location.protocol.length))
}
```

### Token Validation Issues

#### Symptoms
- "Invalid ID token" error messages
- Authentication appears successful but user data is missing
- Intermittent authentication failures
- Token-related console errors

#### Root Causes & Solutions

**1. Token Expiration**
```javascript
// Enhanced token validation
function validateToken(credential) {
  try {
    const [header, payload, signature] = credential.split('.')
    
    if (!header || !payload || !signature) {
      throw new Error('Invalid JWT structure')
    }
    
    const decodedPayload = JSON.parse(atob(payload))
    const now = Math.floor(Date.now() / 1000)
    
    // Check expiration
    if (decodedPayload.exp < now) {
      throw new Error(`Token expired. Exp: ${decodedPayload.exp}, Now: ${now}`)
    }
    
    // Check not before
    if (decodedPayload.nbf && decodedPayload.nbf > now) {
      throw new Error(`Token not valid yet. NBF: ${decodedPayload.nbf}, Now: ${now}`)
    }
    
    // Check audience
    const expectedAud = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (decodedPayload.aud !== expectedAud) {
      throw new Error(`Invalid audience. Expected: ${expectedAud}, Got: ${decodedPayload.aud}`)
    }
    
    // Check issuer
    const validIssuers = ['https://accounts.google.com', 'accounts.google.com']
    if (!validIssuers.includes(decodedPayload.iss)) {
      throw new Error(`Invalid issuer: ${decodedPayload.iss}`)
    }
    
    return decodedPayload
  } catch (error) {
    console.error('Token validation failed:', error)
    throw error
  }
}

// Usage with error handling
try {
  const payload = validateToken(credential)
  await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: credential
  })
} catch (error) {
  handleTokenError(error)
}
```

**2. Nonce Mismatch**
```javascript
// Secure nonce management
class NonceManager {
  private currentNonce: string | null = null
  
  generate(): string {
    this.currentNonce = this.createSecureNonce()
    return this.currentNonce
  }
  
  validate(receivedNonce: string): boolean {
    if (!this.currentNonce) {
      console.error('No nonce to validate against')
      return false
    }
    
    const isValid = receivedNonce === this.currentNonce
    if (isValid) {
      this.currentNonce = null // Consume nonce
    }
    
    return isValid
  }
  
  private createSecureNonce(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
}

const nonceManager = new NonceManager()

// Use in Google config
const config = await createGoogleConfig((response) => {
  if (!nonceManager.validate(response.nonce)) {
    throw new Error('Nonce validation failed - possible CSRF attack')
  }
  // Continue with authentication
}, nonceManager.generate())
```

**3. Clock Skew Issues**
```javascript
// Handle clock skew tolerance
function validateTokenWithSkew(credential, skewToleranceSeconds = 60) {
  const [, payload] = credential.split('.')
  const decodedPayload = JSON.parse(atob(payload))
  const now = Math.floor(Date.now() / 1000)
  
  // Allow some tolerance for clock skew
  const expWithTolerance = decodedPayload.exp + skewToleranceSeconds
  const iatWithTolerance = decodedPayload.iat - skewToleranceSeconds
  
  if (expWithTolerance < now) {
    throw new Error(`Token expired even with tolerance. Exp: ${decodedPayload.exp}, Now: ${now}`)
  }
  
  if (iatWithTolerance > now) {
    throw new Error(`Token issued in future even with tolerance. IAT: ${decodedPayload.iat}, Now: ${now}`)
  }
  
  return decodedPayload
}
```

### Session Management Issues

#### Symptoms
- User unexpectedly signed out
- Session not persisting across browser tabs
- Authentication state inconsistencies
- Session-related errors in console

#### Root Causes & Solutions

**1. Session Storage Corruption**
```javascript
// Session storage health check and repair
class SessionHealthManager {
  async checkAndRepairSession() {
    try {
      // Check localStorage for corruption
      const authData = localStorage.getItem('supabase.auth.token')
      if (authData) {
        JSON.parse(authData) // Validate JSON
      }
      
      // Validate current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.warn('Session validation error:', error)
        this.clearCorruptedSession()
        return null
      }
      
      if (session && this.isSessionExpired(session)) {
        console.info('Session expired, attempting refresh')
        return await this.refreshSession()
      }
      
      return session
    } catch (error) {
      console.error('Session health check failed:', error)
      this.clearCorruptedSession()
      return null
    }
  }
  
  private isSessionExpired(session): boolean {
    return session.expires_at < Math.floor(Date.now() / 1000)
  }
  
  private async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
      return data.session
    } catch (error) {
      console.error('Session refresh failed:', error)
      this.clearCorruptedSession()
      return null
    }
  }
  
  private clearCorruptedSession() {
    localStorage.removeItem('supabase.auth.token')
    sessionStorage.removeItem('supabase.auth.token')
    console.info('Cleared corrupted session data')
  }
}
```

**2. Multi-Tab Synchronization Issues**
```javascript
// Enhanced cross-tab session synchronization
class CrossTabSessionSync {
  constructor() {
    this.setupStorageListener()
    this.setupVisibilityListener()
  }
  
  private setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'supabase.auth.token') {
        if (event.newValue === null) {
          // Session cleared in another tab
          this.handleRemoteSignOut()
        } else if (event.oldValue !== event.newValue) {
          // Session updated in another tab
          this.handleRemoteSessionUpdate(event.newValue)
        }
      }
    })
  }
  
  private setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Tab became active, check session health
        this.validateSessionOnFocus()
      }
    })
  }
  
  private async handleRemoteSignOut() {
    console.info('Remote signout detected')
    // Update local auth state without triggering storage events
    await supabase.auth.signOut({ scope: 'local' })
  }
  
  private async handleRemoteSessionUpdate(newValue: string) {
    try {
      const newSession = JSON.parse(newValue)
      console.info('Remote session update detected')
      // Update local session
      await supabase.auth.setSession(newSession)
    } catch (error) {
      console.error('Failed to parse remote session update:', error)
    }
  }
  
  private async validateSessionOnFocus() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session && this.isNearExpiry(session)) {
      await supabase.auth.refreshSession()
    }
  }
  
  private isNearExpiry(session, thresholdMinutes = 5): boolean {
    const expiryTime = session.expires_at * 1000
    const threshold = thresholdMinutes * 60 * 1000
    return (expiryTime - Date.now()) < threshold
  }
}
```

**3. Memory Leaks in Auth Listeners**
```javascript
// Proper cleanup of auth state listeners
class AuthListenerManager {
  private listeners: Map<string, () => void> = new Map()
  
  addListener(id: string, cleanup: () => void) {
    // Clean up existing listener with same ID
    this.removeListener(id)
    this.listeners.set(id, cleanup)
  }
  
  removeListener(id: string) {
    const existingCleanup = this.listeners.get(id)
    if (existingCleanup) {
      existingCleanup()
      this.listeners.delete(id)
    }
  }
  
  removeAllListeners() {
    this.listeners.forEach(cleanup => cleanup())
    this.listeners.clear()
  }
}

// Usage in components
const listenerManager = new AuthListenerManager()

useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      // Handle auth state changes
    }
  )
  
  listenerManager.addListener('auth-state', () => subscription.unsubscribe())
  
  return () => {
    listenerManager.removeListener('auth-state')
  }
}, [])
```

### Environment Configuration Issues

#### Symptoms
- Authentication works in development but fails in production
- CORS errors in production environment
- Domain mismatch errors
- Missing environment variables

#### Root Causes & Solutions

**1. Environment Variable Configuration**
```bash
# Development environment (.env.local)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-development.apps.googleusercontent.com
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...dev-key

# Production environment
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-production.apps.googleusercontent.com
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...prod-key
```

```javascript
// Environment validation utility
function validateEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }
  
  // Validate Google Client ID format
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId.match(/^\d+-.+\.apps\.googleusercontent\.com$/)) {
    console.warn('Google Client ID format may be incorrect')
  }
  
  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl.match(/^https:\/\/[a-z]+\.supabase\.co$/)) {
    console.warn('Supabase URL format may be incorrect')
  }
  
  console.info('Environment validation passed')
}
```

**2. Domain Configuration**
```javascript
// Domain validation and configuration
function validateDomainConfiguration() {
  const currentDomain = window.location.origin
  const allowedDomains = {
    development: ['http://localhost:3000', 'http://localhost:3001'],
    production: ['https://thinkhaven.co', 'https://app.thinkhaven.co']
  }
  
  const env = process.env.NODE_ENV || 'development'
  const allowed = allowedDomains[env]
  
  if (!allowed.includes(currentDomain)) {
    console.warn(`Domain ${currentDomain} not in allowed list for ${env}:`, allowed)
  }
  
  // Check Google OAuth configuration
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  console.info(`Using Google Client ID for domain ${currentDomain}:`, clientId.substring(0, 20) + '...')
}

// Automatic domain-based configuration
function getEnvironmentConfig() {
  const hostname = window.location.hostname
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return {
      environment: 'development',
      requireHttps: false,
      corsOrigin: 'http://localhost:3000'
    }
  }
  
  if (hostname.endsWith('.vercel.app')) {
    return {
      environment: 'preview',
      requireHttps: true,
      corsOrigin: `https://${hostname}`
    }
  }
  
  return {
    environment: 'production',
    requireHttps: true,
    corsOrigin: 'https://thinkhaven.co'
  }
}
```

**3. CORS Configuration**
```javascript
// CORS debugging and configuration
async function debugCors() {
  const testEndpoint = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/'
  
  try {
    const response = await fetch(testEndpoint, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'apikey'
      }
    })
    
    console.log('CORS preflight response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers)
    })
    
    if (!response.ok) {
      throw new Error(`CORS preflight failed: ${response.status}`)
    }
  } catch (error) {
    console.error('CORS test failed:', error)
  }
}

// Next.js CORS configuration
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NODE_ENV === 'development' ? '*' : 'https://thinkhaven.co' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
        ]
      }
    ]
  }
}
```

### Performance Issues

#### Symptoms
- Slow Google signin initialization (>2 seconds)
- Authentication flow takes longer than 5 seconds
- High memory usage during authentication
- Poor performance on mobile devices

#### Root Causes & Solutions

**1. Component Optimization**
```javascript
// Memoized authentication components
const GoogleOneTapSigninMemo = React.memo(GoogleOneTapSignin, (prevProps, nextProps) => {
  return prevProps.onSuccess === nextProps.onSuccess && 
         prevProps.onError === nextProps.onError
})

// Lazy loading for non-critical auth components
const AuthDebugPanel = React.lazy(() => 
  import('./AuthDebugPanel').then(module => ({
    default: module.AuthDebugPanel
  }))
)

// Optimized AuthProvider with context splitting
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Split context to prevent unnecessary re-renders
  const authValue = useMemo(() => ({ user, loading }), [user, loading])
  const authActions = useMemo(() => ({ 
    signOut: () => supabase.auth.signOut(),
    refreshSession: () => supabase.auth.refreshSession()
  }), [])
  
  return (
    <AuthStateContext.Provider value={authValue}>
      <AuthActionsContext.Provider value={authActions}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  )
}
```

**2. Network Optimization**
```javascript
// Preload Google Identity Services
export function preloadGoogleScript() {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = 'https://accounts.google.com/gsi/client'
  link.as = 'script'
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}

// Optimized script loading with timeout
async function loadGoogleScriptOptimized(timeout = 10000) {
  return Promise.race([
    loadGoogleScript(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Google script load timeout')), timeout)
    )
  ])
}

// Connection-aware loading
function loadBasedOnConnection() {
  if ('connection' in navigator) {
    const connection = navigator.connection
    
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      // Use simplified authentication for slow connections
      return loadFallbackAuth()
    }
  }
  
  return loadGoogleScriptOptimized()
}
```

**3. Memory Management**
```javascript
// Memory-conscious authentication manager
class MemoryEfficientAuthManager {
  private authListeners = new Set()
  private timers = new Set()
  private abortController = new AbortController()
  
  async initialize() {
    try {
      await this.loadGoogleScript()
      this.setupAuthListeners()
      this.setupPeriodicCleanup()
    } catch (error) {
      this.cleanup()
      throw error
    }
  }
  
  private setupPeriodicCleanup() {
    const cleanupInterval = setInterval(() => {
      this.performMemoryCleanup()
    }, 300000) // Every 5 minutes
    
    this.timers.add(cleanupInterval)
  }
  
  private performMemoryCleanup() {
    // Clear expired tokens from memory
    const now = Date.now()
    this.tokenCache?.forEach((token, key) => {
      if (token.expiresAt < now) {
        this.tokenCache.delete(key)
      }
    })
    
    // Trigger garbage collection hint
    if (window.gc) {
      window.gc()
    }
  }
  
  cleanup() {
    this.abortController.abort()
    this.authListeners.forEach(unsubscribe => unsubscribe())
    this.timers.forEach(timer => clearInterval(timer))
    this.authListeners.clear()
    this.timers.clear()
  }
}
```

## Error Code Reference

### Google Identity Services Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `popup_closed_by_user` | User closed the popup | Handle gracefully, offer alternative |
| `popup_failed_to_open` | Popup blocked or failed | Use redirect flow instead |
| `invalid_request` | Request parameters invalid | Check Google Client ID and configuration |
| `network_error` | Network connectivity issue | Implement retry logic |
| `unknown_error` | Generic error from Google | Log details and contact support |

### Supabase Auth Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `invalid_grant` | Invalid ID token | Validate token format and expiration |
| `signup_disabled` | User registration disabled | Enable signup in Supabase dashboard |
| `email_not_confirmed` | Email requires verification | Handle email confirmation flow |
| `too_many_requests` | Rate limit exceeded | Implement exponential backoff |
| `invalid_credentials` | Invalid authentication | Check token and user data |

## Prevention Strategies

### Monitoring Setup
```javascript
// Comprehensive error tracking
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('auth') || 
      event.error?.message?.includes('google') ||
      event.error?.message?.includes('supabase')) {
    
    // Send to error tracking service
    errorTracker.captureException(event.error, {
      context: 'authentication',
      user: getCurrentUser(),
      timestamp: Date.now(),
      url: window.location.href
    })
  }
})

// Custom auth error handler
export function handleAuthError(error: Error, context: string) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  }
  
  // Log locally
  console.error('Auth Error:', errorInfo)
  
  // Send to monitoring service
  fetch('/api/auth-errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorInfo)
  }).catch(console.error)
  
  // Show user-friendly message
  showUserErrorMessage(getErrorMessage(error))
}
```

### Health Checks
```javascript
// Periodic authentication health check
export class AuthHealthChecker {
  private interval: NodeJS.Timeout | null = null
  
  start(intervalMs = 300000) { // 5 minutes
    this.interval = setInterval(() => {
      this.performHealthCheck()
    }, intervalMs)
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
  
  private async performHealthCheck() {
    try {
      // Check Google Services availability
      if (!window.google?.accounts?.id) {
        console.warn('Google Identity Services not available')
        await this.attemptGoogleReload()
      }
      
      // Check session validity
      const { data: { session } } = await supabase.auth.getSession()
      if (session && this.isSessionNearExpiry(session)) {
        await supabase.auth.refreshSession()
      }
      
      // Check network connectivity
      await this.testNetworkConnectivity()
      
    } catch (error) {
      console.error('Auth health check failed:', error)
      this.handleHealthCheckFailure(error)
    }
  }
  
  private async attemptGoogleReload() {
    try {
      await loadGoogleScript()
    } catch (error) {
      console.error('Failed to reload Google script:', error)
    }
  }
  
  private isSessionNearExpiry(session, thresholdMinutes = 10): boolean {
    const expiryTime = session.expires_at * 1000
    const threshold = thresholdMinutes * 60 * 1000
    return (expiryTime - Date.now()) < threshold
  }
  
  private async testNetworkConnectivity() {
    const testUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/'
    const response = await fetch(testUrl, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) {
      throw new Error(`Network test failed: ${response.status}`)
    }
  }
  
  private handleHealthCheckFailure(error: Error) {
    // Implement escalation strategy
    if (this.consecutiveFailures > 3) {
      this.notifyAdministrators(error)
    }
  }
}
```

## Getting Help

### Support Channels
- **Documentation**: Check the [Authentication Testing Guide](./authentication-testing-guide.md)
- **Issue Tracker**: Create an issue with detailed error information
- **Debug Mode**: Enable with `localStorage.setItem('debug', 'auth:*')`
- **Community**: Search Stack Overflow with tags: `google-oauth`, `supabase-auth`

### Information to Include When Reporting Issues
1. Error messages (exact text)
2. Browser and version
3. Operating system
4. Steps to reproduce
5. Network conditions
6. Console logs with debug enabled
7. Environment configuration (without sensitive data)

Remember: Most authentication issues can be resolved by systematically checking network connectivity, environment configuration, and token validity. Use the diagnostic tools provided in this guide to quickly identify and resolve common problems.