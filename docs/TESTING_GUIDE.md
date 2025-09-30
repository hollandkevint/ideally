# ThinkHaven Testing Guide
*Generated: 2025-09-29*

## Quick Start

**Development Server**: Running at http://localhost:3000
**Status**: Claude API streaming endpoint enabled ✅
**Environment Variables**: Configured ✅

---

## Testing Workflow

### 1. Google OAuth Login Flow (5 minutes)

#### Test Steps:
1. **Navigate to Landing Page**
   ```
   URL: http://localhost:3000
   Expected: See "Continue with Google" button
   ```

2. **Initiate Google OAuth**
   - Click "Continue with Google" button
   - **Expected**: Redirect to Google consent screen
   - **If Already Logged In**: May auto-select Google account

3. **Grant Permissions**
   - Select your Google account
   - Review permissions (email, profile)
   - Click "Allow"

4. **OAuth Callback**
   ```
   Expected Callback URL: http://localhost:3000/auth/callback?code=...
   Expected Redirect: http://localhost:3000/dashboard
   Expected Result: See your email in dashboard header
   ```

5. **Verify Session**
   - Check browser DevTools → Application → Cookies
   - Look for Supabase auth cookies (`sb-*`)
   - Open browser console for auth logs

#### Common Issues:
- **Redirect Loop**: Check Supabase redirect URLs configuration
- **PKCE Error**: Clear browser cookies and retry
- **No User Data**: Wait 5 seconds, auth state may be syncing

---

### 2. Alternative: Email/Password Login (3 minutes)

#### Test Steps:
1. **Navigate to Login Page**
   ```
   URL: http://localhost:3000/login
   ```

2. **Enter Credentials**
   - Email: [your test email]
   - Password: [your test password]
   - Click "Sign in"

3. **Expected Result**
   - Redirect to http://localhost:3000/dashboard
   - See welcome message with your email

#### Create Test Account (if needed):
```
URL: http://localhost:3000/signup
Create account → Check email for confirmation → Login
```

---

### 3. Dashboard & Workspace Creation (5 minutes)

#### Test Steps:
1. **Review Dashboard**
   ```
   URL: http://localhost:3000/dashboard
   Expected Elements:
   - "Thinkhaven" header
   - "Welcome, [your-email]" in top right
   - "+ New Strategic Session" button
   - "Your Strategic Sessions" section
   ```

2. **Create New Session**
   - Click "+ New Strategic Session"
   - Fill in:
     - **Session Name**: "Product Strategy Test"
     - **Description**: "Testing strategic analysis capabilities"
   - Click "Create Session"

3. **Expected Result**
   ```
   Redirect to: http://localhost:3000/workspace/[user_id]
   Expected UI:
   - Dual-pane interface (Chat left, BMad right)
   - Message input at bottom
   - Tab switcher: "Chat" | "BMad"
   ```

#### Database Verification:
```bash
# Check Supabase dashboard for new record in user_workspace table
# Should see workspace_state with your session name/description
```

---

### 4. Claude API Chat Testing (10 minutes)

#### Test Steps:

**Test 1: Simple Message**
1. In workspace chat pane, type:
   ```
   "Hello Mary, I need help analyzing a new product idea."
   ```
2. Press Enter or click Send
3. **Expected**:
   - Message appears immediately as "user" message
   - Streaming response begins within 2 seconds
   - Text appears word-by-word (streaming effect)
   - Response completes with Mary's coaching guidance

**Test 2: Strategic Conversation**
1. Follow up with:
   ```
   "I want to build a SaaS tool for healthcare data analytics. What should I consider first?"
   ```
2. **Expected**:
   - Mary responds with structured questions
   - May offer numbered options (1-4)
   - Should reference bMAD Method principles
   - Response saved to conversation history

**Test 3: Context Preservation**
1. Send third message:
   ```
   "Can you remind me what I said about healthcare?"
   ```
2. **Expected**:
   - Mary references your previous messages
   - Demonstrates conversation history is working
   - Maintains coaching persona

#### Monitor Performance:
- **Response Time**: Should be <2 seconds for first token
- **Streaming**: Smooth word-by-word appearance
- **Error Handling**: Any errors should show user-friendly message

