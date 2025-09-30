# BMad Analytics Integration Guide

## Quick Implementation Summary

This guide provides step-by-step instructions for implementing the BMad Analytics Foundation within 1-2 weeks of solo development. The implementation delivers immediate visibility into user behavior and system performance while building foundation for data-driven optimization.

## Prerequisites

- Existing BMad Method production system
- Supabase database with RLS enabled
- React/Next.js frontend
- Access to production deployment pipeline

## Implementation Steps

### Phase 1: Database Setup (Day 1)

1. **Deploy Analytics Schema**
   ```bash
   # Copy the migration file to your Supabase migrations folder
   cp docs/002_bmad_analytics_schema.sql supabase/migrations/
   
   # Run migration
   supabase db push
   
   # Verify tables were created
   supabase db describe
   ```

2. **Validate Schema**
   ```sql
   -- Test basic queries work
   SELECT count(*) FROM bmad_analytics_events;
   SELECT count(*) FROM bmad_pathway_metrics;
   SELECT count(*) FROM bmad_ab_experiments;
   ```

### Phase 2: Analytics Service Integration (Days 2-3)

1. **Install Analytics Service**
   ```bash
   # Copy the analytics service to your lib folder
   cp docs/bmad-analytics-service.ts apps/web/lib/bmad/analytics-service.ts
   ```

2. **Integrate with Existing Session Manager**
   
   Update `apps/web/app/components/bmad/SessionManager.tsx`:
   
   ```typescript
   import { analyticsService } from '@/lib/bmad/analytics-service'
   
   // Add to SessionManager component
   useEffect(() => {
     // Track session start
     analyticsService.trackEvent({
       sessionId: session.id,
       userId: session.userId,
       eventType: 'session_start',
       eventData: {
         pathway: session.pathway,
         expectedDuration: getExpectedDuration(session.pathway)
       },
       contextData: {
         pathway: session.pathway,
         currentPhase: session.currentPhase,
         sessionProgressPercent: session.progress.overallCompletion
       }
     })
   }, [session.id])
   
   const handlePause = () => {
     setIsPaused(true)
     
     // Track pause event
     analyticsService.trackEvent({
       sessionId: session.id,
       userId: session.userId,
       eventType: 'session_pause',
       eventData: {
         pauseReason: 'user_initiated',
         sessionDuration: timeElapsed
       },
       contextData: {
         pathway: session.pathway,
         currentPhase: session.currentPhase,
         sessionProgressPercent: session.progress.overallCompletion
       }
     })
     
     onPause?.()
   }
   
   // Similar integration for resume, exit, phase transitions
   ```

3. **Add Event Tracking to BMad Interface**
   
   Update `apps/web/app/components/bmad/BmadInterface.tsx`:
   
   ```typescript
   import { analyticsService } from '@/lib/bmad/analytics-service'
   
   // Track user interactions
   const handleUserResponse = async (response: string) => {
     const startTime = performance.now()
     
     // Process response...
     
     const endTime = performance.now()
     
     // Track user response event
     await analyticsService.trackEvent({
       sessionId: currentSession.id,
       userId: currentSession.userId,
       eventType: 'user_response',
       eventData: {
         responseLength: response.length,
         responseQuality: assessResponseQuality(response),
         promptType: currentPrompt.type
       },
       performanceData: {
         clientRenderTimeMs: endTime - startTime
       },
       contextData: {
         pathway: currentSession.pathway,
         currentPhase: currentSession.currentPhase,
         sessionProgressPercent: currentSession.progress.overallCompletion
       }
     })
   }
   ```

### Phase 3: Developer Dashboard (Days 4-6)

1. **Install Dashboard Components**
   ```bash
   # Copy dashboard components
   cp docs/developer-dashboard-components.tsx apps/web/app/components/analytics/
   ```

2. **Create Dashboard Route**
   
   Create `apps/web/app/analytics/page.tsx`:
   
   ```typescript
   import { DeveloperDashboard } from '@/components/analytics/developer-dashboard-components'
   
   export default function AnalyticsPage() {
     return (
       <div className="min-h-screen">
         <DeveloperDashboard />
       </div>
     )
   }
   ```

