# Fix Gemini API Permission Error

## Error Summary

```
Error: 403 - Permission denied on resource project default.
Reason: CONSUMER_INVALID
Service: cloudaicompanion.googleapis.com
```

## Root Cause

The error indicates that the Google Cloud project configuration is invalid or not properly set up for the Gemini API (Cloud AI Companion). This happens when:

1. **No Google Cloud Project configured** - The API is trying to use "project default" which doesn't exist
2. **Gemini API not enabled** in your Google Cloud project
3. **Missing or incorrect Google Cloud credentials**
4. **API key not associated with a valid project**

## Solution Options

### Option 1: Use OpenAI or Anthropic Instead (Recommended for this project)

Your project is configured to use **OpenAI (GPT-4)** and **Anthropic (Claude)** for AI features, not Google Gemini. 

**Check your `.env` file:**

```bash
# Verify your AI API keys are set
grep -E "OPENAI_API_KEY|ANTHROPIC_API_KEY" .env
```

**Configure your `.env`:**

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-actual-key-here
OPENAI_ORG_ID=org-your-org-id
OPENAI_DEFAULT_MODEL=gpt-4-turbo-preview

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
ANTHROPIC_DEFAULT_MODEL=claude-3-5-sonnet-20241022
```

### Option 2: Set Up Google Cloud for Gemini API

If you want to use Google Gemini:

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing project
3. Note your **Project ID** (not "default")

#### Step 2: Enable Gemini API

```bash
# Install gcloud CLI if not already installed
# https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable the Cloud AI Companion API
gcloud services enable cloudaicompanion.googleapis.com

# Enable Vertex AI API (for Gemini)
gcloud services enable aiplatform.googleapis.com
```

#### Step 3: Create API Credentials

**For API Key:**
1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. **Important:** Restrict the API key to specific APIs for security

**For Service Account (recommended for production):**
```bash
# Create service account
gcloud iam service-accounts create gemini-api-user \
    --display-name="Gemini API Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:gemini-api-user@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Create and download key
gcloud iam service-accounts keys create gemini-key.json \
    --iam-account=gemini-api-user@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

#### Step 4: Configure Environment Variables

Add to your `.env`:

```bash
# Google Cloud / Gemini Configuration
GOOGLE_CLOUD_PROJECT=your-actual-project-id
GOOGLE_API_KEY=your-google-api-key
# OR for service account:
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gemini-key.json

# Gemini Model Configuration
GEMINI_API_KEY=your-google-api-key
GEMINI_DEFAULT_MODEL=gemini-1.5-pro
```

#### Step 5: Update AI Service Configuration

If you want to add Gemini as an AI provider, update your AI service code:

```typescript
// services/ai/src/config/ai-providers.ts
export const aiProviders = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_DEFAULT_MODEL
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_DEFAULT_MODEL
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    model: process.env.GEMINI_DEFAULT_MODEL || 'gemini-1.5-pro'
  }
}
```

### Option 3: Disable Gemini Integration

If you're not using Gemini and don't need it:

1. **Check where Gemini is being called** in your code:
   ```bash
   grep -r "gemini\|Gemini\|GEMINI" --include="*.ts" --include="*.js"
   ```

2. **Remove or comment out** any Gemini-related code

3. **Update MCP server configuration** if using MCP with Gemini

## Verification

After applying the fix:

```bash
# For OpenAI/Anthropic
node -e "console.log('OpenAI:', !!process.env.OPENAI_API_KEY); console.log('Anthropic:', !!process.env.ANTHROPIC_API_KEY)"

# For Gemini (if configured)
gcloud auth application-default print-access-token
```

## Common Issues

### "Project default" Error
- **Cause:** No Google Cloud project configured
- **Fix:** Set `GOOGLE_CLOUD_PROJECT` environment variable with actual project ID

### "API not enabled" Error
- **Cause:** Gemini/Vertex AI API not enabled in Google Cloud
- **Fix:** Enable APIs as shown in Step 2

### Authentication Errors
- **Cause:** Missing or invalid credentials
- **Fix:** Use service account or API key as shown in Step 3

## Recommended Approach for Your Project

Based on your `CLAUDE.md` and `.env.example`, your project uses:
- ✅ **OpenAI (GPT-4)** for AI features
- ✅ **Anthropic (Claude)** for conversational AI

**You don't need Google Gemini unless you specifically want to add it as a third AI provider.**

### Action Items:

1. **Ensure your `.env` has valid API keys:**
   ```bash
   cp .env.example .env
   # Edit .env and add your actual OpenAI and Anthropic API keys
   ```

2. **Verify AI service configuration:**
   ```bash
   # Check AI service
   cat services/ai/src/index.ts | grep -A 10 "apiKey"
   ```

3. **If you see Gemini references you don't need:**
   ```bash
   # Find and remove them
   grep -r "gemini" services/ai/
   ```

## Cost Comparison

If choosing between providers:

| Provider | Model | Input (per 1M tokens) | Output (per 1M tokens) |
|----------|-------|----------------------|------------------------|
| OpenAI | GPT-4 Turbo | $10 | $30 |
| Anthropic | Claude 3.5 Sonnet | $3 | $15 |
| Google | Gemini 1.5 Pro | $1.25 | $5 |

Gemini is cheaper but requires Google Cloud setup. Your current setup with OpenAI/Anthropic is simpler.

## Additional Resources

- [Google Cloud Vertex AI - Gemini](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)
- [Vercel AI SDK - Google Provider](https://sdk.vercel.ai/providers/ai-sdk-providers/google)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
