# Monitoring System Setup Guide

Complete guide to setting up monitoring, alerting, and cost tracking for AI Evals.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Vercel Analytics Setup](#vercel-analytics-setup)
3. [Slack Integration](#slack-integration)
4. [Email Alerting Setup](#email-alerting-setup)
5. [Budget Configuration](#budget-configuration)
6. [Integration with CI/CD](#integration-with-cicd)
7. [Dashboard Integration](#dashboard-integration)
8. [Testing the Setup](#testing-the-setup)

## Prerequisites

Before setting up monitoring, ensure you have:

- Node.js 18+ installed
- Access to Vercel project (for analytics)
- Slack workspace (optional, for Slack alerts)
- Email service account (optional, for email alerts)
- Environment variables configured

## Vercel Analytics Setup

### 1. Enable Vercel Analytics

In your Vercel project dashboard:

1. Navigate to your project
2. Go to "Analytics" tab
3. Click "Enable Analytics"
4. Copy your analytics ID (if needed)

### 2. Install Dependencies

```bash
cd packages/ai-evals
pnpm install @vercel/analytics
```

### 3. Configure Environment

Add to `.env`:

```bash
VERCEL_ANALYTICS_ENABLED=true
```

### 4. Initialize in Code

```typescript
import { AnalyticsTracker } from '@aah/ai-evals/monitoring';

const analytics = new AnalyticsTracker({
  enabled: process.env.VERCEL_ANALYTICS_ENABLED === 'true',
  verbose: true,
  sampleRate: 1.0, // Track 100% of events
});
```

### 5. Verify Analytics

Run an eval and check Vercel Analytics dashboard:

```bash
tsx src/cli.ts eval --dataset compliance-tests --model gpt-4
```

Then go to Vercel Dashboard > Analytics > Custom Events to see tracked events.

## Slack Integration

### 1. Create Slack Incoming Webhook

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name it "AI Evals Monitor" and select your workspace
4. Click "Incoming Webhooks" in left sidebar
5. Toggle "Activate Incoming Webhooks" to On
6. Click "Add New Webhook to Workspace"
7. Select the channel (e.g., `#ai-evals-alerts`)
8. Click "Allow"
9. Copy the webhook URL

### 2. Configure Environment

Add to `.env`:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
SLACK_CHANNEL=#ai-evals-alerts
```

### 3. Initialize Alert Manager

```typescript
import { AlertManager } from '@aah/ai-evals/monitoring';

const alertManager = new AlertManager({
  enabled: true,
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    channel: process.env.SLACK_CHANNEL,
    username: 'AI Evals Monitor',
    iconEmoji: ':robot_face:',
  },
  thresholds: {
    criticalRegressionCount: 1,
    maxCostPerRun: 10,
    minAccuracy: 80,
  },
  dashboardUrl: process.env.DASHBOARD_URL,
});
```

### 4. Test Slack Integration

```typescript
// Test alert
await alertManager.sendRegressionAlert({
  testCaseId: 'test-1',
  metric: 'accuracy',
  severity: 'critical',
  baseline: 0.95,
  current: 0.75,
  percentChange: -21.05,
  absoluteChange: -0.20,
}, mockReport);
```

You should see a message in your Slack channel.

## Email Alerting Setup

### Option 1: Resend (Recommended)

#### 1. Sign Up for Resend

1. Go to https://resend.com
2. Sign up for an account
3. Verify your domain or use `onboarding@resend.dev` for testing
4. Generate an API key

#### 2. Configure Environment

Add to `.env`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
ALERT_EMAIL_FROM=alerts@your-domain.com
ALERT_EMAIL_TO=team@your-domain.com,ops@your-domain.com
ALERT_EMAIL_CC=manager@your-domain.com
```

#### 3. Initialize Alert Manager

```typescript
const alertManager = new AlertManager({
  enabled: true,
  email: {
    provider: 'resend',
    apiKey: process.env.RESEND_API_KEY!,
    from: process.env.ALERT_EMAIL_FROM!,
    to: process.env.ALERT_EMAIL_TO!.split(','),
    cc: process.env.ALERT_EMAIL_CC?.split(','),
  },
});
```

### Option 2: SendGrid

#### 1. Sign Up for SendGrid

1. Go to https://sendgrid.com
2. Sign up for an account
3. Verify your sender identity
4. Generate an API key

#### 2. Configure Environment

Add to `.env`:

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
ALERT_EMAIL_FROM=alerts@your-domain.com
ALERT_EMAIL_TO=team@your-domain.com
```

#### 3. Initialize Alert Manager

```typescript
const alertManager = new AlertManager({
  enabled: true,
  email: {
    provider: 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY!,
    from: process.env.ALERT_EMAIL_FROM!,
    to: process.env.ALERT_EMAIL_TO!.split(','),
  },
});
```

## Budget Configuration

### 1. Set Budget Limits

Add to `.env`:

```bash
# Budget limits in USD
HOURLY_COST_LIMIT=5
DAILY_COST_LIMIT=50
WEEKLY_COST_LIMIT=300
MONTHLY_COST_LIMIT=1000
PER_RUN_COST_LIMIT=10

# Alert threshold (percentage)
COST_ALERT_THRESHOLD=80
```

### 2. Initialize Cost Tracker

```typescript
import { CostTracker } from '@aah/ai-evals/monitoring';

const costTracker = new CostTracker({
  enabled: true,
  verbose: true,
  budget: {
    hourlyLimit: parseFloat(process.env.HOURLY_COST_LIMIT || '5'),
    dailyLimit: parseFloat(process.env.DAILY_COST_LIMIT || '50'),
    weeklyLimit: parseFloat(process.env.WEEKLY_COST_LIMIT || '300'),
    monthlyLimit: parseFloat(process.env.MONTHLY_COST_LIMIT || '1000'),
    perRunLimit: parseFloat(process.env.PER_RUN_COST_LIMIT || '10'),
    alertThreshold: parseFloat(process.env.COST_ALERT_THRESHOLD || '80'),
  },
});
```

### 3. Monitor Budget Status

```typescript
// Check budget status
const dailyBudget = costTracker.getBudgetStatus('daily');
console.log('Daily Budget:');
console.log(`  Used: $${dailyBudget.used.toFixed(2)}`);
console.log(`  Limit: $${dailyBudget.limit.toFixed(2)}`);
console.log(`  Remaining: $${dailyBudget.remaining.toFixed(2)}`);
console.log(`  Percent Used: ${dailyBudget.percentUsed.toFixed(1)}%`);
console.log(`  Exceeded: ${dailyBudget.exceeded}`);

if (dailyBudget.projectedEndOfPeriod) {
  console.log(`  Projected EOP: $${dailyBudget.projectedEndOfPeriod.toFixed(2)}`);
}
```

## Integration with CI/CD

### GitHub Actions Workflow

Create `.github/workflows/ai-evals-monitoring.yml`:

```yaml
name: AI Evals Monitoring

on:
  workflow_run:
    workflows: ["AI Evals"]
    types:
      - completed

env:
  VERCEL_ANALYTICS_ENABLED: true
  SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
  RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
  ALERT_EMAIL_FROM: alerts@your-domain.com
  ALERT_EMAIL_TO: team@your-domain.com
  DAILY_COST_LIMIT: 50
  MONTHLY_COST_LIMIT: 1000
  DASHBOARD_URL: https://your-app.vercel.app/evals

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Send monitoring report
        run: |
          cd packages/ai-evals
          tsx scripts/send-monitoring-report.ts
```

### Monitoring Script

Create `packages/ai-evals/scripts/send-monitoring-report.ts`:

```typescript
import { MonitoringSystem } from '../src/monitoring';
import { prisma } from '@aah/database';

async function main() {
  // Get recent eval reports from database
  const recentRuns = await prisma.evalRun.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    include: {
      results: true,
      metrics: true,
    },
  });

  // Initialize monitoring
  const monitoring = new MonitoringSystem({
    analytics: { enabled: true },
    alerts: {
      enabled: true,
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL!,
      },
    },
    costTracking: { enabled: true },
  });

  // Process each report
  for (const run of recentRuns) {
    const report = convertToEvalReport(run);
    await monitoring.processReport(report);
  }

  // Send daily summary
  const summary = monitoring.getSummary();
  console.log('Daily Summary:', JSON.stringify(summary, null, 2));

  monitoring.destroy();
}

main().catch(console.error);
```

## Dashboard Integration

### Next.js API Route

Create `apps/admin/app/api/evals/monitoring/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getMonitoringSystem } from '@aah/ai-evals/monitoring';
import { prepareDashboardData } from '@aah/ai-evals/monitoring/examples';

export async function GET() {
  try {
    const monitoring = getMonitoringSystem({
      analytics: { enabled: true },
      alerts: { enabled: true },
      costTracking: { enabled: true },
    });

    const data = prepareDashboardData(monitoring);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}
```

### Dashboard Component

Create `apps/admin/app/evals/monitoring/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@aah/ui';

export default function MonitoringPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/evals/monitoring')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>

      {/* Cost Overview */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Cost Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Cost</p>
            <p className="text-2xl font-bold">${data.costs.total.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Daily Cost</p>
            <p className="text-2xl font-bold">${data.costs.daily.totalCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monthly Cost</p>
            <p className="text-2xl font-bold">${data.costs.monthly.totalCost.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      {/* Budget Status */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Budget Status</h2>
        {data.costs.budgets.map((budget) => (
          <div key={budget.period} className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="capitalize">{budget.period}</span>
              <span>{budget.percentUsed.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  budget.exceeded ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 mt-1">
              ${budget.used.toFixed(2)} / ${budget.limit.toFixed(2)}
            </div>
          </div>
        ))}
      </Card>

      {/* Alerts */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Recent Alerts</h2>
        <div className="space-y-2">
          {data.alerts.recent.map((alert) => (
            <div key={alert.id} className="border-l-4 border-red-500 pl-3 py-2">
              <p className="font-semibold">{alert.title}</p>
              <p className="text-sm text-gray-600">{alert.message}</p>
              <p className="text-xs text-gray-400">
                {new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

## Testing the Setup

### 1. Test Analytics

```typescript
import { AnalyticsTracker } from '@aah/ai-evals/monitoring';

const analytics = new AnalyticsTracker({
  enabled: true,
  verbose: true,
});

await analytics.trackEvalRunStarted('test-job', ['test-dataset'], ['gpt-4']);
console.log('Analytics test completed - check Vercel dashboard');
```

### 2. Test Slack Alerts

```typescript
import { AlertManager } from '@aah/ai-evals/monitoring';

const alertManager = new AlertManager({
  enabled: true,
  verbose: true,
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL!,
  },
});

await alertManager.sendSystemErrorAlert({
  type: 'system',
  severity: 'error',
  message: 'Test alert from monitoring setup',
  retryable: false,
});

console.log('Slack test completed - check your channel');
```

### 3. Test Email Alerts

```typescript
const alertManager = new AlertManager({
  enabled: true,
  verbose: true,
  email: {
    provider: 'resend',
    apiKey: process.env.RESEND_API_KEY!,
    from: process.env.ALERT_EMAIL_FROM!,
    to: [process.env.ALERT_EMAIL_TO!],
  },
});

await alertManager.sendSystemErrorAlert({
  type: 'system',
  severity: 'error',
  message: 'Test email alert from monitoring setup',
  retryable: false,
});

console.log('Email test completed - check your inbox');
```

### 4. Test Cost Tracking

```typescript
import { CostTracker } from '@aah/ai-evals/monitoring';

const costTracker = new CostTracker({
  enabled: true,
  verbose: true,
  budget: {
    dailyLimit: 50,
  },
});

// Simulate tracking
await costTracker.trackRun(mockReport);

const stats = costTracker.getCostStats('daily');
console.log('Cost Stats:', stats);

const budget = costTracker.getBudgetStatus('daily');
console.log('Budget Status:', budget);
```

## Troubleshooting

### Vercel Analytics Not Working

- Ensure project is deployed to Vercel
- Check analytics is enabled in Vercel dashboard
- Verify `VERCEL_ANALYTICS_ENABLED=true` is set
- Wait up to 5 minutes for events to appear

### Slack Alerts Not Sending

- Verify webhook URL is correct
- Test webhook with curl:
  ```bash
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Test message"}' \
    YOUR_WEBHOOK_URL
  ```
- Check network connectivity
- Enable verbose mode to see errors

### Email Alerts Not Sending

- Verify API key is correct and active
- Check sender email is verified (Resend/SendGrid)
- Verify recipient email addresses are valid
- Check spam folder
- Enable verbose mode to see errors

### Budget Alerts Not Triggering

- Verify budget limits are set correctly
- Check alert threshold is appropriate
- Ensure cost tracking is enabled
- Verify runs are being tracked

## Next Steps

1. Review monitoring data in Vercel Analytics
2. Set up dashboard for team visibility
3. Configure alert escalation policies
4. Review and adjust budget limits
5. Export cost data for analysis
6. Integrate with existing observability tools

## Support

For issues or questions:
- Check [README.md](./src/monitoring/README.md)
- Review [examples.ts](./src/monitoring/examples.ts)
- Check GitHub issues
