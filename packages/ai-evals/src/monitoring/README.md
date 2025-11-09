# AI Evals Monitoring System

Comprehensive monitoring, alerting, and cost tracking for the AI evaluation framework.

## Overview

The monitoring system provides three integrated components:

1. **Analytics Tracking** - Send eval metrics to Vercel Analytics
2. **Alerting System** - Multi-channel notifications for regressions and failures
3. **Cost Tracking** - Budget management and cost analysis

## Installation

The monitoring system is included in the `@aah/ai-evals` package. Install dependencies:

```bash
pnpm install
```

Required dependencies:
- `@vercel/analytics` - For analytics tracking
- Email providers (optional): Resend or SendGrid API keys
- Slack (optional): Webhook URL

## Quick Start

### Basic Setup

```typescript
import { MonitoringSystem } from '@aah/ai-evals/monitoring';

const monitoring = new MonitoringSystem({
  analytics: {
    enabled: true,
    verbose: true,
  },
  alerts: {
    enabled: true,
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    },
  },
  costTracking: {
    enabled: true,
    budget: {
      dailyLimit: 50,
      monthlyLimit: 1000,
    },
  },
});

// Process an eval report
await monitoring.processReport(report);

// Get summary
const summary = monitoring.getSummary();
console.log(summary);
```

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Analytics
VERCEL_ANALYTICS_ENABLED=true

# Slack Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email Alerting (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
ALERT_EMAIL_FROM=alerts@your-app.com
ALERT_EMAIL_TO=team@your-app.com

# Budget Configuration
DAILY_COST_LIMIT=50
MONTHLY_COST_LIMIT=1000

# Dashboard URL (for alert links)
DASHBOARD_URL=https://your-app.vercel.app/evals
```

## Features

### 1. Analytics Tracking

Track eval metrics in Vercel Analytics for real-time monitoring and historical analysis.

```typescript
import { AnalyticsTracker } from '@aah/ai-evals/monitoring';

const analytics = new AnalyticsTracker({
  enabled: true,
  verbose: true,
  sampleRate: 1.0, // Track all events
});

// Track eval run
await analytics.trackEvalRun(report);

// Track specific events
await analytics.trackRegression(jobId, regression);
await analytics.trackBaselineUpdate(baselineId, name, metrics);
await analytics.trackCostThresholdExceeded(jobId, actualCost, threshold);
```

**Tracked Events:**
- `eval_run_started` - When eval starts
- `eval_run_completed` - When eval completes successfully
- `eval_run_failed` - When eval fails
- `regression_detected` - When regression is detected
- `baseline_updated` - When baseline is updated
- `cost_threshold_exceeded` - When cost exceeds threshold
- `performance_degradation` - When performance degrades

**Metrics Tracked:**
- Run duration
- Pass rate
- Accuracy
- Average latency
- Total cost
- Regression count
- Token usage

### 2. Alerting System

Multi-channel alerting with configurable thresholds and escalation policies.

```typescript
import { AlertManager, AlertSeverity } from '@aah/ai-evals/monitoring';

const alertManager = new AlertManager({
  enabled: true,
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    channel: '#ai-evals-alerts',
    username: 'AI Evals Monitor',
    iconEmoji: ':robot_face:',
  },
  email: {
    provider: 'resend',
    apiKey: process.env.RESEND_API_KEY,
    from: 'alerts@your-app.com',
    to: ['team@your-app.com'],
  },
  thresholds: {
    criticalRegressionCount: 1,
    majorRegressionCount: 3,
    minorRegressionCount: 10,
    maxLatencyMs: 5000,
    minAccuracy: 80,
    minPassRate: 90,
    maxCostPerRun: 10,
    dailyCostLimit: 100,
    monthlyLimit: 1000,
    maxFailureRate: 10,
  },
  dashboardUrl: 'https://your-app.vercel.app/evals',
});

// Check report and send alerts automatically
await alertManager.checkAndAlert(report);

// Send specific alerts manually
await alertManager.sendRegressionAlert(regression, report);
await alertManager.sendEvalFailureAlert(report);
await alertManager.sendCostExceededAlert(jobId, actualCost, threshold, 'daily');
```

**Alert Types:**
- Regression detection (critical, major, minor)
- Eval failures
- System errors
- Cost exceeded
- Performance degradation
- Baseline drift

**Notification Channels:**
- Slack webhooks
- Email (Resend or SendGrid)
- Custom webhooks
- Console output

**Escalation Policies:**

Configure different channels for different severity levels:

```typescript
const alertManager = new AlertManager({
  escalation: {
    enabled: true,
    levels: [
      {
        severity: AlertSeverity.INFO,
        channels: [NotificationChannel.CONSOLE],
      },
      {
        severity: AlertSeverity.CRITICAL,
        channels: [
          NotificationChannel.SLACK,
          NotificationChannel.EMAIL,
          NotificationChannel.WEBHOOK,
        ],
      },
    ],
  },
});
```

### 3. Cost Tracking

Budget management with detailed cost breakdowns and trend analysis.

```typescript
import { CostTracker, CostDimension } from '@aah/ai-evals/monitoring';

