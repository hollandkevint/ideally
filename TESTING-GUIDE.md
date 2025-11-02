# ThinkHaven Testing Guide - Post Core Fix

**Date**: 2025-10-28
**Version**: Core Functionality Fix v1.0

## What Was Fixed

### Epic 1: Mary AI Chat Streaming (COMPLETED)
Fixed the core chat functionality so Mary responds to your messages.

**Changes Made:**
1. ✅ Added comprehensive error logging throughout `/api/chat/stream`
2. ✅ Fixed workspace verification logic
3. ✅ Added detailed client-side error display with troubleshooting hints
4. ✅ Added ANTHROPIC_API_KEY validation on startup
5. ✅ Improved streaming error handling with detailed console logs

### Epic 2: Visual Canvas (COMPLETED)
Fixed canvas rendering and error handling.

**Changes Made:**
1. ✅ Added error logging to EnhancedCanvasWorkspace component
2. ✅ Added error boundary with user-friendly error display
3. ✅ Improved canvas state loading with better error handling
4. ✅ Canvas now works without a sessionId

---

## How To Test

### Setup

1. **Start the development server:**
   ```bash
   cd apps/web
   npm run dev
   ```

2. **Open browser console** (F12 or Cmd+Option+I on Mac)
   - Keep this open during testing to see detailed logs
   - All logs are prefixed with `[Chat Stream]`, `[Workspace]`, or `[EnhancedCanvasWorkspace]`

3. **Sign in to ThinkHaven**
   - Go to http://localhost:3000
   - Sign in with your test account

---

### Test 1: Mary AI Chat Response

**Goal**: Verify Mary responds to messages

**Steps:**
1. Navigate to your workspace (Dashboard → Click on a workspace)
2. You should see the "Mary Chat" tab (should be active by default)
3. In the chat input at the bottom, type: "I have a new product idea I want to validate"
4. Press Send or hit Enter

**Expected Result:**
- ✅ You see "Sending..." status
- ✅ Mary's response starts streaming in within 2-3 seconds
- ✅ Response is formatted with proper markdown
- ✅ No error messages appear

**Check Console Logs:**
Look for these log sequences:
```
[Workspace] Sending message to Claude:
[Workspace] Got response: {ok: true, status: 200}
[Workspace] Starting to read stream...
[Workspace] Stream complete, received X chunks
```

**If It Fails:**
- Check console for error messages with `[Chat Stream]` or `[Workspace]` prefix
- Error messages now include:
  - Specific error details
  - HTTP status codes
  - Troubleshooting hints
- Common issues:
  - `ANTHROPIC_API_KEY not set` → Check .env.local file
  - `Workspace not found` → Sign out and back in to recreate workspace
  - `Unauthorized` → Check Supabase authentication
  - `HTTP error! status: 500` → Check server logs for stack trace

---

### Test 2: Visual Canvas Draw Mode

**Goal**: Verify canvas loads and drawing works

**Steps:**
1. In your workspace, look at the right pane labeled "Visual Canvas"
2. You should see a toolbar with "Draw" and "Diagram" buttons
3. The "Draw" button should be selected (blue background)
4. Try to draw something with your mouse/trackpad

**Expected Result:**
- ✅ Canvas loads (no blank white screen)
- ✅ You can draw freehand
- ✅ Drawing tools appear (pen, shapes, text)
- ✅ No error messages

**Check Console Logs:**
```
[EnhancedCanvasWorkspace] Component mounted/updated:
```

**If It Fails:**
- Check console for `[EnhancedCanvasWorkspace]` errors
- If you see a red warning icon with "Canvas Error", click "Reload Page"
- Canvas should work even without a BMad session

---

### Test 3: Visual Canvas Diagram Mode

**Goal**: Verify Mermaid diagram editor works

**Steps:**
1. In the Visual Canvas toolbar, click the "Diagram" button
2. You should see a code editor appear
3. Type or paste this Mermaid code:
   ```
   graph TD
     A[Start] --> B{Decision}
     B -->|Yes| C[Action 1]
     B -->|No| D[Action 2]
   ```
4. The diagram should render in real-time below the code

**Expected Result:**
- ✅ Diagram editor loads
- ✅ Live preview of diagram appears
- ✅ You can edit code and see updates
- ✅ No error messages

---

### Test 4: Error Display

**Goal**: Verify errors are shown clearly to users

**Intentionally Trigger an Error:**

1. **Option A: Disconnect internet** during message send
2. **Option B: Invalid ANTHROPIC_API_KEY**
   - Stop dev server
   - In `.env.local`, change `ANTHROPIC_API_KEY` to `invalid-key`
   - Restart dev server
   - Try to send a message

**Expected Result:**
- ✅ Error message appears in chat as a system message (red/yellow background)
- ✅ Error includes troubleshooting steps:
  - Check internet connection
  - Verify you're signed in
  - Try refreshing the page
  - Contact support if persists
- ✅ Console shows detailed error with stack trace

