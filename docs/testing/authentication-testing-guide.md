# Authentication Testing Guide

## Overview

This guide provides comprehensive documentation for testing the Google One-Tap authentication system implemented in the web application. It covers testing procedures, scenarios, troubleshooting, and monitoring recommendations.

## Table of Contents

1. [Testing Architecture](#testing-architecture)
2. [Test Categories](#test-categories)
3. [Testing Procedures](#testing-procedures)
4. [Test Execution](#test-execution)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Performance Benchmarks](#performance-benchmarks)
7. [Monitoring and Alerting](#monitoring-and-alerting)
8. [Best Practices](#best-practices)

## Testing Architecture

### Test Pyramid Structure

```
┌─────────────────┐
│   E2E Tests     │ ← Cross-browser, full user flows
├─────────────────┤
│Integration Tests│ ← Component interactions, API calls  
├─────────────────┤
│  Unit Tests     │ ← Individual components, utilities
└─────────────────┘
```

### Test File Organization

```
tests/
├── components/
│   └── auth/
│       ├── GoogleOneTapSignin.test.tsx
│       └── login.test.tsx
├── lib/
│   └── auth/
│       ├── AuthContext.test.tsx
│       ├── supabase-integration.test.ts
│       └── nonce-generation.test.ts
├── integration/
│   ├── google-auth-flow.test.ts
│   ├── auth-error-scenarios.test.ts
│   └── session-management.test.ts
├── e2e/
│   └── cross-environment-validation.test.ts
├── performance/
│   └── auth-performance.test.ts
├── security/
│   └── auth-security-validation.test.ts
└── regression/
    └── auth-regression.test.ts
```

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual components and utilities in isolation

**Coverage**:
- GoogleOneTapSignin component rendering and behavior
- AuthContext state management
- Nonce generation and security functions
- Supabase client integration methods

**Key Scenarios**:
- Component initialization with various props
- Authentication state transitions
- Error handling for invalid inputs
- Secure nonce generation and hashing

### 2. Integration Tests

**Purpose**: Test component interactions and complete authentication flows

**Coverage**:
- End-to-end Google authentication flow
- Session management across components
- Error scenario handling
- Authentication state synchronization

**Key Scenarios**:
- New user registration flow
- Existing user login flow
- Network failure recovery
- Session persistence and expiration

### 3. Performance Tests

**Purpose**: Validate authentication performance meets acceptance criteria

**Coverage**:
- Google One-Tap initialization time (<2 seconds)
- Complete authentication flow time (<5 seconds)
- Session validation response time (<500ms)
- Concurrent user authentication scenarios

**Key Scenarios**:
- Page load performance impact (<10% increase)
- Mobile device performance validation
- Network condition variations
- Load testing with multiple simultaneous users

### 4. Security Tests

**Purpose**: Validate authentication security measures and prevent vulnerabilities

**Coverage**:
- Nonce-based CSRF protection
- JWT token validation
- Session security and cookie configuration
- RLS policy enforcement

**Key Scenarios**:
- Replay attack prevention
- Token tampering detection
- Unauthorized data access prevention
- Input sanitization validation

### 5. Cross-Environment Tests

**Purpose**: Ensure authentication works across development and production environments

**Coverage**:
- Environment-specific configuration validation
- Domain-specific Google Client ID settings
- SSL/HTTPS requirements
- CDN and caching compatibility

**Key Scenarios**:
- localhost development environment
- Production domain authentication
- Subdomain and port configuration
- Network condition variations

### 6. Regression Tests

**Purpose**: Ensure existing functionality continues to work with authentication changes

**Coverage**:
- User-dependent feature accessibility
- Workspace creation and management
- Conversation and BMad session functionality
- Data export and external integrations

**Key Scenarios**:
- Feature availability based on authentication state
- Backward compatibility with existing user data
- API endpoint authorization
- Authentication state preservation

## Testing Procedures

### Pre-Test Setup

1. **Environment Variables**
   ```bash
   export NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"
   export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```

2. **Test Database Setup**
   - Use dedicated test Supabase project
   - Ensure RLS policies are properly configured
   - Create test user accounts with known credentials

3. **Google OAuth Setup**
   - Configure test Google OAuth application
   - Add localhost and test domains to authorized origins
   - Set up test Google accounts for authentication testing

### Test Execution Commands

```bash
# Run all tests
npm test

# Run specific test categories
npm test tests/components/
npm test tests/integration/
npm test tests/performance/
npm test tests/security/

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode for development
npm run test:watch

# Run E2E tests
npm run test:e2e
```

### Test Data Management

**Mock Users**:
```typescript
const mockUsers = {
  newUser: {
    email: 'newuser@test.com',
    isNewUser: true
  },
  existingUser: {
    email: 'existing@test.com',
    workspaceId: 'ws-123',
    conversations: ['conv-1', 'conv-2']
  },
  adminUser: {
    email: 'admin@test.com',
    role: 'admin',
    permissions: ['read', 'write', 'admin']
  }
}
```

**Test Credentials**:
- Use deterministic nonces for consistent testing
- Mock Google JWT tokens with known payloads
- Generate test sessions with controlled expiration times

## Test Execution

### Continuous Integration Pipeline

```yaml
name: Authentication Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit
      - name: Run integration tests
        run: npm run test:integration
      - name: Run security tests
        run: npm run test:security
      - name: Run performance tests
        run: npm run test:performance
      - name: Generate coverage report
        run: npm run test:coverage
```

### Manual Testing Checklist

**Pre-Release Validation**:
- [ ] All automated tests passing
- [ ] Manual Google signin flow in development
- [ ] Manual Google signin flow in production
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)
- [ ] Mobile device authentication testing
- [ ] Session persistence across browser restarts
- [ ] Error scenario validation
- [ ] Performance benchmarks within acceptable limits

## Troubleshooting Guide

### Common Issues

#### 1. Google Script Loading Failures

**Symptoms**:
- "Failed to load Google Identity Services" error
- Google signin button not appearing
- Network console errors related to accounts.google.com

**Solutions**:
```typescript
// Check if Google script is blocked
if (!window.google?.accounts?.id) {
  console.error('Google Identity Services not loaded')
  // Implement fallback or error handling
}

// Verify domain is whitelisted in Google OAuth configuration
// Check network connectivity and firewall settings
// Validate CORS configuration for cross-origin requests
```

#### 2. Authentication Token Issues

**Symptoms**:
- "Invalid ID token" errors
- Authentication succeeds but user data is missing
- Token validation failures in Supabase

**Solutions**:
```typescript
// Verify token structure and claims
const tokenParts = credential.split('.')
if (tokenParts.length !== 3) {
  throw new Error('Invalid JWT structure')
}

// Check token expiration
const payload = JSON.parse(atob(tokenParts[1]))
if (payload.exp < Date.now() / 1000) {
  throw new Error('Token expired')
}

// Validate audience and issuer
if (payload.aud !== expectedClientId) {
  throw new Error('Invalid token audience')
}
```

#### 3. Session Management Problems

**Symptoms**:
- User automatically signed out
- Session not persisting across browser tabs
- Inconsistent authentication state

**Solutions**:
```typescript
// Check localStorage/sessionStorage for corruption
try {
  const sessionData = localStorage.getItem('supabase.auth.token')
  JSON.parse(sessionData) // Validate JSON structure
} catch (error) {
  // Clear corrupted data
  localStorage.removeItem('supabase.auth.token')
}

// Implement session refresh logic
if (session.expires_at < Date.now()) {
  await supabase.auth.refreshSession()
}

// Handle storage events for multi-tab synchronization
window.addEventListener('storage', (event) => {
  if (event.key === 'supabase.auth.token') {
    // Update authentication state
  }
})
```

#### 4. Environment Configuration Issues

**Symptoms**:
- Google signin works in development but not production
- CORS errors in production
- Missing environment variables

**Solutions**:
```bash
# Verify environment variables
echo $NEXT_PUBLIC_GOOGLE_CLIENT_ID
echo $NEXT_PUBLIC_SUPABASE_URL

# Check domain configuration
# Production: https://thinkhaven.co
# Development: http://localhost:3000

# Validate SSL certificate in production
openssl s_client -connect thinkhaven.co:443 -servername thinkhaven.co
```

#### 5. Performance Issues

**Symptoms**:
- Slow Google signin initialization
- Authentication flow takes longer than 5 seconds
- High memory usage during authentication

**Solutions**:
```typescript
// Implement performance monitoring
const startTime = performance.now()
await signInWithGoogle()
const duration = performance.now() - startTime
console.log(`Authentication took ${duration}ms`)

// Optimize component rendering
const GoogleSigninMemo = React.memo(GoogleOneTapSignin)

// Implement lazy loading for non-critical components
const DataExport = React.lazy(() => import('./DataExport'))
```

### Debugging Tools

**Browser DevTools**:
- Network tab: Monitor API calls and response times
- Console: Check for JavaScript errors and warnings
- Application tab: Inspect localStorage/sessionStorage
- Security tab: Validate HTTPS and certificate status

**Logging and Monitoring**:
```typescript
// Enable debug logging
localStorage.setItem('debug', 'auth:*')

// Custom authentication logger
const authLogger = {
  info: (message, data) => console.log(`[AUTH] ${message}`, data),
  error: (message, error) => console.error(`[AUTH] ${message}`, error),
  warn: (message, data) => console.warn(`[AUTH] ${message}`, data)
}

// Performance monitoring
const perfLogger = {
  markStart: (name) => performance.mark(`${name}-start`),
  markEnd: (name) => {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
  }
}
```

## Performance Benchmarks

### Acceptance Criteria Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Google One-Tap Initialization | <2 seconds | From script load to ready |
| Authentication Flow Completion | <5 seconds | From credential to authenticated |
| Session Validation | <500ms | getSession() response time |
| Page Load Impact | <10% increase | Baseline vs with auth |

### Monitoring Implementation

```typescript
// Performance tracking
class AuthPerformanceMonitor {
  private metrics: Map<string, number> = new Map()
  
  startTimer(name: string): void {
    this.metrics.set(name, performance.now())
  }
  
  endTimer(name: string): number {
    const start = this.metrics.get(name)
    if (!start) return 0
    
    const duration = performance.now() - start
    this.metrics.delete(name)
    
    // Send to analytics service
    this.sendMetric(name, duration)
    
    return duration
  }
  
  private sendMetric(name: string, duration: number): void {
    // Implementation depends on your analytics service
    analytics.track('auth_performance', {
      metric: name,
      duration,
      timestamp: Date.now()
    })
  }
}
```

## Monitoring and Alerting

### Key Metrics to Track

1. **Authentication Success Rate**
   - Target: >95%
   - Alert threshold: <90%

2. **Authentication Flow Performance**
   - Target: <5 seconds average
   - Alert threshold: >10 seconds average

3. **Error Rates**
   - Target: <5% error rate
   - Alert threshold: >10% error rate

4. **Session Management**
   - Target: <1% session failure rate
   - Alert threshold: >5% session failure rate

### Alert Configuration

```json
{
  "alerts": [
    {
      "name": "auth_success_rate_low",
      "condition": "auth_success_rate < 0.95",
      "severity": "warning",
      "channels": ["slack", "email"]
    },
    {
      "name": "auth_response_time_high",
      "condition": "avg(auth_flow_duration) > 10000",
      "severity": "critical",
      "channels": ["slack", "pagerduty"]
    },
    {
      "name": "auth_error_rate_high",
      "condition": "auth_error_rate > 0.10",
      "severity": "warning",
      "channels": ["slack"]
    }
  ]
}
```

## Best Practices

### Test Development

1. **Write Tests First**: Use TDD approach for new authentication features
2. **Mock External Dependencies**: Always mock Google APIs and Supabase calls
3. **Test Error Conditions**: Cover both happy path and error scenarios
4. **Use Realistic Data**: Test with data that mirrors production scenarios
5. **Keep Tests Independent**: Each test should be able to run in isolation

### Test Maintenance

1. **Regular Updates**: Update tests when authentication flow changes
2. **Performance Monitoring**: Track test execution time and optimize slow tests
3. **Flaky Test Management**: Identify and fix non-deterministic test failures
4. **Coverage Monitoring**: Maintain >90% test coverage for authentication code
5. **Documentation Updates**: Keep testing documentation current with changes

### Security Testing

1. **Regular Security Audits**: Perform monthly security test reviews
2. **Penetration Testing**: Include authentication in security assessments
3. **Dependency Updates**: Regularly update authentication dependencies
4. **Vulnerability Scanning**: Use automated tools to detect security issues
5. **Access Control Testing**: Verify proper authorization for all features

### Performance Testing

1. **Baseline Establishment**: Document current performance metrics
2. **Regression Detection**: Alert on performance degradation
3. **Load Testing**: Test with realistic user loads
4. **Mobile Testing**: Include mobile-specific performance validation
5. **Network Condition Testing**: Test with various network speeds

## Conclusion

This authentication testing guide provides a comprehensive framework for validating the Google One-Tap authentication system. Regular execution of these test procedures, combined with proper monitoring and alerting, ensures a reliable and secure authentication experience for users.

For questions or issues not covered in this guide, please refer to the project's issue tracker or contact the development team.