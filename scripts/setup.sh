#!/bin/bash

# 🍭 FHO Cloud Setup Script
# Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.

echo "🍭 FHO Cloud Setup"
echo "===================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local from example...${NC}"
    cp .env.local.example .env.local
    echo -e "${RED}⚠️  Please edit .env.local with your Supabase credentials!${NC}"
    echo ""
fi

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
npm install

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✅ Supabase CLI found${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Install it with:${NC}"
    echo "   npm install -g supabase"
    echo ""
fi

echo ""
echo "🍭 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your Supabase URL and anon key"
echo "2. Run the SQL schema in Supabase:"
echo "   - src/lib/schema.sql (main schema)"
echo "   - src/lib/schema-agents.sql (bot registration)"
echo "   - src/lib/seed.sql (sample data)"
echo ""
echo "3. Start development server:"
echo "   npm run dev"
echo ""
echo "4. Run tests:"
echo "   npm test"
echo ""
echo "🍭 Standing on the shoulders of giants, without crushing them."