const costTracker = new CostTracker({
  enabled: true,
  budget: {
    hourlyLimit: 5,
    dailyLimit: 50,
    weeklyLimit: 300,
    monthlyLimit: 1000,
    perRunLimit: 10,
    alertThreshold: 75, // Alert at 75% of limit
  },
});

// Track eval run
await costTracker.trackRun(report);

// Get statistics
const dailyStats = costTracker.getCostStats('daily');
const monthlyStats = costTracker.getCostStats('monthly');

// Get breakdowns
const byModel = costTracker.getCostBreakdown(CostDimension.MODEL);
const byDataset = costTracker.getCostBreakdown(CostDimension.DATASET);
const byTime = costTracker.getCostBreakdown(CostDimension.TIME);

// Get budget status
const dailyBudget = costTracker.getBudgetStatus('daily');
console.log(`Used: $${dailyBudget.used} / $${dailyBudget.limit}`);
console.log(`Remaining: $${dailyBudget.remaining}`);

// Get trends
const trends = costTracker.getCostTrends('weekly', 'daily');

// Get top cost drivers
const topDrivers = costTracker.getTopCostDrivers(10);

// Export data
const csvData = costTracker.exportData('csv');
```

**Cost Metrics:**
- Total cost and tokens
- Cost per run/test
- Average cost and tokens
- Cost breakdown by model, dataset, time
- Budget status (hourly, daily, weekly, monthly)
- Cost trends and projections
- Top cost drivers

**Budget Limits:**
- Hourly limit
- Daily limit
- Weekly limit
- Monthly limit
- Per-run limit
- Alert threshold (percentage)

## Integration with Orchestrator

Integrate monitoring into the eval orchestrator:

```typescript
import { EvalOrchestrator } from '@aah/ai-evals/orchestrator';
import { MonitoringSystem } from '@aah/ai-evals/monitoring';

// Initialize monitoring
const monitoring = new MonitoringSystem({
  analytics: { enabled: true },
  alerts: {
    enabled: true,
    slack: { webhookUrl: process.env.SLACK_WEBHOOK_URL },
  },
  costTracking: {
    enabled: true,
    budget: {
      dailyLimit: 50,
      monthlyLimit: 1000,
    },
  },
});

// Initialize orchestrator
const orchestrator = new EvalOrchestrator();

// Execute eval and monitor
const jobId = orchestrator.createJob({
  datasetIds: ['compliance-tests'],
  runnerConfigs: [{ modelId: 'gpt-4', temperature: 0.7 }],
  scorerConfig: { strategy: 'exact' },
});

const report = await orchestrator.executeJob(jobId, datasets, runExecutor, scorer);

// Process through monitoring
await monitoring.processReport(report);

// Get monitoring summary
const summary = monitoring.getSummary();
console.log('Costs:', summary.costs);
console.log('Alerts:', summary.alerts);
```

## Dashboard Integration

Prepare data for dashboard display:

```typescript
import { prepareDashboardData } from '@aah/ai-evals/monitoring/examples';

const monitoring = new MonitoringSystem({ /* config */ });

// ... run evals and process reports ...

// Prepare dashboard data
const dashboardData = prepareDashboardData(monitoring);

// Use in Next.js API route or dashboard component
export async function GET() {
  return Response.json(dashboardData);
}
```

**Dashboard Data Structure:**

```typescript
{
  costs: {
    total: number,
    daily: CostStats,
    weekly: CostStats,
    monthly: CostStats,
    breakdown: {
      byModel: CostBreakdown,
      byDataset: CostBreakdown,
      byTime: CostBreakdown,
    },
    trends: {
      daily: CostTrendPoint[],
      hourly: CostTrendPoint[],
    },
    budgets: BudgetStatus[],
    topDrivers: Array<{ modelId, datasetId, cost, percentage }>,
  },
  alerts: {
    recent: Alert[],
    total: number,
  },
  summary: {
    costs: { total, daily, monthly, budgetStatuses },
    alerts: { total, recent },
  },
}
```

## CLI Integration

The monitoring system can be used from the CLI:

```bash
# Run eval with monitoring
tsx src/cli.ts eval --dataset compliance-tests --model gpt-4 --monitor

# View cost summary
tsx src/cli.ts costs --period daily

# View budget status
tsx src/cli.ts budget