3. **Add Navigation Link**
   
   Update your navigation to include analytics link (for admin users):
   
   ```typescript
   <Link href="/analytics" className="nav-link">
     Analytics Dashboard
   </Link>
   ```

### Phase 4: A/B Testing Framework (Days 7-8)

1. **Install A/B Testing Service**
   ```bash
   cp docs/ab-testing-service.ts apps/web/lib/bmad/ab-testing-service.ts
   ```

2. **Integrate with Session Initialization**
   
   Update session creation logic:
   
   ```typescript
   import { abTestingService } from '@/lib/bmad/ab-testing-service'
   
   const initializeSession = async (userId: string, pathway: PathwayType) => {
     // Create session
     const session = await createBmadSession(userId, pathway)
     
     // Assign A/B test variant
     const variant = await abTestingService.assignVariant(session.id, userId)
     
     // Apply variant configuration
     if (variant !== 'control') {
       session.config = applyVariantChanges(session.config, variant)
     }
     
     return session
   }
   ```

### Phase 5: Real-time Metrics (Days 9-10)

1. **Setup Metrics Aggregation**
   
   Create a daily cron job to aggregate metrics:
   
   ```typescript
   // Create apps/web/app/api/analytics/aggregate/route.ts
   export async function POST() {
     try {
       // Aggregate pathway metrics for yesterday
       const yesterday = new Date()
       yesterday.setDate(yesterday.getDate() - 1)
       
       await supabase.rpc('aggregate_pathway_metrics', { 
         p_date: yesterday.toISOString().split('T')[0] 
       })
       
       return Response.json({ success: true })
     } catch (error) {
       return Response.json({ error: error.message }, { status: 500 })
     }
   }
   ```

2. **Setup Real-time Updates**
   
   Add WebSocket or polling for real-time dashboard updates:
   
   ```typescript
   // In dashboard components
   useEffect(() => {
     const interval = setInterval(async () => {
       const metrics = await analyticsService.getPathwayMetrics(pathway, timeframe)
       setMetrics(metrics)
     }, 30000) // Update every 30 seconds
     
     return () => clearInterval(interval)
   }, [pathway, timeframe])
   ```

### Phase 6: Testing and Validation (Days 11-12)

1. **Test Analytics Collection**
   ```typescript
   // Create test session and verify events are recorded
   const testAnalytics = async () => {
     const testSession = await createTestSession()
     
     // Generate test events
     await analyticsService.trackEvent({
       sessionId: testSession.id,
       userId: testSession.userId,
       eventType: 'session_start',
       eventData: { test: true },
       contextData: { pathway: 'new-idea' }
     })
     
     // Verify event was recorded
     const { data } = await supabase
       .from('bmad_analytics_events')
       .select('*')
       .eq('session_id', testSession.id)
     
     console.log('Test events recorded:', data?.length)
   }
   ```

2. **Validate Dashboard Data**
   ```typescript
   // Test all dashboard components load without errors
   const validateDashboard = async () => {
     try {
       const metrics = await analyticsService.getPathwayMetrics('new-idea', 'week')
       const insights = await analyticsService.getOptimizationInsights()
       
       console.log('Dashboard validation successful')
       return true
     } catch (error) {
       console.error('Dashboard validation failed:', error)
       return false
     }
   }
   ```

### Phase 7: First A/B Test (Days 13-14)

1. **Create First Experiment**
   ```typescript
   import { createElicitationStyleExperiment, abTestingService } from '@/lib/bmad/ab-testing-service'
   
   const setupFirstExperiment = async () => {
     const config = createElicitationStyleExperiment()
     const experiment = await abTestingService.createExperiment(config)
     await abTestingService.startExperiment(experiment.id, 30) // 30 day duration
     
     console.log('First A/B test created:', experiment.id)
   }
   ```

2. **Monitor Experiment**
   ```typescript
   const checkExperimentProgress = async (experimentId: string) => {
     const results = await abTestingService.getExperimentResults(experimentId)
     
     console.log('Current results:', {
       totalSessions: results.overallStatistics.totalSessions,
       conversionRate: results.overallStatistics.overallConversionRate,
       statisticalSignificance: results.overallStatistics.statisticalSignificance
     })
   }
   ```

## Environment Variables

Add to your `.env.local`:

