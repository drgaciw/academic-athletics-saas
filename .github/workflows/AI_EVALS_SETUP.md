# AI Evaluations CI/CD Setup Guide

This guide explains how to set up and configure the AI Evaluations workflow for the Athletic Academics Hub platform.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [GitHub Secrets Setup](#github-secrets-setup)
- [Branch Protection Rules](#branch-protection-rules)
- [Workflow Features](#workflow-features)
- [Usage](#usage)
- [Regression Override Process](#regression-override-process)
- [Troubleshooting](#troubleshooting)

## Overview

The AI Evaluations workflow (`ai-evals.yml`) automatically runs comprehensive evaluations on AI-powered features when changes are detected in AI-related code. The workflow:

- **Detects changes** in AI code and determines which eval suites to run
- **Executes evaluations** for affected AI features (compliance, advising, conversational, risk prediction, RAG, safety)
- **Reports results** as PR comments with detailed metrics
- **Blocks deployment** when critical regressions are detected
- **Supports override** mechanism for intentional changes

## Prerequisites

### 1. Repository Setup

Ensure the following packages are properly configured:

- `packages/ai-evals` - AI evaluation framework with CLI
- `packages/ai` - Core AI utilities and agents
- `services/ai` - AI microservice with routes and services

### 2. Required Dependencies

The workflow requires these dependencies to be installed:

```json
{
  "dependencies": {
    "@ai-sdk/openai": "^0.0.66",
    "@ai-sdk/anthropic": "^0.0.51",
    "ai": "^3.4.9",
    "commander": "^12.1.0",
    "jq": "command-line JSON processor"
  }
}
```

### 3. Database Setup

Create a separate database for eval runs (recommended to keep separate from production):

```bash
# Create eval database (Vercel Postgres)
vercel postgres create eval-database

# Get connection string
vercel postgres url eval-database
```

## GitHub Secrets Setup

Configure the following secrets in your GitHub repository. These correspond to the environment variables in your local `.env` file.

### Required Secrets

Navigate to **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name         | Description                                 | .env Variable       | How to Obtain                                           |
| ------------------- | ------------------------------------------- | ------------------- | ------------------------------------------------------- |
| `OPENAI_API_KEY`    | OpenAI API key for GPT models               | `OPENAI_API_KEY`    | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude models         | `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com/)     |
| `EVAL_DATABASE_URL` | Postgres connection string for eval results | `DATABASE_URL`      | Vercel Postgres connection string                       |

### Optional AI Provider Secrets

Additional AI providers supported in the workflow:

| Secret Name          | Description                | .env Variable        | How to Obtain                                              |
| -------------------- | -------------------------- | -------------------- | ---------------------------------------------------------- |
| `GOOGLE_API_KEY`     | Google AI (Gemini) API key | `GOOGLE_API_KEY`     | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `PERPLEXITY_API_KEY` | Perplexity AI API key      | `PERPLEXITY_API_KEY` | [Perplexity](https://www.perplexity.ai/)                   |
| `MISTRAL_API_KEY`    | Mistral AI API key         | `MISTRAL_API_KEY`    | [Mistral Console](https://console.mistral.ai/)             |
| `OPENROUTER_API_KEY` | OpenRouter API key         | `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai/)                       |
| `XAI_API_KEY`        | xAI (Grok) API key         | `XAI_API_KEY`        | [xAI Console](https://console.x.ai/)                       |
| `CEREBRAS_API_KEY`   | Cerebras API key           | `CEREBRAS_API_KEY`   | [Cerebras](https://cloud.cerebras.ai/)                     |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key      | `AI_GATEWAY_API_KEY` | [Vercel Dashboard](https://vercel.com/dashboard)           |

### Claude Code Workflow Secrets

For the Claude Code workflow (`claude.yml`):

| Secret Name               | Description             | .env Variable    | How to Obtain                                          |
| ------------------------- | ----------------------- | ---------------- | ------------------------------------------------------ |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code OAuth token | N/A (OAuth flow) | [Claude Code App](https://github.com/apps/claude-code) |

> **Note:** Alternatively, you can use `ANTHROPIC_API_KEY` instead of OAuth token.

### Setting Secrets via GitHub CLI

```bash
# Primary AI Providers (from .env values)
gh secret set OPENAI_API_KEY --body "sk-proj-..."
gh secret set ANTHROPIC_API_KEY --body "sk-ant-api03-..."
gh secret set GOOGLE_API_KEY --body "AIza..."

# Additional AI Providers (from .env values)
gh secret set PERPLEXITY_API_KEY --body "pplx-..."
gh secret set MISTRAL_API_KEY --body "..."
gh secret set OPENROUTER_API_KEY --body "sk-or-v1-..."
gh secret set XAI_API_KEY --body "xai-..."
gh secret set CEREBRAS_API_KEY --body "csk-..."
gh secret set AI_GATEWAY_API_KEY --body "vck_..."

# Database
gh secret set EVAL_DATABASE_URL --body "postgres://..."
```

### Setting Secrets via GitHub UI

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**

## Branch Protection Rules

To enable deployment blocking on critical regressions, configure branch protection rules:

### Required Status Checks

1. Navigate to **Settings → Branches → Branch protection rules**
2. Add or edit rule for `main` branch
3. Enable **Require status checks to pass before merging**
4. Add required status checks:
   - `AI Evals Status Check`
5. Enable **Require branches to be up to date before merging**

### Configuration via GitHub UI

```
Repository Settings
  └─ Branches
      └─ Add rule / Edit
          ├─ Branch name pattern: main
          ├─ ☑ Require status checks to pass before merging
          │   └─ Required checks:
          │       └─ AI Evals Status Check
          ├─ ☑ Require branches to be up to date before merging
          └─ ☑ Include administrators (optional but recommended)
```

### Configuration via GitHub CLI

```bash
# Enable required status check
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=AI Evals Status Check
```

## Workflow Features

### 1. Smart Change Detection

The workflow uses path filters to detect changes in AI code:

```yaml
filters:
  compliance:
    - "packages/ai/agents/compliance-agent.ts"
    - "services/ai/src/services/complianceAgent.ts"
  advising:
    - "packages/ai/agents/advising-agent.ts"
    - "services/ai/src/services/advisingAgent.ts"
  # ... other AI components
```

Only affected eval suites run, saving time and API costs.

### 2. Matrix Strategy

The workflow uses a matrix strategy to run multiple eval suites in parallel:

```yaml
strategy:
  fail-fast: false
  matrix:
    eval_suite:
      - compliance
      - advising
      - conversational
      - risk-prediction
      - rag
      - safety
```

### 3. Artifact Storage

Eval results are stored as workflow artifacts for 30 days:

- **JSON results**: Raw evaluation data
- **Markdown reports**: Human-readable reports
- **Retention**: 30 days (configurable)

### 4. PR Status Checks

The workflow updates PR status checks:

- ✅ **Success**: All evals passed
- ⚠️ **Warning**: Regressions detected (non-critical)
- 🚨 **Failure**: Critical regressions detected
- ⚙️ **Pending**: Evals in progress

### 5. Automated PR Comments

The workflow posts/updates a comment on PRs with:

- Overall evaluation status
- Summary metrics (tests, accuracy, cost)
- Regression warnings
- Links to detailed reports

## Usage

### Automatic Trigger

The workflow automatically runs when:

1. A pull request is **opened, synchronized, or reopened**
2. Changes are detected in AI-related paths:
   - `packages/ai/**`
   - `services/ai/**`
   - `packages/ai-evals/**`

### Manual Trigger

Run the workflow manually via GitHub Actions UI:

1. Go to **Actions** → **AI Evaluations**
2. Click **Run workflow**
3. Configure options:
   - **Force run**: Run all evals regardless of changes
   - **Baseline ID**: Compare against specific baseline

### Manual Trigger via CLI

```bash
# Trigger workflow with default options
gh workflow run ai-evals.yml

# Trigger with force run
gh workflow run ai-evals.yml \
  --field force_run=true

# Trigger with baseline comparison
gh workflow run ai-evals.yml \
  --field baseline_id=run_abc123
```

### View Results

**In PR Comment:**

- Summary metrics displayed automatically in PR comment
- Updated on each workflow run

**In Workflow Summary:**

- Click on workflow run → **Summary** tab
- View detailed metrics for each eval suite

**In Artifacts:**

- Click on workflow run → Scroll to **Artifacts** section
- Download `eval-results-{suite}` for JSON data
- Download `eval-report-{suite}` for markdown report

## Regression Override Process

When critical regressions are detected, deployment is blocked unless overridden.

### When to Override

Override regressions when:

- Changes are **intentional** (e.g., new feature, model upgrade)
- Regression is **expected** and documented
- Benefits **outweigh** the regression
- Plan exists to **address** regression in future

### Override Workflow

#### 1. Review Regression Details

1. Check PR comment for regression summary
2. Download detailed reports from artifacts
3. Analyze which tests failed and why
4. Determine if regression is acceptable

#### 2. Add Override Label

**Via GitHub UI:**

1. Go to the pull request
2. Click **Labels** in the right sidebar
3. Select or create `regression-override` label

**Via GitHub CLI:**

```bash
gh pr edit {PR_NUMBER} --add-label regression-override
```

#### 3. Document Override Decision

Add a comment to the PR documenting:

- **Reason** for override
- **Impact** of regression
- **Mitigation** plan (if applicable)
- **Approver** who authorized override

Example:

```markdown
## Regression Override

**Reason:** Upgraded to GPT-4 Turbo for better accuracy
**Impact:** 5% decrease in conversational response speed
**Mitigation:** Implementing response caching (tracked in #123)
**Approved by:** @tech-lead
```

#### 4. Required Approvals

Configure required approvals for `regression-override` label:

1. Go to **Settings → Branches → Branch protection rules**
2. Enable **Require pull request reviews before merging**
3. Set **Required approving reviews: 2** (recommended)
4. Enable **Require review from Code Owners**

#### 5. Remove Override After Merge

The override label should be removed after merge to prevent accidental use.

## Troubleshooting

### Issue: Workflow Not Triggering

**Symptoms:**

- PR created but workflow doesn't run
- No status check appears

**Solutions:**

1. **Check path filters:**

   ```bash
   # Verify changed files match path filters
   git diff --name-only origin/main...HEAD
   ```

2. **Check workflow file syntax:**

   ```bash
   # Validate YAML syntax
   yamllint .github/workflows/ai-evals.yml
   ```

3. **Check workflow permissions:**
   - Ensure Actions are enabled: Settings → Actions → General
   - Verify workflow permissions: Settings → Actions → General → Workflow permissions

### Issue: API Key Errors

**Symptoms:**

- Eval run fails with "API key not found"
- Authentication errors in logs

**Solutions:**

1. **Verify secrets are set:**

   ```bash
   # List all secrets (values hidden)
   gh secret list
   ```

2. **Check secret names match exactly:**
   - `OPENAI_API_KEY` (not `OPENAI_KEY`)
   - `ANTHROPIC_API_KEY` (not `ANTHROPIC_KEY`)

3. **Validate API keys:**

   ```bash
   # Test OpenAI key
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"

   # Test Anthropic key
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-3-sonnet-20240229","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
   ```

### Issue: Database Connection Failures

**Symptoms:**

- "Database connection failed" error
- Timeout connecting to database

**Solutions:**

1. **Verify database URL format:**

   ```
   postgres://user:password@host:port/database?sslmode=require
   ```

2. **Check database is accessible:**

   ```bash
   # Test connection
   psql "$EVAL_DATABASE_URL" -c "SELECT 1"
   ```

3. **Verify Vercel Postgres settings:**
   - Database is in same region as workflow runners (use US regions)
   - Connection pooling enabled
   - Max connections sufficient (recommend 20+)

### Issue: Timeout Errors

**Symptoms:**

- Workflow times out after 30 minutes
- "Job execution time has exceeded the maximum"

**Solutions:**

1. **Reduce concurrency:**

   ```yaml
   # In workflow file
   --concurrency <number> # Default: 5, try: 3
   ```

2. **Reduce dataset size:**
   - Use representative sample of test cases
   - Split large datasets into smaller suites

3. **Increase timeout (if needed):**
   ```yaml
   # In workflow file, under run-evals job
   timeout-minutes: 45 # Increase from 30
   ```

### Issue: Results Not Posted to PR

**Symptoms:**

- Eval runs successfully but no PR comment
- "Resource not accessible by integration" error

**Solutions:**

1. **Check workflow permissions:**

   ```yaml
   # In workflow file, under post-pr-comment job
   permissions:
     pull-requests: write # Must be present
   ```

2. **Verify Actions permissions:**
   - Settings → Actions → General → Workflow permissions
   - Select "Read and write permissions"

3. **Check if PR is from fork:**
   - Forks have restricted permissions by default
   - Consider using `pull_request_target` event (security implications)

### Issue: Incorrect Change Detection

**Symptoms:**

- Changes in AI code don't trigger relevant evals
- Irrelevant evals run

**Solutions:**

1. **Review path filter patterns:**

   ```yaml
   # Ensure patterns match your file structure
   compliance:
     - "packages/ai/agents/compliance-agent.ts"
   ```

2. **Test path filters locally:**

   ```bash
   # Install paths-filter action locally
   npm install -g @actions/paths-filter

   # Test against your changes
   paths-filter --filters .github/workflows/ai-evals.yml
   ```

3. **Use wildcard patterns if structure varies:**
   ```yaml
   compliance:
     - "packages/ai/**/compliance*.ts"
     - "services/ai/**/compliance*.ts"
   ```

## Advanced Configuration

### Custom Eval Configuration

Create custom eval configuration files for different scenarios:

```yaml
# .github/eval-configs/full-suite.yaml
name: "Full Eval Suite"
environment: "ci"
datasets:
  include:
    - compliance
    - advising
    - conversational
    - risk-prediction
    - rag
    - safety
models:
  - provider: openai
    modelId: gpt-4-turbo
  - provider: anthropic
    modelId: claude-3-opus-20240229
```

### Scheduled Evaluations

Add scheduled runs to catch drift:

```yaml
# Add to ai-evals.yml
on:
  schedule:
    - cron: "0 0 * * 0" # Weekly on Sunday at midnight
```

### Custom Baseline Management

Set baselines programmatically:

```bash
# After successful prod deployment
gh workflow run ai-evals.yml \
  --field force_run=true

# Get run ID
RUN_ID=$(gh run list --workflow=ai-evals.yml --limit 1 --json databaseId -q '.[0].databaseId')

# Set as baseline (in your app/script)
pnpm --filter @aah/ai-evals exec tsx -e "
  import { setBaseline } from './src/orchestrator/baseline-comparator';
  await setBaseline('$RUN_ID', 'production-baseline-2025-01');
"
```

## Support

For issues or questions:

1. Check [troubleshooting section](#troubleshooting)
2. Review [workflow run logs](https://github.com/your-org/athletic-academics-hub/actions/workflows/ai-evals.yml)
3. Open an issue with:
   - Workflow run URL
   - Error messages
   - Steps to reproduce

## References

- [AI Evals Package Documentation](../../packages/ai-evals/README.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
