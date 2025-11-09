# Monitoring System - Quick Reference

## Quick Setup (5 minutes)

```bash
# 1. Install dependencies
pnpm install

# 2. Set environment variables
cat > .env << EOF
VERCEL_ANALYTICS_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
ALERT_EMAIL_FROM=alerts@your-app.com
ALERT_EMAIL_TO=team@your-app.com
DAILY_COST_LIMIT=50
MONTHLY_COST_LIMIT=1000
DASHBOARD_URL=https://your-app.vercel.app/evals
EOF

# 3. Run with monitoring
tsx src/cli.ts eval --dataset compliance-tests --model gpt-4 --monitor
```

## Basic Usage

```typescript
import { MonitoringSystem } from '@aah/ai-evals/monitoring';

// Initialize
const monitoring = new MonitoringSystem({
  analytics: { enabled: true },
  alerts: {
    enabled: true,
    slack: { webhookUrl: process.env.SLACK_WEBHOOK_URL },
  },
  costTracking: {
    enabled: true,
    budget: { dailyLimit: 50, monthlyLimit: 1000 },
  },
});

// Process eval report
await monitoring.processReport(report);

// Get summary
const summary = monitoring.getSummary();
console.log('Costs:', summary.costs);
console.log('Alerts:', summary.alerts);
```

## Common Tasks

### Track Analytics
```typescript
import { trackEvalRun, trackRegression } from '@aah/ai-evals/monitoring';

await trackEvalRun(report);
await trackRegression(jobId, regression);
```

### Send Alerts
```typescript
import { getAlertManager } from '@aah/ai-evals/monitoring';

const alertManager = getAlertManager();
await alertManager.checkAndAlert(report);
```

### Track Costs
```typescript
import { getCostTracker, CostDimension } from '@aah/ai-evals/monitoring';

const costTracker = getCostTracker();
await costTracker.trackRun(report);

const dailyStats = costTracker.getCostStats('daily');
const byModel = costTracker.getCostBreakdown(CostDimension.MODEL);
const budget = costTracker.getBudgetStatus('daily');
```

## Configuration Patterns

### Minimal Setup
```typescript
const monitoring = new MonitoringSystem({
  analytics: { enabled: true },
  alerts: { enabled: true },
  costTracking: { enabled: true },
});
```

### Production Setup
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

## Key Metrics

### Analytics Events
- `eval_run_started` - Eval starts
- `eval_run_completed` - Eval completes
- `eval_run_failed` - Eval fails
- `regression_detected` - Regression found
- `cost_threshold_exceeded` - Cost limit hit

### Alert Types
- Regression (critical/major/minor)
- Eval failure
- System error
- Cost exceeded
- Performance degradation

### Cost Metrics
- Total cost and tokens
- Cost per run/test
- Budget status (hourly/daily/weekly/monthly)
- Cost breakdown (model/dataset/time)
- Top cost drivers

## API Quick Reference

### MonitoringSystem
```typescript
new MonitoringSystem(config)
.processReport(report)        // Process through all systems
.getAnalytics()                // Get analytics tracker
.getAlerts()                   // Get alert manager
.getCostTracker()              // Get cost tracker
.getSummary()                  // Get monitoring summary
.destroy()                     // Clean up resources
```

### AnalyticsTracker
```typescript
new AnalyticsTracker(config)
.trackEvalRun(report)          // Track eval run
.trackRegression(id, reg)      // Track regression
.trackBaselineUpdate(...)      // Track baseline
.trackCostThresholdExceeded()  // Track cost alert
.destroy()                     // Clean up
```

### AlertManager
```typescript
new AlertManager(config)
.checkAndAlert(report)         // Auto-check and alert
.sendRegressionAlert(reg, rpt) // Send regression alert
.sendEvalFailureAlert(report)  // Send failure alert
.sendCostExceededAlert(...)    // Send cost alert
.getAlertHistory(limit)        // Get recent alerts
.clearHistory()                // Clear history
```

### CostTracker
```typescript
new CostTracker(config)
.trackRun(report)              // Track eval run
.getCostStats(period)          // Get stats for period
.getCostBreakdown(dimension)   // Get breakdown
.getBudgetStatus(period)       // Get budget status
.getCostTrends(period, gran)   // Get trends
.getTopCostDrivers(limit)      // Get top drivers
.exportData(format)            // Export as CSV/JSON
.getTotalCost()                // Get total cost
.clear()                       // Clear all data
```

## Environment Variables

```bash
# Required
VERCEL_ANALYTICS_ENABLED=true

# Slack (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Email (optional)
RESEND_API_KEY=re_...
ALERT_EMAIL_FROM=alerts@your-app.com
ALERT_EMAIL_TO=team@your-app.com

# Budget (optional)
DAILY_COST_LIMIT=50
MONTHLY_COST_LIMIT=1000
COST_ALERT_THRESHOLD=80

# Dashboard (optional)
DASHBOARD_URL=https://your-app.com/evals
```

## CLI Commands

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

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Analytics not tracking | Set `VERCEL_ANALYTICS_ENABLED=true` |
| Slack alerts not sending | Verify webhook URL is correct |
| Email alerts not sending | Check API key and sender verification |
| Budget not tracking | Ensure `trackRun()` is called |
| Costs inaccurate | Update model pricing in base-runner.ts |

## Testing

```bash
# Test analytics
tsx src/monitoring/__tests__/test-analytics.ts

# Test alerts
tsx src/monitoring/__tests__/test-alerts.ts

# Test cost tracking
tsx src/monitoring/__tests__/test-cost-tracker.ts
```

## Dashboard Integration

```typescript
// API Route: app/api/evals/monitoring/route.ts
import { getMonitoringSystem } from '@aah/ai-evals/monitoring';
import { prepareDashboardData } from '@aah/ai-evals/monitoring/examples';

export async function GET() {
  const monitoring = getMonitoringSystem();
  const data = prepareDashboardData(monitoring);
  return Response.json(data);
}
```

## Resources

- [Full Documentation](./src/monitoring/README.md)
- [Setup Guide](./MONITORING_SETUP.md)
- [Examples](./src/monitoring/examples.ts)
- [Completion Summary](./TASKS_11.1-11.3_COMPLETION.md)
