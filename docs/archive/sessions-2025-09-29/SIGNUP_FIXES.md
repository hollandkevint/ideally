# Signup Issues & Fixes

## ✅ Fixed: "Sign in here" Link Not Visible

**Issue**: Link text was not visible due to CSS color inheritance
**Fix**: Changed to explicit colors (blue-600) with underline
**Status**: ✅ Hot-reloaded - refresh page to see fix

## ⚠️ Email Confirmation Not Sending

### Quick Solution: Use Google OAuth Instead

**Recommended for Testing**:
1. Go to http://localhost:3000
2. Click "Continue with Google"
3. Skip email signup entirely
4. Instant access without confirmation

### Alternative: Fix Supabase Email Configuration

**Steps**:

1. **Open Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to: Authentication → Settings

2. **Option A: Disable Email Confirmation (Testing Only)**
   ```
   Settings → Email Auth
   Toggle OFF: "Enable email confirmations"
   Save changes
   ```
   
3. **Option B: Check Email Template**
   ```
   Authentication → Email Templates
   Verify "Confirm signup" template is enabled
   Check template configuration
   ```

4. **Option C: Manually Confirm Users (Testing)**
   ```
   Authentication → Users
   Find user: kholland7@gmail.com
   Click user → Confirm email manually
   ```

5. **Check Email Delivery Logs**
   ```
   Supabase Dashboard → Logs
   Filter by: "auth.email"
   Look for delivery failures
   ```

### Common Email Issues

**Issue**: Emails not being sent from localhost
**Reason**: Some email providers block localhost origins
**Solution**: 
- Use Google OAuth for local testing
- Or deploy to Vercel and test with production URLs

**Issue**: Email in spam folder
**Solution**: Check spam/junk folder for confirmation email

**Issue**: Email template not configured
**Solution**: Set up SMTP or use Supabase's default email service

## 🚀 Recommended Testing Flow

For fastest testing experience:

1. ✅ Use Google OAuth (no email confirmation needed)
2. Skip email/password signup for now
3. Test core application features
4. Configure email later for production

## Next Steps

Once signed in (via Google OAuth):
1. You'll land on the dashboard
2. Create a new strategic session
3. Test chat with Mary AI
4. Test BMad Method pathways

See `/docs/QUICK_START.md` for full testing guide.
