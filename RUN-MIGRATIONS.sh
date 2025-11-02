#!/bin/bash

# Script to run Supabase migrations via CLI
# Project: ThinkHaven (lbnhfsocxbwhbvnfpjdw)

echo "🚀 Running Supabase Migrations"
echo "================================"
echo ""

# Extract project ref from URL
PROJECT_REF="lbnhfsocxbwhbvnfpjdw"

echo "Project: $PROJECT_REF"
echo ""

# Check if we need to login
echo "🔐 Checking Supabase authentication..."
if ! npx supabase projects list > /dev/null 2>&1; then
    echo "⚠️  Not logged in. Please login to Supabase:"
    echo ""
    npx supabase login

    if [ $? -ne 0 ]; then
        echo "❌ Login failed"
        exit 1
    fi
    echo ""
fi

# Step 1: Link to remote project (if not already linked)
echo "📎 Step 1: Linking to Supabase project..."
npx supabase link --project-ref $PROJECT_REF --workdir /Users/kthkellogg/Documents/GitHub/thinkhaven/apps/web

if [ $? -ne 0 ]; then
    echo "❌ Failed to link project. You may need to login first:"
    echo "   npx supabase login"
    exit 1
fi

echo "✅ Project linked"
echo ""

# Step 2: Push migrations to remote database
echo "📤 Step 2: Pushing migrations to remote database..."
npx supabase db push --workdir /Users/kthkellogg/Documents/GitHub/thinkhaven/apps/web

if [ $? -ne 0 ]; then
    echo "❌ Migration push failed"
    exit 1
fi

echo ""
echo "✅ Migrations applied successfully!"
echo ""
echo "🔍 Verifying migrations..."

# Step 3: Verify tables exist
npx supabase db execute --workdir /Users/kthkellogg/Documents/GitHub/thinkhaven/apps/web --query "
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_credits', 'credit_transactions', 'credit_packages', 'trial_feedback')
ORDER BY table_name;
" --format table

echo ""
echo "🎉 Migration complete! You can now test the trial flow."
echo ""
echo "Next steps:"
echo "1. Visit http://localhost:3002"
echo "2. Follow TEST-TRIAL-FLOW.md"
