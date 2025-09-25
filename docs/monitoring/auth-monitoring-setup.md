# Authentication Monitoring Setup Guide

## Overview

The ThinkHaven authentication monitoring system provides comprehensive tracking, alerting, and analytics for all authentication events. This document covers setup, configuration, and operational procedures.

## Architecture

### Components

1. **Auth Logger** (`/lib/monitoring/auth-logger.ts`)
   - Structured event logging
   - Privacy-compliant data hashing
   - Vercel Analytics integration
   - Correlation ID tracking

2. **Metrics Collector** (`/lib/monitoring/auth-metrics.ts`)
   - Real-time metrics aggregation
   - Rolling window calculations (1h, 24h, 7d)
   - Browser-based persistence
   - Detailed analytics breakdown

3. **Alert Service** (`/lib/monitoring/alert-service.ts`)
   - Configurable thresholds
   - Multi-channel notifications
   - Auto-resolution logic
   - Alert history management

4. **Monitoring Dashboard** (`/app/monitoring/page.tsx`)
   - Real-time metrics visualization
   - Alert management interface
   - Historical trend analysis
   - Export capabilities

### Data Flow

```
Authentication Event → Auth Logger → Metrics Collector → Alert Service
                                         ↓
                                  Dashboard Display
```

## Setup Instructions

### 1. Environment Configuration

No additional environment variables required. The system uses:
- Supabase authentication (existing)
- Vercel Analytics (optional, auto-detected)
- Browser localStorage for persistence

### 2. Access the Dashboard

Navigate to `/monitoring` in your application. Authentication required.

### 3. Configure Alert Thresholds

Default thresholds:
- Success Rate Warning: < 95%
- Success Rate Critical: < 90%
- Latency Warning: > 5 seconds
- Latency Critical: > 10 seconds
- Error Rate Threshold: > 5% for any error type

To modify:
```javascript
// Update via API or dashboard
await fetch('/api/monitoring/alerts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'update_config',
    config: {
      successRateWarning: 96,
      successRateCritical: 92,
      latencyWarningMs: 4000,
      latencyCriticalMs: 8000
    }
  })
})
```

### 4. Set Up Alert Channels

#### Console Logging (Default: Enabled)
Alerts automatically logged to browser console and Vercel Logs.

#### Webhook Integration
```javascript
// Configure webhook URL
const config = {
  channels: {
    webhook: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
  }
}
```

#### Email Notifications
Requires integration with email service (SendGrid, AWS SES, etc.)

## API Endpoints

### Metrics API
- `GET /api/monitoring/auth-metrics` - Get authentication metrics
- `GET /api/monitoring/auth-metrics?window=1h&detailed=true` - Detailed metrics
- `POST /api/monitoring/auth-metrics` - Submit external auth events

### Alerts API
- `GET /api/monitoring/alerts` - Get alert history
- `GET /api/monitoring/alerts?action=active` - Get active alerts
- `GET /api/monitoring/alerts?action=summary` - Get alert summary
- `POST /api/monitoring/alerts` - Manage alerts (acknowledge, resolve, configure)

## Metrics Definitions

### Core Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| Success Rate | Authentication success percentage | (Successful Logins / Total Attempts) × 100 |
| Total Attempts | Combined initiation or completion count | Max(Initiations, Successes + Failures) |
| Average Latency | Mean authentication duration | Sum(Latencies) / Count(Events with Latency) |
| Error Distribution | Breakdown by error type | Count per error category |
| Method Distribution | OAuth vs Email breakdown | Count per authentication method |

### Advanced Analytics

- **Geographic Distribution**: Based on user agent heuristics
- **Device Distribution**: Mobile, tablet, desktop classification
- **Browser Distribution**: Chrome, Firefox, Safari, Edge detection
- **Hourly Patterns**: Authentication attempts by hour
- **Error Trends**: Error frequency over time

## Alert Types and Responses

### Success Rate Alerts

#### Warning (< 95%)
**Immediate Actions:**
1. Check recent error patterns in dashboard
2. Verify OAuth provider status
3. Review recent code deployments
4. Monitor for 15-30 minutes

**Investigation Steps:**
1. Check Supabase status dashboard
2. Review Vercel deployment logs
3. Test authentication flows manually
4. Check for increased PKCE errors

#### Critical (< 90%)
**Immediate Actions:**
1. Escalate to on-call engineer
2. Check all authentication providers
3. Consider enabling fallback authentication
4. Communicate with users if widespread

### Latency Alerts

#### Warning (> 5 seconds)
**Investigation:**
1. Check Supabase response times
2. Review API route performance
3. Monitor network connectivity
4. Check for database performance issues

#### Critical (> 10 seconds)
**Actions:**
1. Check for service outages
2. Review infrastructure scaling
3. Consider temporary rate limiting
4. Monitor user impact

### Error Rate Alerts