# Export cost data
tsx src/cli.ts costs --export csv --output costs.csv
```

## Configuration Examples

### Production Configuration

```typescript
const monitoring = new MonitoringSystem({
  analytics: {
    enabled: process.env.NODE_ENV === 'production',
    sampleRate: 1.0,
  },
  alerts: {
    enabled: true,
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: '#ai-evals-prod',
    },
    email: {
      provider: 'resend',
      apiKey: process.env.RESEND_API_KEY,
      from: 'alerts@your-app.com',
      to: ['oncall@your-app.com'],
    },
    thresholds: {
      criticalRegressionCount: 1,
      maxCostPerRun: 20,
      minAccuracy: 90,
      dailyCostLimit: 200,
    },
    escalation: {
      enabled: true,
      levels: [
        {
          severity: AlertSeverity.CRITICAL,
          channels: [NotificationChannel.SLACK, NotificationChannel.EMAIL],
        },
      ],
    },
    dashboardUrl: 'https://your-app.com/evals',
  },
  costTracking: {
    enabled: true,
    budget: {
      dailyLimit: 200,
      monthlyLimit: 5000,
      alertThreshold: 80,
    },
  },
});
```

### Development Configuration

```typescript
const monitoring = new MonitoringSystem({
  analytics: {
    enabled: false, // Disable in development
  },
  alerts: {
    enabled: true,
    verbose: true,
    // Console only for development
  },
  costTracking: {
    enabled: true,
    verbose: true,
    budget: {
      dailyLimit: 10,
      monthlyLimit: 100,
    },
  },
});
```

## API Reference

### MonitoringSystem

```typescript
class MonitoringSystem {
  constructor(config: MonitoringConfig);

  processReport(report: EvalReport): Promise<void>;
  getAnalytics(): AnalyticsTracker;
  getAlerts(): AlertManager;
  getCostTracker(): CostTracker;
  getSummary(): MonitoringSummary;
  destroy(): void;
}
```

### AnalyticsTracker

```typescript
class AnalyticsTracker {
  constructor(config: AnalyticsConfig);

  trackEvalRunStarted(jobId, datasetIds, modelIds): Promise<void>;
  trackEvalRun(report: EvalReport): Promise<void>;
  trackRegression(jobId, regression): Promise<void>;
  trackBaselineUpdate(baselineId, name, metrics): Promise<void>;
  trackCostThresholdExceeded(jobId, actualCost, threshold): Promise<void>;
  sendEvent(eventType, metadata): Promise<void>;
  destroy(): void;
}
```

### AlertManager

```typescript
class AlertManager {
  constructor(config: AlertConfig);

  sendRegressionAlert(regression, report): Promise<void>;
  sendEvalFailureAlert(report): Promise<void>;
  sendSystemErrorAlert(error, jobId?): Promise<void>;
  sendCostExceededAlert(jobId, actualCost, threshold, period): Promise<void>;
  checkAndAlert(report): Promise<void>;
  getAlertHistory(limit?): Alert[];
  clearHistory(): void;
}
```

### CostTracker

```typescript
class CostTracker {
  constructor(config: CostTrackerConfig);

  trackRun(report: EvalReport): Promise<void>;
  trackRunResult(jobId, result, config): void;
  getCostStats(period: TimePeriod): CostStats;
  getCostBreakdown(dimension: CostDimension, period?): CostBreakdown;
  getBudgetStatus(period: TimePeriod): BudgetStatus | null;
  getAllBudgetStatuses(): BudgetStatus[];
  getCostTrends(period, granularity): CostTrendPoint[];
  getTopCostDrivers(limit): Array<CostDriver>;
  exportData(format: 'json' | 'csv'): string;
  getTotalCost(): number;
  getTotalTokens(): number;
  clear(): void;
}
```

## Best Practices

1. **Enable monitoring in production** - Always enable analytics and alerting in production
2. **Set appropriate thresholds** - Configure thresholds based on your requirements
3. **Use escalation policies** - Route critical alerts to multiple channels
4. **Monitor costs proactively** - Set budget limits and track trends
5. **Review alerts regularly** - Check alert history to identify patterns
6. **Export cost data** - Periodically export cost data for analysis
7. **Test alerting** - Verify alert channels work before going to production
8. **Use dashboard links** - Configure dashboard URL for easy access from alerts

## Troubleshooting

### Analytics not tracking

- Verify `VERCEL_ANALYTICS_ENABLED=true` is set
- Check that `@vercel/analytics` is installed
- Ensure `sampleRate` is not 0
- Check console for errors with `verbose: true`

### Alerts not sending

- Verify webhook URLs and API keys are correct
- Check network connectivity
- Test webhook URLs with curl
- Enable `verbose: true` to see detailed logs
- Check alert history: `alertManager.getAlertHistory()`

### Cost tracking inaccurate

- Ensure all runs are tracked: `await costTracker.trackRun(report)`
- Check model pricing in `base-runner.ts` is up-to-date
- Verify budget reset logic is working correctly
- Use `verbose: true` to see tracking details

## Examples

See [examples.ts](./examples.ts) for complete working examples of all features.

## License

MIT
