# User Guide

Complete guide to running evaluations via CLI and dashboard.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [CLI Usage](#cli-usage)
- [Dashboard Usage](#dashboard-usage)
- [Configuration](#configuration)
- [CI/CD Integration](#cicd-integration)
- [Automation](#automation)

## Installation

### Prerequisites

- Node.js 18.x or higher
- npm or pnpm package manager
- OpenAI and/or Anthropic API keys
- PostgreSQL database (Vercel Postgres)

### Install Package

```bash
# From monorepo root
cd packages/ai-evals
pnpm install

# Or install globally
pnpm add -g @aah/ai-evals
```

### Setup Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your API keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgres://...
```

### Verify Installation

```bash
# Check version
ai-evals --version

# Show help
ai-evals --help
```

## Quick Start

### Run Your First Evaluation

```bash
# List available datasets
ai-evals dataset list

# Run evaluation on a dataset
ai-evals run --dataset compliance-eligibility

# View results
ai-evals report --latest
```

## CLI Usage

### Main Commands

#### `run` - Run Evaluations

Execute evaluation jobs:

```bash
# Run with default configuration
ai-evals run

# Run specific datasets
ai-evals run --dataset compliance-eligibility --dataset compliance-gpa

# Run with specific model
ai-evals run --model gpt-4-turbo

# Run with custom config
ai-evals run --config ./my-config.yaml

# Interactive mode
ai-evals run --interactive

# Parallel execution
ai-evals run --parallel --concurrency 10
```

**Options:**
- `--dataset <name>`: Dataset(s) to evaluate (can specify multiple)
- `--model <id>`: Model to use (default: from config)
- `--config <file>`: Configuration file path
- `--interactive`: Interactive mode with prompts
- `--parallel`: Enable parallel execution
- `--concurrency <n>`: Max parallel executions
- `--baseline <id>`: Compare against baseline
- `--output <file>`: Save report to file
- `--format <type>`: Report format (json|html|csv)

#### `compare` - Compare Models

Compare multiple models on same dataset:

```bash
# Compare two models
ai-evals compare --models gpt-4-turbo claude-sonnet-4

# Compare with specific dataset
ai-evals compare \
  --models gpt-4-turbo gpt-3.5-turbo claude-sonnet-4 \
  --dataset compliance-eligibility \
  --output comparison.html

# Compare with cost optimization
ai-evals compare --models gpt-4-turbo gpt-3.5-turbo --optimize-cost
```

**Options:**
- `--models <ids>`: Models to compare (space-separated)
- `--dataset <name>`: Dataset to use
- `--output <file>`: Save comparison to file
- `--format <type>`: Output format
- `--optimize-cost`: Minimize evaluation cost

#### `report` - Generate Reports

Generate and export reports:

```bash
# Show latest report
ai-evals report --latest

# Show specific report
ai-evals report --job <job-id>

# Export to HTML
ai-evals report --job <job-id> --format html --output report.html

# Export to CSV
ai-evals report --job <job-id> --format csv --output results.csv

# View historical reports
ai-evals report --list
```

**Options:**
- `--latest`: Show most recent report
- `--job <id>`: Specific job ID
- `--list`: List all available reports
- `--format <type>`: Output format (json|html|csv)
- `--output <file>`: Save to file
- `--details`: Include detailed results
- `--regressions`: Show only regressions

#### `dataset` - Manage Datasets

Manage test datasets:

```bash
# List all datasets
ai-evals dataset list

# Show dataset details
ai-evals dataset show compliance-eligibility

# Validate dataset
ai-evals dataset validate compliance-eligibility

# Export dataset
ai-evals dataset export compliance-eligibility --format json

# Import dataset
ai-evals dataset import ./my-dataset.json

# Create new dataset
ai-evals dataset create --name my-dataset --from-template compliance
```

**Commands:**
- `list`: List all datasets
- `show <name>`: Show dataset details
- `validate <name>`: Validate dataset structure
- `export <name>`: Export dataset
- `import <file>`: Import dataset
- `create`: Create new dataset

#### `config` - Configuration Management

Manage configuration files:

```bash
# Initialize new config
ai-evals config init

# Initialize from template
ai-evals config init --template compliance

# Validate config
ai-evals config validate

# Show current config
ai-evals config show

# Edit config
ai-evals config edit
```

**Commands:**
- `init`: Create configuration file
- `validate`: Validate configuration
- `show`: Display current configuration
- `edit`: Open config in editor

### Configuration File

Create `ai-evals.config.yaml`:

```yaml
# Model configurations
models:
  - id: openai/gpt-4-turbo
    temperature: 0.1
    maxTokens: 2000
    timeout: 30000

  - id: anthropic/claude-sonnet-4
    temperature: 0.1
    maxTokens: 2000

# Default datasets to run
datasets:
  - compliance-eligibility
  - compliance-continuing
  - conversational-ncaa-rules

# Execution settings
execution:
  parallel: true
  concurrency: 10
  rateLimit:
    requestsPerMinute: 100
    tokensPerMinute: 100000

# Scoring configuration
scoring:
  strategy: exact
  threshold: 0.85

# Baseline for regression detection
baseline: baseline-production-v1

# Output settings
output:
  format: html
  directory: ./reports
  saveResults: true

# Notification settings (optional)
notifications:
  slack:
    enabled: true
    webhook: https://hooks.slack.com/...
    channel: "#ai-evals"
    onFailure: true
    onSuccess: false

  email:
    enabled: false
    recipients:
      - team@example.com
```

### Advanced CLI Usage

#### Pipeline Execution

Chain commands together:

```bash
# Run, compare to baseline, and export report
ai-evals run --baseline prod-v1 && \
  ai-evals report --latest --format html --output report.html && \
  echo "Report generated: report.html"
```

#### Scheduled Runs

Use cron for scheduled evaluations:

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * cd /path/to/project && ai-evals run --config production.yaml >> evals.log 2>&1
```

#### Debugging

Enable verbose output:

```bash
# Verbose mode
ai-evals run --verbose

# Debug mode
DEBUG=ai-evals:* ai-evals run

# Dry run (no execution)
ai-evals run --dry-run
```

## Dashboard Usage

### Accessing the Dashboard

Navigate to `/admin/evals` in your application:

```
https://your-app.com/admin/evals
```

### Dashboard Features

#### 1. Overview Page

- Recent evaluation runs
- Accuracy trends over time
- Cost and latency metrics
- Active regressions alert

#### 2. Run Details

- Individual test case results
- Failed test analysis
- Model comparison view
- Export functionality

#### 3. Dataset Management

- Browse all datasets
- Create/edit test cases
- View version history
- Import/export datasets

#### 4. Baseline Management

- View all baselines
- Set active baseline
- Compare runs to baseline
- Configure regression thresholds

### Dashboard Workflows

#### Running an Evaluation

1. Navigate to **Evals** > **New Run**
2. Select datasets from dropdown
3. Choose model(s) to evaluate
4. Configure execution settings
5. Click **Start Evaluation**
6. Monitor progress in real-time
7. View results when complete

#### Analyzing Results

1. Navigate to **Evals** > **Reports**
2. Click on a report to view details
3. Filter by:
   - Test status (passed/failed)
   - Category
   - Difficulty level
4. View individual test details
5. Export results

#### Managing Baselines

1. Navigate to **Baselines**
2. Click **Create Baseline** after a successful run
3. Set baseline name and description
4. Click **Set as Active** to use for comparisons
5. Configure regression thresholds if needed

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/ai-evals.yml`:

```yaml
name: AI Evaluations

on:
  pull_request:
    paths:
      - 'services/ai/**'
      - 'services/compliance/**'
      - 'services/advising/**'
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  evaluate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Run evaluations
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          cd packages/ai-evals
          pnpm run eval:ci

      - name: Check for regressions
        run: |
          cd packages/ai-evals
          node scripts/check-regressions.js

      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: eval-report
          path: packages/ai-evals/reports/

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('packages/ai-evals/reports/summary.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

### Deployment Blocking

Block deployments on critical regressions:

```yaml
- name: Check for critical regressions
  run: |
    cd packages/ai-evals
    CRITICAL_REGRESSIONS=$(node -e "
      const report = require('./reports/latest.json');
      console.log(report.regressions.filter(r => r.severity === 'critical').length);
    ")

    if [ $CRITICAL_REGRESSIONS -gt 0 ]; then
      echo "❌ Critical regressions detected. Blocking deployment."
      exit 1
    fi
```

## Automation

### NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "eval": "ai-evals run",
    "eval:ci": "ai-evals run --config ci.yaml --baseline prod",
    "eval:compare": "ai-evals compare --models gpt-4-turbo claude-sonnet-4",
    "eval:report": "ai-evals report --latest --format html",
    "eval:watch": "nodemon --exec 'ai-evals run' --watch services/"
  }
}
```

### Pre-commit Hooks

Use Husky for pre-commit checks:

```bash
# Install Husky
pnpm add -D husky

# Create pre-commit hook
cat > .husky/pre-commit << 'HOOK'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run quick evals on changed AI code
if git diff --cached --name-only | grep -q "services/ai"; then
  echo "Running AI evaluations..."
  cd packages/ai-evals
  pnpm run eval:quick
fi
HOOK

chmod +x .husky/pre-commit
```

### Monitoring & Alerts

#### Slack Notifications

```typescript
// scripts/notify-slack.ts
import { WebClient } from '@slack/web-api';

async function notifySlack(report: EvalReport) {
  const slack = new WebClient(process.env.SLACK_TOKEN);

  const regressions = report.regressions.filter(r => r.severity === 'critical');

  if (regressions.length > 0) {
    await slack.chat.postMessage({
      channel: '#ai-alerts',
      text: `🚨 Critical regression detected in AI models!`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Critical Regressions Detected*\n${regressions.length} critical issues found`,
          },
        },
        {
          type: 'section',
          fields: regressions.map(r => ({
            type: 'mrkdwn',
            text: `*${r.testCaseId}*: ${r.metric} ${r.percentChange.toFixed(2)}%`,
          })),
        },
      ],
    });
  }
}
```

#### Email Reports

```typescript
// scripts/email-report.ts
import nodemailer from 'nodemailer';

async function emailReport(report: EvalReport) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: 'evals@example.com',
    to: 'team@example.com',
    subject: `AI Eval Report - ${report.summary.accuracy}% accuracy`,
    html: generateHTMLReport(report),
    attachments: [
      {
        filename: 'report.json',
        content: JSON.stringify(report, null, 2),
      },
    ],
  });
}
```

---

**Last Updated**: 2025-01-08
**Framework Version**: 1.0.0