#### Common Issues:
- **No Response**: Check browser console for API errors
- **500 Error**: Verify ANTHROPIC_API_KEY in `.env.local`
- **Slow Streaming**: Check network tab for connection issues
- **Missing API Key**: Add to `.env.local`:
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  ```

---

### 5. BMad Method Pathway Testing (15 minutes)

#### Test Steps:

**Test 1: Switch to BMad Tab**
1. Click "BMad" tab in workspace
2. **Expected**:
   - See pathway selector interface
   - Three pathway options:
     - "I have a brand new idea"
     - "I'm stuck on a business model problem"
     - "I need to refine a feature"

**Test 2: New Idea Pathway**
1. Click "I have a brand new idea"
2. **Expected**:
   - See ideation phase interface
   - Mary provides structured questions
   - Numbered options (1-9) for responses
   - Phase progress indicator

3. Follow the pathway:
   - Answer initial questions
   - Select numbered options
   - Progress through phases:
     - Context gathering
     - Exploration
     - Analysis
     - Action planning

**Test 3: Session State Management**
1. While in BMad session, click back to "Chat" tab
2. Type a message in chat
3. Switch back to "BMad" tab
4. **Expected**:
   - BMad session state preserved
   - Context transfer between pathways
   - No loss of progress

**Test 4: Session Persistence**
1. Navigate to dashboard: http://localhost:3000/dashboard
2. Click "Continue Session" on your workspace
3. **Expected**:
   - Return to exact same state
   - Chat history intact
   - BMad progress preserved
   - Auto-save working (every 2 min)

---

### 6. Advanced Features Testing (10 minutes)

#### Export & Sharing
1. Complete a BMad session
2. Look for export options
3. **Expected**:
   - Generate business framework (Lean Canvas, Business Model Canvas)
   - Export as PDF
   - Share via unique URL

#### Session History
1. From workspace, look for session history panel
2. **Expected**:
   - View past sessions
   - Resume any previous session
   - Context fully restored

#### Dual-Pane Interaction
1. In chat, mention specific product features
2. Switch to BMad canvas (right pane)
3. **Expected**:
   - Ideas from chat populate visual elements
   - Context bridging between panes
   - Real-time synchronization

---

## Testing Checklist

### Phase 1: Authentication ✅
- [ ] Google OAuth login successful
- [ ] Email/password login successful
- [ ] Session persists across refresh
- [ ] Logout works correctly

### Phase 2: Dashboard ✅
- [ ] Dashboard displays user email
- [ ] Session creation form works
- [ ] Workspace list populates
- [ ] Navigation to workspace succeeds

### Phase 3: Claude Integration ✅
- [ ] Chat messages send successfully
- [ ] Streaming responses appear
- [ ] Response time <2 seconds
- [ ] Conversation history maintained
- [ ] Error handling works gracefully

### Phase 4: BMad Method ✅
- [ ] Pathway selector displays
- [ ] New idea pathway navigable
- [ ] Numbered options work (1-9)
- [ ] Phase progression tracking
- [ ] Session state preservation

### Phase 5: Advanced Features ✅
- [ ] Auto-save every 2 minutes
- [ ] Session pause/resume works
- [ ] Context transfer between pathways
- [ ] Export functionality available
- [ ] Dual-pane synchronization

---

## Environment Configuration

### Required Environment Variables

**File: `apps/web/.env.local`**
```bash
# Supabase (already configured via Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic Claude API (required for chat)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Google OAuth (already configured)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=[your-client-id]
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercel Production Variables
All variables are already configured in Vercel (verified via `vercel env ls`):
- ✅ ANTHROPIC_API_KEY (Production)
- ✅ SUPABASE credentials
- ✅ Google OAuth credentials

---

## Troubleshooting Guide

### Issue: OAuth Redirect Loop
**Solution**:
1. Check Supabase dashboard → Authentication → URL Configuration
2. Verify Site URL: `http://localhost:3000` (dev) or `https://thinkhaven.vercel.app` (prod)
3. Verify Redirect URLs includes `/auth/callback`
4. Clear browser cookies and retry

### Issue: Claude API Not Responding
**Solution**:
1. Check `.env.local` has valid `ANTHROPIC_API_KEY`
2. Verify API route enabled: `apps/web/app/api/chat/stream/route.ts` (no `.disabled`)
3. Check browser console for fetch errors
4. Test API key with:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-sonnet-4-20250514","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
   ```

### Issue: Workspace Not Found
**Solution**:
1. Check Supabase dashboard for `user_workspace` table
2. Verify user_id matches authenticated user
3. Check row-level security policies allow user access
4. Try creating new workspace from dashboard

### Issue: Streaming Breaks Midway
**Solution**:
1. Check network tab for connection interruption
2. Verify streaming headers in API route
3. Check for rate limiting (Claude API)
4. Implement retry logic on client side

---

## Performance Benchmarks

### Expected Metrics (Per PRD)
- **First Token Latency**: <2 seconds (95th percentile)
- **Streaming Rate**: Smooth word-by-word appearance
- **API Uptime**: >95%
- **Session Completion Rate**: >80%
- **Average Session Duration**: >10 minutes
- **Auto-save Frequency**: Every 2 minutes

### Monitoring
- Check browser DevTools → Network tab for timing
- Monitor console logs for auth/API events
- Use Vercel Analytics for production metrics
- Check Supabase logs for database performance

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Deploy to Vercel production
2. Test with real Google OAuth in production
3. Monitor error rates and performance
4. Gather user feedback on coaching quality
5. Iterate on BMad Method pathways

### If Issues Found 🔧
1. Document specific errors with screenshots
2. Check relevant sections in troubleshooting guide
3. Review API logs and browser console
4. Verify environment variables
5. Test isolated components (auth, API, UI separately)

---

## Contact & Support

**Project Owner**: kevin@kevintholland.com
**Repository**: /Users/kthkellogg/Documents/GitHub/thinkhaven
**Documentation**: /docs/prd.md, /docs/architecture/

**Quick Reference Files**:
- OAuth Integration: `/docs/architecture/Google OAuth Integration Guide.md`
- API Routes: `/apps/web/app/api/chat/stream/route.ts`
- Workspace UI: `/apps/web/app/workspace/[id]/page.tsx`
- Dashboard: `/apps/web/app/dashboard/page.tsx`