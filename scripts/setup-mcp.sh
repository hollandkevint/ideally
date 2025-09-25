#!/bin/bash

# Supabase MCP Setup Script for Strategic Workspace
echo "🔧 Setting up Supabase MCP integration..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install MCP Supabase server globally
echo "📦 Installing MCP Supabase server..."
npm install -g @modelcontextprotocol/server-supabase

# Check if installation was successful
if command -v mcp-server-supabase &> /dev/null; then
    echo "✅ MCP Supabase server installed successfully!"
else
    echo "❌ MCP Supabase server installation failed."
    exit 1
fi

# Check if environment variables are set
if [[ -f "apps/web/.env.local" ]]; then
    echo "✅ Environment file found."
    if grep -q "PASTE_YOUR_ANON_KEY_HERE" apps/web/.env.local; then
        echo "⚠️  Please update your environment variables in apps/web/.env.local"
        echo "   Replace PASTE_YOUR_ANON_KEY_HERE with your actual Supabase anon key"
        echo "   Replace PASTE_YOUR_SERVICE_ROLE_KEY_HERE with your actual service role key"
    else
        echo "✅ Environment variables appear to be configured."
    fi
else
    echo "❌ Environment file not found. Please create apps/web/.env.local"
    exit 1
fi

# Update MCP config with actual environment variables
echo "🔄 Updating MCP configuration..."
if [[ -f ".mcp-config.json" ]]; then
    echo "✅ MCP configuration file found."
    if grep -q "PASTE_YOUR_ANON_KEY_HERE" .mcp-config.json; then
        echo "⚠️  Please update your MCP configuration in .mcp-config.json"
        echo "   Replace the placeholder keys with your actual Supabase keys"
    else
        echo "✅ MCP configuration appears to be set up."
    fi
else
    echo "❌ MCP configuration file not found."
    exit 1
fi

echo ""
echo "🎉 Supabase MCP setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your Supabase keys in apps/web/.env.local"
echo "2. Update your Supabase keys in .mcp-config.json"
echo "3. Restart your development server: npm run dev"
echo "4. Test the connection by visiting http://localhost:3000"
echo ""
echo "📚 MCP will allow Claude Code to directly interact with your Supabase database!"