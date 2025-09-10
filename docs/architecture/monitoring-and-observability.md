# Monitoring and Observability

## Monitoring Stack

- **Frontend Monitoring:** Vercel Analytics + Web Vitals tracking
- **Backend Monitoring:** Vercel Functions Dashboard + custom metrics
- **Error Tracking:** Vercel error logging + Sentry integration (future)
- **Performance Monitoring:** Vercel Speed Insights + Claude API token usage tracking

## Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript bundle size and loading time
- API response times for chat streaming
- User interaction events (message sends, workspace creation)

**Backend Metrics:**
- API endpoint response times
- Claude API token usage and costs
- Database query performance
- Conversation success rates and error frequencies
- Streaming connection stability

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create comprehensive architecture.md document", "status": "completed", "activeForm": "Creating comprehensive architecture.md document"}]