#### High Error Rate (> 5% for any error type)
**PKCE Errors:**
1. Check for multiple OAuth attempts
2. Review cookie handling
3. Verify OAuth configuration
4. Clear problematic user sessions

**Network Errors:**
1. Check CDN status
2. Review DNS resolution
3. Monitor third-party services
4. Check regional connectivity

**Invalid Credentials:**
1. Check for brute force attempts
2. Review user communication
3. Monitor for compromised accounts
4. Consider implementing rate limiting

## Operational Procedures

### Daily Monitoring

1. **Morning Check** (9 AM)
   - Review overnight alerts
   - Check 24-hour success rates
   - Verify monitoring system health
   - Acknowledge resolved alerts

2. **Afternoon Review** (2 PM)
   - Monitor current metrics
   - Check for emerging patterns
   - Review error distributions
   - Update alert configurations if needed

### Weekly Analysis

1. **Monday Planning**
   - Review previous week's trends
   - Analyze error patterns
   - Plan infrastructure improvements
   - Update documentation if needed

2. **Friday Summary**
   - Generate weekly metrics report
   - Document incidents and resolutions
   - Update alert thresholds based on patterns
   - Plan weekend monitoring coverage

### Incident Response

#### Severity 1 (Critical Alerts)
- **Response Time**: 15 minutes
- **Actions**: Immediate investigation, user communication
- **Escalation**: Engineering team lead
- **Documentation**: Required within 24 hours

#### Severity 2 (Warning Alerts)
- **Response Time**: 1 hour
- **Actions**: Investigation and monitoring
- **Escalation**: If unresolved within 4 hours
- **Documentation**: Summary in weekly report

#### Severity 3 (Information)
- **Response Time**: Next business day
- **Actions**: Investigation during business hours
- **Documentation**: Optional

### Data Retention

- **Event Data**: 7 days (browser localStorage)
- **Alert History**: 1000 most recent alerts
- **Metrics**: Real-time calculation from event data
- **Logs**: According to Vercel retention policy

## Troubleshooting

### Common Issues

#### Dashboard Not Loading
1. Check authentication status
2. Verify API endpoint accessibility
3. Check browser console for errors
4. Clear localStorage if corrupted

#### Missing Metrics
1. Verify authentication events are firing
2. Check localStorage for event data
3. Confirm API responses
4. Review browser network requests

#### Alerts Not Triggering
1. Check alert configuration
2. Verify threshold settings
3. Confirm event data quality
4. Test alert service manually

### Performance Optimization

#### High Event Volume
1. Increase cleanup frequency
2. Reduce data retention period
3. Implement sampling for high-traffic periods
4. Consider server-side storage

#### Dashboard Slow Loading
1. Reduce metrics window size
2. Implement data pagination
3. Add caching layer
4. Optimize chart rendering

## Security Considerations

### Data Privacy
- User IDs are hashed before storage
- Email addresses are partially anonymized
- IP addresses collected only server-side
- No passwords or tokens logged

### Access Control
- Monitoring dashboard requires authentication
- API endpoints verify user sessions
- No public access to metrics data
- Alert management requires user context

### Compliance
- GDPR: Data minimization and anonymization
- CCPA: No sale of personal information
- SOC 2: Security monitoring and alerting
- PCI DSS: No payment data in logs

## Integration Guide

### Adding Custom Metrics
```typescript
import { authLogger } from '@/lib/monitoring/auth-logger'

// Log custom authentication event
await authLogger.logAuthEvent({
  event_type: 'auth_initiation',
  auth_method: 'custom_method',
  correlation_id: 'custom_correlation_id'
})
```

### Webhook Payload Format
```json
{
  "text": "Authentication success rate critically low: 87.5%",
  "alert": {
    "id": "alert_1234567890_abc123",
    "level": "critical",
    "type": "success_rate",
    "message": "Authentication success rate critically low: 87.5%",
    "value": 87.5,
    "threshold": 90,
    "timestamp": "2025-09-23T10:30:00.000Z",
    "resolved": false
  },
  "service": "ThinkHaven Auth Monitoring",
  "timestamp": "2025-09-23T10:30:00.000Z"
}
```

### Custom Alert Channels
Extend the alert service to support additional notification channels:

```typescript
// In alert-service.ts
private async sendCustomAlert(alert: Alert): Promise<void> {
  // Implement custom notification logic
  // Examples: Discord, Teams, PagerDuty, SMS
}
```

## Maintenance

### Regular Tasks
- Monthly alert threshold review
- Quarterly documentation updates
- Semi-annual security audit
- Annual system architecture review

### Upgrade Procedures
1. Test in development environment
2. Backup current configurations
3. Deploy during low-traffic periods
4. Verify metrics collection continues
5. Test alert functionality
6. Update documentation

---

**Last Updated**: 2025-09-23
**Version**: 1.0
**Maintained By**: ThinkHaven Engineering Team