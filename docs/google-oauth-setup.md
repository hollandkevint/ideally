# Google OAuth Setup Guide

## Google Cloud Console Configuration

### Step 1: Create or Update Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project for `thinkhaven.co`
3. Note the Project ID for reference

### Step 2: Configure OAuth 2.0 Client ID

1. Navigate to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth 2.0 Client IDs**
3. Select **Web application** as application type
4. Set name: `Thinkhaven Web Client`

### Step 3: Add Authorized Domains

**Authorized JavaScript origins:**
- `http://localhost:3000` (development)
- `https://thinkhaven.co` (production)

**Authorized redirect URIs:**
- Not required for ID token flow (One-Tap uses direct token exchange)

### Step 4: Configure Consent Screen

1. Navigate to **OAuth consent screen**
2. Select **External** user type
3. Fill required fields:
   - App name: `Thinkhaven`
   - User support email: Your support email
   - Developer contact email: Your dev email
4. Add required links:
   - Privacy Policy: `https://thinkhaven.co/privacy`
   - Terms of Service: `https://thinkhaven.co/terms`

### Step 5: Get Client ID

1. Copy the **Client ID** from the credentials page
2. Add to your environment variables:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
   ```

## Required Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## Supabase Configuration

### Step 1: Enable Google Provider

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable **Google** provider
3. Add your Google Client ID (from above)
4. Client Secret is not required for ID token flow

### Step 2: Test Configuration

Use the Supabase auth admin interface to verify Google signin works correctly.

## Testing Checklist

- [ ] Google One-Tap appears on localhost:3000
- [ ] Signin creates user in Supabase auth.users table
- [ ] Session persists across browser restarts
- [ ] Production domain (thinkhaven.co) works correctly