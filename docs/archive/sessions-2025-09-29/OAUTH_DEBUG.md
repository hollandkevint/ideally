# Google OAuth Debug Guide

## Issue: OAuth Redirect Loop

**Symptoms**:
- Click "Continue with Google"
- Gets stuck on "Coming from OAuth, waiting for auth sync"
- Redirects back to login after 5 attempts
- Server logs show NO /auth/callback request

## Root Cause Analysis

The OAuth callback URL is likely misconfigured in Supabase, causing the redirect to fail before reaching your application.

## Fix Steps

### 1. Check Supabase OAuth Configuration

1. **Open Supabase Dashboard**
   - Go to your project: https://supabase.com/dashboard
   - Select your ThinkHaven project

2. **Navigate to Authentication Settings**
   ```
   Authentication → URL Configuration
   ```

3. **Verify Site URL**
   ```
   Development: http://localhost:3000
   Production: https://thinkhaven.vercel.app (or your domain)
   ```

4. **Verify Redirect URLs**
   Add these EXACT URLs:
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   https://thinkhaven.vercel.app/**
   https://thinkhaven.vercel.app/auth/callback
   ```

### 2. Check Google Cloud Console

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com/

2. **Navigate to Credentials**
   ```
   APIs & Services → Credentials
   Select your OAuth 2.0 Client ID
   ```

3. **Verify Authorized Redirect URIs**
   Must include Supabase callback URL:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
   
   Example:
   ```
   https://abcdefghijklmnop.supabase.co/auth/v1/callback
   ```

### 3. Test OAuth Flow

After configuration:

1. **Clear browser cookies** for localhost
2. **Restart dev server**
   ```bash
   # Kill existing server
   # Ctrl+C in terminal
   
   # Start fresh
   cd /Users/kthkellogg/Documents/GitHub/thinkhaven/apps/web
   npm run dev
   ```

3. **Test OAuth flow**
   - Open http://localhost:3000/login
   - Click "Continue with Google"
   - Check browser console for errors
   - Check server terminal for callback logs

### 4. Expected Flow

**Successful OAuth Flow**:
```
1. User clicks "Continue with Google"
   → Console: "AuthContext: Starting Google OAuth signin flow"

2. Redirect to Google consent screen
   → User selects account

3. Google redirects to Supabase
   → URL: https://[project].supabase.co/auth/v1/callback?code=...

4. Supabase processes and redirects to your app
   → URL: http://localhost:3000/auth/callback?code=...
   → Server log: "OAuth callback: Received request"

5. Your app exchanges code for session
   → Server log: "OAuth callback: Redirecting to dashboard"

6. User lands on dashboard
   → URL: http://localhost:3000/dashboard?auth_success=true
   → User authenticated
```

## Alternative: Use Email/Password for Now

If OAuth is taking too long to debug:

1. **Disable email confirmation in Supabase** (temp fix)
   ```
   Authentication → Settings → Email Auth
   Toggle OFF: "Enable email confirmations"
   ```

2. **Create account with email/password**
   - Go to http://localhost:3000/signup
   - Enter email + password (min 8 chars)
   - Click "Sign up"
   - Should work immediately without confirmation

3. **Login with email/password**
   - Go to http://localhost:3000/login
   - Enter credentials
   - Click "Sign in"

## Debug Checklist

- [ ] Supabase Site URL matches localhost:3000
- [ ] Supabase Redirect URLs include localhost:3000/**
- [ ] Google OAuth redirect includes Supabase callback URL
- [ ] Browser cookies cleared for localhost
- [ ] Dev server restarted
- [ ] Browser console shows no CORS errors
- [ ] Server logs show callback requests

## Common Issues

**Issue**: "redirect_uri_mismatch" error
**Fix**: Add exact Supabase callback URL to Google Console

**Issue**: Stuck on Google consent screen
**Fix**: Check if Google OAuth app is in "Testing" mode, add your email to test users

**Issue**: CORS error in console
**Fix**: Verify Supabase allows localhost origin

**Issue**: "Invalid redirect URL" from Supabase
**Fix**: Add wildcard pattern localhost:3000/** to Supabase

## Get Help

If still stuck, share these details:
1. Supabase project URL (from dashboard)
2. Browser console errors (F12 → Console tab)
3. Server terminal output when clicking "Continue with Google"
4. Screenshot of Supabase URL Configuration page
