# ThinkHaven Quick Start Guide

**Development Server**: <http://localhost:3000>

## ✅ Ready to Test

### Step 1: Open the Application

Navigate to <http://localhost:3000> in your browser.

**Expected**: Landing page with Google sign-in button loads immediately.

### Step 2: Sign In with Google

Click the "Continue with Google" button.

**Expected Flow**:

1. Redirect to Google consent screen
2. Select your Google account
3. Grant permissions
4. Return to <http://localhost:3000/dashboard>
5. See "Welcome, [your-email]" in the header

### Step 3: Create Your First Session

1. Click "+ New Strategic Session"
2. Enter:
   - **Name**: "Test Product Strategy"
   - **Description**: "Testing the application"
3. Click "Create Session"

**Expected**: Redirect to workspace with dual-pane interface.

### Step 4: Chat with Mary (Claude AI)

In the chat pane (left side), type:

```text
Hello Mary, I want to test the product idea analysis pathway.
```

Press Enter.

**Expected**:

- Message sends immediately
- Streaming response appears within 2 seconds
- Mary responds with coaching guidance
- Conversation saves to database

### Step 5: Test BMad Method

1. Click the "BMad" tab at the top
2. Select "I have a brand new idea"
3. Follow the pathway with test responses

**Expected**:

- Structured questions appear
- Numbered options (1-9) work
- Phase progression tracked
- State preserved when switching tabs

## 🔧 Fixed Issues

**Issue**: Infinite loading on landing page
**Solution**: Fixed AuthContext loading state logic
**Status**: ✅ Resolved

## 📋 Full Testing Guide

For comprehensive testing instructions, see: `/docs/TESTING_GUIDE.md`

## 🚀 What's Working

- ✅ Google OAuth authentication
- ✅ Claude API streaming endpoint enabled
- ✅ Workspace creation and management
- ✅ Chat interface with streaming responses
- ✅ BMad Method pathway selection
- ✅ Session state persistence
- ✅ Environment variables configured

## 💡 Quick Tips

- **Refresh if stuck**: Ctrl/Cmd + R
- **Clear auth state**: Clear browser cookies for localhost
- **Check logs**: Open browser console (F12) for debug info
- **API errors**: Verify `.env.local` has ANTHROPIC_API_KEY

## 📞 Need Help?

Check the full testing guide at `/docs/TESTING_GUIDE.md` for troubleshooting.