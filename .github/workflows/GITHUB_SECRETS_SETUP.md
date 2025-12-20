# GitHub Secrets Setup Guide

This guide walks you through setting up the required GitHub secrets for the AI Evaluations workflow.

## Required Secrets

The AI Evaluations workflow requires three secrets:

1. **ANTHROPIC_API_KEY** - For Claude models
2. **EVAL_DATABASE_URL** - For storing evaluation results
3. **OPENAI_API_KEY** - (Optional) For OpenAI models if needed

## Setup Steps

### 1. Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create Key**
5. Name it: `academic-athletics-ai-evals`
6. Copy the key (starts with `sk-ant-...`)

### 2. Get Eval Database URL

You need a PostgreSQL database for storing evaluation results. Options:

**Option A: Vercel Postgres (Recommended)**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Create Postgres database
vercel postgres create eval-database

# Get connection string
vercel postgres url eval-database
```

**Option B: Other Postgres Providers**
- [Neon](https://neon.tech/) - Free tier available
- [Supabase](https://supabase.com/) - Free tier available
- [Railway](https://railway.app/) - Free tier available

The connection string should look like:
```
postgres://username:password@host:5432/database
```

### 3. Get OpenAI API Key (Optional)

**Note:** The current configuration uses only Claude models, so this is optional unless you plan to add OpenAI models.

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **Create new secret key**
4. Name it: `academic-athletics-ai-evals`
5. Copy the key (starts with `sk-...`)

### 4. Add Secrets to GitHub

1. Go to your repository on GitHub
2. Click **Settings**
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

Add each secret:

**ANTHROPIC_API_KEY:**
- Name: `ANTHROPIC_API_KEY`
- Value: Your Anthropic API key (sk-ant-...)
- Click **Add secret**

**EVAL_DATABASE_URL:**
- Name: `EVAL_DATABASE_URL`
- Value: Your PostgreSQL connection string
- Click **Add secret**

**OPENAI_API_KEY (Optional):**
- Name: `OPENAI_API_KEY`
- Value: Your OpenAI API key (sk-...)
- Click **Add secret**

### 5. Verify Secrets

```bash
# List all secrets (won't show values)
gh secret list

# Expected output:
# ANTHROPIC_API_KEY  Updated YYYY-MM-DD
# EVAL_DATABASE_URL  Updated YYYY-MM-DD
# OPENAI_API_KEY     Updated YYYY-MM-DD
```

## Testing Secrets

### Test Anthropic API Key

```bash
# Test API key works
curl https://api.anthropic.com/v1/messages \
  -H "anthropic-version: 2023-06-01" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Hi"}]
  }'

# Expected: Should return a JSON response with content
```

### Test Database Connection

```bash
# Test database connection (requires psql)
psql "$EVAL_DATABASE_URL" -c "SELECT 1;"

# Expected: Should return 1
```

## Security Best Practices

1. **Never commit API keys** to the repository
2. **Rotate keys regularly** (every 90 days recommended)
3. **Use separate keys** for dev/staging/production
4. **Set spending limits** on API keys:
   - Anthropic: Console → Settings → Billing → Usage Limits
   - OpenAI: Platform → Settings → Limits
5. **Monitor usage** regularly
6. **Revoke compromised keys** immediately

## Troubleshooting

### Secret Not Found Error

If workflow fails with "secret not found":
1. Verify secret name matches exactly (case-sensitive)
2. Check secret is in **repository** secrets, not environment secrets
3. Ensure you have admin access to repository

### Invalid API Key Error

If API test fails with authentication error:
1. Verify key was copied correctly (no extra spaces)
2. Check key is active in provider console
3. Ensure key has necessary permissions
4. Try creating a new key

### Database Connection Error

If database connection fails:
1. Verify connection string format
2. Check database is accessible from GitHub Actions IPs
3. Ensure database allows SSL connections
4. Test connection locally first

## Cost Estimates

### Anthropic API Costs

Based on Claude Sonnet 4.5 pricing:
- Input: $3 per million tokens
- Output: $15 per million tokens

**Estimated costs per eval run:**
- Small dataset (10 tests): ~$0.05
- Medium dataset (50 tests): ~$0.25
- Large dataset (200 tests): ~$1.00

### Database Costs

- **Vercel Postgres**: Free tier includes 256MB storage
- **Neon**: Free tier includes 0.5GB storage
- **Supabase**: Free tier includes 500MB storage

## Next Steps

After setting up secrets:
1. ✅ [Configure Branch Protection](./BRANCH_PROTECTION_SETUP.md)
2. ✅ [Read Quick Start Guide](./AI_EVALS_QUICKSTART.md)
3. ✅ Test the workflow manually (Actions → AI Evaluations → Run workflow)

## Support

Issues with setup?
- Check [Troubleshooting Guide](../../packages/ai-evals/docs/TROUBLESHOOTING.md)
- Review [Setup Checklist](./SETUP_CHECKLIST.md)
- Open an issue on GitHub