**Sample Error Message You Should See:**
```
❌ Error: Failed to send message: ANTHROPIC_API_KEY not set

Troubleshooting:
- Check your internet connection
- Verify you're signed in
- Try refreshing the page
- If the problem persists, contact support
```

---

## Debugging Tools

### Console Log Prefixes

All logs are now tagged with prefixes to make debugging easier:

- `[Chat Stream]` - API route logs (server-side)
- `[Workspace]` - Workspace page logs (client-side)
- `[EnhancedCanvasWorkspace]` - Canvas component logs
- `[Claude Client]` - Claude API client logs

### Viewing Server Logs

Server logs appear in your terminal where `npm run dev` is running.

**Filter for specific logs:**
```bash
# In your terminal:
npm run dev 2>&1 | grep "\[Chat Stream\]"
```

### Viewing Client Logs

Client logs appear in your browser console (F12).

**Filter in browser console:**
- Type `[Chat Stream]` in the console filter box
- Or `[Workspace]`
- Or `[EnhancedCanvasWorkspace]`

---

## Common Issues & Solutions

### Issue 1: Mary Not Responding

**Symptoms:**
- Message sent but no response
- "Sending..." status never completes
- No error message shown

**Check:**
1. Open browser console
2. Look for errors with `[Workspace]` or `[Chat Stream]` prefix
3. Check terminal for server errors

**Solutions:**
- If you see `ANTHROPIC_API_KEY not set`:
  ```bash
  # In apps/web/.env.local
  ANTHROPIC_API_KEY=sk-ant-your-key-here
  ```

- If you see `Workspace not found`:
  - Sign out completely
  - Sign back in
  - Workspace will be auto-created

- If you see `Unauthorized`:
  - Check Supabase connection
  - Verify SUPABASE env vars are set
  - Try signing out and back in

### Issue 2: Canvas Completely Blank

**Symptoms:**
- Right pane shows "Visual Canvas" header but nothing below
- No toolbar visible
- No "Draw" or "Diagram" buttons

**Check:**
1. Open browser console
2. Look for `[EnhancedCanvasWorkspace]` errors

**Solutions:**
- If you see component errors in console:
  - Note the error message
  - Refresh the page
  - If persists, check if tldraw/mermaid packages are installed:
    ```bash
    cd apps/web
    npm list tldraw @tldraw/tldraw mermaid
    ```

- If canvas loads but is unresponsive:
  - Try switching between Draw and Diagram modes
  - Check if sessionId is being passed (logs will show this)

### Issue 3: Streaming Stops Mid-Response

**Symptoms:**
- Mary starts responding
- Response stops halfway through
- No completion or error message

**Check:**
- Console for `[Workspace] Stream complete` message
- If missing, check for network errors

**Solutions:**
- Network timeout: Increase timeout in Vercel settings (production)
- Streaming interrupted: Check CloudFlare/proxy settings
- Token limit hit: Check Claude API usage/limits

---

## What To Report

If you encounter issues, please capture:

1. **Console Logs** (F12 → Console tab)
   - Copy all logs with `[Chat Stream]`, `[Workspace]`, or `[EnhancedCanvasWorkspace]`
   - Include the full error stack trace

2. **Network Tab** (F12 → Network tab)
   - Filter for `/api/chat/stream`
   - Check the request payload and response
   - Note HTTP status code

3. **Server Logs** (Terminal)
   - Copy any `[Chat Stream]` or `[Claude Client]` logs
   - Include stack traces

4. **Screenshots**
   - Show the error state in the UI
   - Show console errors
   - Show network tab if relevant

5. **Steps to Reproduce**
   - Exact steps you took
   - What you expected to happen
   - What actually happened

---

## Next Steps (Not Yet Implemented)

These are planned improvements from the original epic:

### Future Work - Unified Chat + BMad Experience (Epic 3)
- Make Mary session-aware in chat
- Conversational pathway execution (no forms)
- Session progress visualization in chat
- Ability to start BMad sessions from chat

### Future Work - Session Management (Epic 4)
- Session creation from chat
- Resume previous sessions
- Credit balance display
- `/pause`, `/resume`, `/end` commands

### Future Work - E2E Testing (Epic 6)
- Automated end-to-end tests
- New user onboarding
- Performance optimization

---

## Success Criteria

You'll know the core fixes are working when:

✅ **Chat Works:**
- You can send messages to Mary
- Mary responds within 2-3 seconds
- Responses stream smoothly
- No silent failures (errors are shown if they occur)

✅ **Canvas Works:**
- Canvas loads on the right side
- You can switch between Draw and Diagram modes
- Draw mode lets you draw freely
- Diagram mode shows Mermaid editor with live preview

✅ **Errors Are Visible:**
- If something fails, you see an error message
- Error message includes troubleshooting steps
- Console logs provide detailed debugging info

---

## Contact

If you have questions or need help debugging:
1. Share console logs (with prefixes)
2. Share server logs (terminal output)
3. Share screenshots of the issue
4. Describe exact steps to reproduce

The comprehensive logging added in this fix will make it much easier to diagnose any remaining issues!