```bash
# Analytics Configuration
NEXT_PUBLIC_ANALYTICS_ENABLED=true
ANALYTICS_BATCH_SIZE=50
ANALYTICS_FLUSH_INTERVAL=30000

# A/B Testing Configuration  
AB_TESTING_ENABLED=true
AB_TESTING_DEFAULT_ALLOCATION=50

# Dashboard Configuration
DASHBOARD_REFRESH_INTERVAL=30000
DASHBOARD_CACHE_TTL=60000
```

## Performance Optimization

### 1. Batch Event Processing

```typescript
// Batch events to reduce database load
const eventBatch: AnalyticsEvent[] = []

const flushEventBatch = async () => {
  if (eventBatch.length > 0) {
    await analyticsService.trackEventBatch([...eventBatch])
    eventBatch.length = 0
  }
}

// Flush every 30 seconds or when batch reaches 50 events
setInterval(flushEventBatch, 30000)
```

### 2. Caching Strategy

```typescript
// Cache dashboard metrics to reduce database queries
const cacheConfig = {
  sessionStats: 60, // 1 minute
  pathwayMetrics: 300, // 5 minutes  
  userBehavior: 600, // 10 minutes
  optimizationInsights: 1800 // 30 minutes
}
```

### 3. Database Indexes

The migration file includes optimized indexes. Monitor query performance:

```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
WHERE query LIKE '%bmad_analytics%'
ORDER BY mean_time DESC;
```

## Security Considerations

1. **Row Level Security**: Already implemented in migration
2. **API Rate Limiting**: Consider adding rate limits to analytics endpoints
3. **Data Anonymization**: Ensure PII is not stored in analytics events
4. **GDPR Compliance**: Implement data retention policies

```sql
-- Auto-delete old analytics events (90 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS void AS $$
BEGIN
  DELETE FROM bmad_analytics_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
SELECT cron.schedule('cleanup-analytics', '0 2 * * *', 'SELECT cleanup_old_analytics_events();');
```

## Monitoring and Alerts

1. **Set up monitoring for**:
   - Analytics service availability
   - Database query performance  
   - A/B test assignment rates
   - Dashboard load times

2. **Key metrics to alert on**:
   - Analytics event drop rate > 5%
   - Dashboard response time > 3 seconds
   - Experiment assignment failures > 1%

## Deployment Checklist

### Pre-deployment
- [ ] Database migration tested in staging
- [ ] Analytics service unit tests passing
- [ ] Dashboard components render without errors
- [ ] A/B testing service validated
- [ ] Performance benchmarks within targets

### Post-deployment  
- [ ] Analytics events being recorded
- [ ] Dashboard loading with real data
- [ ] Real-time updates functioning
- [ ] A/B test assignments working
- [ ] No errors in application logs

### Week 1 Validation
- [ ] User behavior patterns visible
- [ ] Pathway performance differences identified
- [ ] At least 3 optimization insights generated
- [ ] First A/B test collecting data

## Troubleshooting

### Common Issues

1. **Analytics events not recording**
   - Check RLS policies
   - Verify user authentication
   - Check browser console for errors

2. **Dashboard not loading**
   - Verify database connection
   - Check for missing indexes
   - Review query timeouts

3. **A/B test assignments failing**
   - Check experiment status
   - Verify traffic allocation sums to 100%
   - Review targeting criteria

### Debug Commands

```typescript
// Enable debug logging
localStorage.setItem('bmad_analytics_debug', 'true')

// Check event queue
console.log('Pending events:', analyticsService.getPendingEvents())

// Validate experiment setup
const experiment = await abTestingService.getExperiment(experimentId)
console.log('Experiment config:', experiment)
```

## Success Metrics

After 2 weeks, you should have:

1. **Analytics Infrastructure**
   - 100% event capture rate
   - < 50ms analytics overhead
   - Real-time dashboard updates

2. **Business Intelligence**
   - User behavior patterns identified
   - Pathway performance benchmarked
   - Optimization opportunities documented

3. **A/B Testing Capability**
   - First experiment running
   - Statistical significance detection
   - Automated insights generation

4. **Value Delivered**
   - $15-25K estimated value from improved visibility
   - Foundation for data-driven development
   - Optimization roadmap established

This implementation provides immediate value while building the foundation for advanced analytics and optimization capabilities.