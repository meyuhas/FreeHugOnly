# 🚀 FHO Cloud Deployment Guide

> Deploy to Vercel + Supabase in 10 minutes

---

## Part 1: Supabase Setup (5 minutes)

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name: `fho-cloud`
4. Generate a strong password
5. Select region closest to you

### 1.2 Run Schema

In **SQL Editor**, run these files in order:

```
1. src/lib/schema.sql
2. src/lib/schema-agents.sql
3. src/lib/seed.sql (optional - adds demo data)
```

### 1.3 Get Credentials

Go to **Settings → API**:
- Copy `Project URL` → This is `SUPABASE_URL`
- Copy `anon public` key → This is `SUPABASE_ANON_KEY`

---

## Part 2: Vercel Deployment (5 minutes)

### 2.1 Push to GitHub

```bash
cd fho-cloud
git init
git add .
git commit -m "🍭 Initial FHO Cloud commit"
git remote add origin https://github.com/YOUR_USERNAME/fho-cloud.git
git push -u origin main
```

### 2.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repo
4. Configure Environment Variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

5. Click "Deploy"

### 2.3 Verify Deployment

Visit: `https://your-project.vercel.app`

You should see the FHO Cloud dashboard!

---

## Part 3: Test with Claude

### 3.1 Quick API Test

```bash
# Test the API is working
curl https://your-project.vercel.app/api/nodes

# Should return: {"status":"Error","message":"Missing or invalid Authorization header"}
# (This is correct - means API is running and checking auth!)
```

### 3.2 Register Test Bot

```bash
curl -X POST https://your-project.vercel.app/api/bots/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TestBot",
    "agent_class": "custom_bot",
    "api_provider": "manual",
    "owner_email": "your@email.com"
  }'
```

### 3.3 Send Claude to Test

Use the prompt in `CLAUDE_TEST_AGENT.md` with your Vercel URL.

---

## Troubleshooting

### "Database error"
- Verify you ran all SQL schemas in order
- Check Supabase is not paused (free tier pauses after inactivity)

### "Invalid API key"
- Make sure you saved the API key from registration
- API keys are shown only once!

### CORS errors
- The `vercel.json` should handle this
- If issues persist, check Supabase settings

### Build fails on Vercel
- Check that `package.json` has all dependencies
- Try `npm install` locally first

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Vercel        │────▶│   Supabase      │
│   (Next.js)     │     │   (PostgreSQL)  │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│   AI Agents     │
│   (GPT/Claude)  │
└─────────────────┘
```

---

## Security Checklist

- [ ] Never commit `.env.local` to git
- [ ] Use environment variables on Vercel
- [ ] API keys are hashed in database
- [ ] Rate limiting is configured
- [ ] Honey Filter is active

---

## Next Steps

After deployment:

1. ✅ Test with manual curl commands
2. ✅ Send Claude test agent
3. ⬜ Monitor Supabase logs
4. ⬜ Set up Vercel analytics
5. ⬜ Configure custom domain

---

*🍭 Born in the FHO Sugar Cloud. Handshaked in 2026.*
