# Supabase Setup Guide for Strategic Workspace

## Step 1: Create Supabase Project

1. **Visit Supabase Dashboard:** https://supabase.com/dashboard
2. **Create New Project:**
   - Name: `ideally-strategic-workspace`
   - Organization: Choose or create
   - Database Password: Generate and save securely
   - Region: Choose closest to your location

## Step 2: Configure Environment Variables

1. **Go to Project Settings → API**
2. **Copy these values to `apps/web/.env.local`:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# Development Settings
NEXT_PUBLIC_ENABLE_CANVAS=false
NEXT_PUBLIC_ENABLE_CONTEXT_BRIDGING=false
NEXT_PUBLIC_ENABLE_GUIDED_WORKFLOWS=false
```

## Step 3: Set Up Database Schema

1. **Go to SQL Editor in Supabase Dashboard**
2. **Create New Query**
3. **Copy and paste the complete schema from `supabase/schema.sql`**
4. **Run the query** - this will create all tables and security policies

## Step 4: Test Connection

After setting up environment variables, restart your dev server:

```bash
npm run dev
```

Navigate to http://localhost:3000 and try:
1. Creating a new account
2. Logging in
3. Accessing the workspace

## Step 5: Verify Database

In Supabase Dashboard → Table Editor, you should see:
- ✅ `users` table
- ✅ `user_workspace` table  
- ✅ `chat_conversations` table
- ✅ All other tables from schema

## Troubleshooting

**Can't connect:** Check environment variable names match exactly
**Auth not working:** Verify anon key is correct and RLS policies are enabled
**Tables missing:** Re-run the SQL schema in SQL Editor

**Need help?** The complete database schema is in `supabase/schema.sql`