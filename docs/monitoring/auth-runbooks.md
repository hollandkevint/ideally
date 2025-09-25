# Authentication Monitoring Runbooks

## Table of Contents

1. [Authentication Success Rate Drop](#authentication-success-rate-drop)
2. [High Authentication Latency](#high-authentication-latency)
3. [PKCE Verification Errors](#pkce-verification-errors)
4. [OAuth Provider Issues](#oauth-provider-issues)
5. [High Error Rate Alerts](#high-error-rate-alerts)
6. [Monitoring System Failures](#monitoring-system-failures)

---

## Authentication Success Rate Drop

### Symptoms
- Success rate below 95% (warning) or 90% (critical)
- Increased failure events in metrics
- User reports of login difficulties

### Immediate Response (< 15 minutes)

1. **Check Current Status**
   ```bash
   # Access monitoring dashboard
   curl -H "Authorization: Bearer $TOKEN" \
        https://thinkhaven.co/api/monitoring/auth-metrics?window=1h
   ```

2. **Identify Error Patterns**
   - Navigate to `/monitoring`
   - Check "Error Types" distribution
   - Look for dominant error types
   - Check recent failure spike timing

3. **Quick Health Checks**
   - Verify Supabase status: https://status.supabase.com
   - Check Vercel status: https://vercel.com/status
   - Test manual login flows (OAuth + Email)

### Investigation Steps

#### If PKCE Errors Dominate (>50% of failures)
→ Follow [PKCE Verification Errors](#pkce-verification-errors) runbook

#### If Network Errors Dominate (>30% of failures)
1. Check CDN status and DNS resolution
2. Review recent infrastructure changes
3. Test from multiple geographic locations
4. Check API response times

#### If Invalid Credentials Spike (>20% increase)
1. Check for potential security incidents
2. Review user communication channels
3. Monitor for brute force patterns
4. Consider implementing temporary rate limiting

#### If Mixed Error Types
1. Check recent deployments
2. Review database performance
3. Verify OAuth configuration
4. Check for infrastructure capacity issues

### Resolution Actions

#### Minor Success Rate Drop (95-90%)
1. Monitor for 30 minutes
2. Document patterns observed
3. Prepare communication if trend continues
4. Schedule investigation during business hours

#### Major Success Rate Drop (<90%)
1. **Immediate:** Page on-call engineer
2. **Within 5 min:** Start user communication
3. **Within 15 min:** Begin mitigation steps
4. **Within 30 min:** Implement temporary fixes if needed

### Communication Templates

#### Internal Alert
```
🚨 AUTH ALERT: Success rate dropped to X%
Time: [timestamp]
Duration: [X minutes]
Dominant errors: [error types]
User impact: [estimated affected users]
Next update: [time]
```

#### User Communication (if >10% impact)
```
We're currently experiencing authentication issues that may
affect login for some users. Our team is actively working
on a resolution. Updates: https://status.thinkhaven.co
```

---

## High Authentication Latency

### Symptoms
- Average latency >5s (warning) or >10s (critical)
- User reports of slow login
- Timeouts in authentication flows

### Immediate Response (< 30 minutes)

1. **Check Latency Patterns**
   - Review detailed metrics in dashboard
   - Check if specific to OAuth or Email auth
   - Identify geographic patterns

2. **Infrastructure Health Check**
   ```bash
   # Check Supabase response times
   curl -w "%{time_total}" https://[supabase-url]/rest/v1/

   # Check API endpoint response
   curl -w "%{time_total}" https://thinkhaven.co/api/monitoring/auth-metrics
   ```

3. **Identify Bottlenecks**
   - Database query performance
   - API route processing time
   - Third-party service delays
   - Network connectivity issues

### Investigation Steps

#### If OAuth Latency High
1. Check Google OAuth service status
2. Review OAuth callback processing time
3. Verify cookie handling performance
4. Check for PKCE processing delays

#### If Email Auth Latency High
1. Review Supabase Auth service status
2. Check database connection pooling
3. Verify API route optimization
4. Check for password validation delays

#### If General Latency Increase
1. Review recent code deployments
2. Check database performance metrics
3. Monitor memory and CPU usage
4. Verify CDN performance

### Resolution Actions

#### Moderate Latency (5-10 seconds)
1. Monitor trends over 1-2 hours
2. Check for gradual degradation
3. Plan optimization during next maintenance window
4. Document performance baselines

#### Severe Latency (>10 seconds)
1. **Immediate:** Identify specific bottleneck
2. **Within 15 min:** Implement caching if applicable
3. **Within 30 min:** Consider service scaling
4. **Within 1 hour:** Deploy performance fixes

### Performance Optimization

#### Quick Wins
- Enable response caching
- Optimize database queries
- Implement connection pooling
- Add CDN for static assets

#### Long-term Solutions
- Database indexing optimization
- API route performance tuning
- Caching layer implementation
- Infrastructure scaling automation

---

## PKCE Verification Errors

### Symptoms
- High rate of `pkce_verification_failed` errors
- High rate of `pkce_mismatch` errors
- Users reporting "Please try again" messages

### Root Causes
1. **Multiple OAuth Attempts**: Users clicking login multiple times
2. **Cookie Issues**: Stale or conflicting auth cookies
3. **Session Conflicts**: Multiple tabs/windows during auth
4. **Browser Issues**: Aggressive cookie blocking

### Immediate Response (< 15 minutes)

1. **Check Error Frequency**
   - Review last hour's PKCE error count
   - Check if affecting multiple users
   - Identify browser/device patterns

2. **Test OAuth Flow**
   ```bash
   # Manual test in incognito browser
   # Clear all cookies before test
   # Complete full OAuth flow
   # Document any reproduction steps
   ```

3. **Quick Mitigation**
   - Deploy cookie clearing logic (already implemented)
   - Monitor for improvement
   - Prepare user guidance

### Investigation Steps

#### High Frequency PKCE Errors (>10% of attempts)
1. **Check Recent Changes**
   - Review last 48 hours of deployments
   - Check OAuth configuration changes
   - Verify cookie handling updates

2. **Browser Analysis**
   - Check error distribution by browser
   - Test in different browser environments
   - Verify cookie settings compatibility

3. **User Behavior Analysis**
   - Check for rapid successive login attempts
   - Monitor session overlap patterns
   - Review error timing patterns

### Resolution Actions

#### Immediate Fixes
1. **Enhanced Cookie Clearing**
   ```typescript
   // Already implemented in auth callback
   allCookies.forEach(cookie => {
     if (cookie.name.startsWith('sb-') || cookie.name.includes('auth')) {
       cookieStore.delete(cookie.name)
     }
   })
   ```

2. **User Education**
   - Add UI guidance about single-click login
   - Implement loading states to prevent double-clicks
   - Show clear error messages with instructions

#### Long-term Solutions
1. **Enhanced PKCE Handling**
   - Implement PKCE state validation
   - Add retry logic with exponential backoff
   - Improve error recovery flows

2. **Session Management**
   - Implement session conflict detection
   - Add concurrent session handling
   - Improve cookie lifecycle management

### User Communication

#### For Individual Users
```
Clear your browser cookies and try logging in again.
If issues persist, try using an incognito/private browser window.
```

#### For Widespread Issues
```
We're aware of an authentication issue affecting some users.
Please clear your browser cookies or try an incognito window.
We're working on a permanent fix.
```

---

## OAuth Provider Issues

### Symptoms
- Sudden spike in OAuth failures
- Specific OAuth error codes from Google
- Users unable to authenticate via Google

### Immediate Response (< 10 minutes)

1. **Check Provider Status**
   - Google API Status: https://status.cloud.google.com
   - Check Google OAuth 2.0 service status
   - Review Google Developer Console

2. **Verify Configuration**
   ```bash
   # Check environment variables
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

   # Test Supabase OAuth config
   curl -X POST https://[supabase-url]/auth/v1/settings
   ```

3. **Test OAuth Flow**
   - Manual test from clean browser
   - Check each step of OAuth flow
   - Document specific failure points

### Investigation Steps

#### If Google OAuth Service Down
1. **Immediate:** Switch to email-only authentication
2. **Communication:** Notify users of temporary limitation
3. **Monitoring:** Set up alerts for service restoration
4. **Planning:** Prepare rapid re-enablement

#### If Configuration Issues
1. **Check OAuth Client Setup**
   - Verify redirect URIs in Google Console
   - Check client ID and secret configuration
   - Verify domain authorization

2. **Review Recent Changes**
   - Check Supabase OAuth settings
   - Review environment variable changes
   - Verify deployment configuration

### Resolution Actions

#### Temporary Workarounds
1. **Promote Email Authentication**
   ```typescript
   // Temporarily hide Google OAuth button
   const oauthEnabled = false // Set based on provider status
   ```

2. **User Communication**
   ```
   Google sign-in is temporarily unavailable.
   Please use email/password login or try again later.
   ```

#### Permanent Fixes
1. **Multi-Provider Setup**
   - Add additional OAuth providers
   - Implement provider fallback logic
   - Create provider health checking

2. **Enhanced Error Handling**
   - Add provider-specific error messages
   - Implement automatic fallback to email
   - Create provider status monitoring

---

## High Error Rate Alerts

### Symptoms
- Error rate >5% for specific error types
- Sudden spike in authentication failures
- Multiple error types trending upward

### Immediate Response (< 20 minutes)

1. **Categorize Errors**
   - Review error distribution chart
   - Identify top 3 error types
   - Check error timing patterns

2. **Quick Impact Assessment**
   ```bash
   # Check user impact
   curl -s "https://thinkhaven.co/api/monitoring/auth-metrics?window=1h" | \
     jq '.metrics["1h"].total_attempts'

   # Calculate percentage affected
   # Compare to baseline metrics
   ```

3. **Initial Mitigation**
   - Document error patterns
   - Check for obvious fixes
   - Prepare escalation if needed

### Error-Specific Responses

#### Network Errors (>5%)
1. **Check Infrastructure**
   - CDN status and performance
   - DNS resolution issues
   - API gateway health
   - Database connectivity

2. **Geographic Analysis**
   - Check if errors are region-specific
   - Test from multiple locations
   - Review CDN edge server status

#### Invalid Credentials (>5%)
1. **Security Assessment**
   - Check for brute force patterns
   - Review failed login attempts
   - Monitor for suspicious IP addresses
   - Check for credential stuffing attacks

2. **User Communication**
   - Alert about potential security issues
   - Recommend password resets if needed
   - Provide account recovery guidance

#### System Errors (>5%)
1. **Infrastructure Review**
   - Check server logs and metrics
   - Review recent deployments
   - Monitor database performance
   - Check memory and CPU usage

### Resolution Strategies

#### Short-term (< 1 hour)
1. **Quick Fixes**
   - Restart problematic services
   - Clear caches if applicable
   - Implement rate limiting if under attack
   - Scale infrastructure if needed

2. **User Support**
   - Provide status updates
   - Offer alternative access methods
   - Document workarounds

#### Long-term (< 24 hours)
1. **Root Cause Analysis**
   - Deep dive into error patterns
   - Review system architecture
   - Identify systemic issues
   - Plan architectural improvements

2. **Prevention Measures**
   - Implement additional monitoring
   - Add automated recovery systems
   - Improve error handling
   - Update alert thresholds

---

## Monitoring System Failures

### Symptoms
- Dashboard not loading or showing stale data
- Missing metrics or incomplete data
- Alert system not triggering

### Immediate Response (< 10 minutes)

1. **Check System Health**
   ```bash
   # Test API endpoints
   curl -I https://thinkhaven.co/api/monitoring/auth-metrics
   curl -I https://thinkhaven.co/api/monitoring/alerts

   # Check authentication
   curl -H "Authorization: Bearer $TOKEN" \
        https://thinkhaven.co/api/monitoring/auth-metrics
   ```

2. **Verify Data Collection**
   - Check browser localStorage for auth events
   - Verify event logging is functioning
   - Test metrics calculation

3. **Review Recent Changes**
   - Check last deployments
   - Review monitoring system updates
   - Verify configuration changes

### Investigation Steps

#### If Dashboard Not Loading
1. **Frontend Issues**
   - Check browser console for errors
   - Verify authentication status
   - Test API endpoint responses
   - Check for JavaScript errors

2. **Backend Issues**
   - Review API server logs
   - Check database connectivity
   - Verify authentication middleware
   - Test endpoint functionality

#### If Data Missing or Stale
1. **Event Collection Issues**
   - Check auth logger integration
   - Verify event format and structure
   - Test metrics collector functionality
   - Review data persistence

2. **Calculation Issues**
   - Test metrics calculation logic
   - Verify time window calculations
   - Check data aggregation functions
   - Review alert threshold logic

### Recovery Actions

#### Immediate Recovery (< 30 minutes)
1. **Restart Services**
   - Redeploy monitoring components
   - Clear browser caches
   - Reset localStorage if corrupted
   - Verify service connectivity

2. **Manual Verification**
   - Test each component individually
   - Verify end-to-end data flow
   - Check authentication integration
   - Validate metrics accuracy

#### Data Recovery (< 2 hours)
1. **Event Reconstruction**
   - Check Vercel logs for auth events
   - Reconstruct metrics from log data
   - Update alert history if needed
   - Verify data integrity

2. **System Restoration**
   - Deploy known good configuration
   - Restore from backup if necessary
   - Re-initialize monitoring system
   - Validate full functionality

### Prevention Measures

#### Monitoring the Monitors
1. **Health Checks**
   - Implement system health endpoints
   - Add monitoring system alerts
   - Create backup data collection
   - Set up redundant dashboards

2. **Testing Procedures**
   - Regular end-to-end testing
   - Automated monitoring validation
   - Backup and recovery testing
   - Performance baseline monitoring

---

## Escalation Procedures

### Level 1: Warning Alerts
- **Response Time**: 1 hour
- **Assigned To**: On-duty engineer
- **Actions**: Investigation and monitoring
- **Escalation**: If unresolved after 4 hours

### Level 2: Critical Alerts
- **Response Time**: 15 minutes
- **Assigned To**: On-call engineer + team lead
- **Actions**: Immediate investigation and mitigation
- **Escalation**: If unresolved after 1 hour

### Level 3: System Down
- **Response Time**: 5 minutes
- **Assigned To**: Full engineering team
- **Actions**: All-hands incident response
- **Communication**: Immediate user notification

## Post-Incident Procedures

### Immediate (< 2 hours)
1. Document incident timeline
2. Capture system state and logs
3. Communicate resolution to users
4. Update monitoring thresholds if needed

### Short-term (< 24 hours)
1. Conduct post-incident review
2. Document lessons learned
3. Update runbooks and procedures
4. Plan prevention measures

### Long-term (< 1 week)
1. Implement system improvements
2. Update monitoring and alerting
3. Create additional documentation
4. Train team on new procedures

---

**Last Updated**: 2025-09-23
**Version**: 1.0
**Review Schedule**: Monthly
**Next Review**: 2025-10-23