/**
 * Example configurations and usage patterns for the monitoring system
 *
 * This file demonstrates how to configure and use the analytics,
 * alerting, and cost tracking features.
 */

import {
  MonitoringSystem,
  AnalyticsTracker,
  AlertManager,
  CostTracker,
  AlertSeverity,
  NotificationChannel,
  CostDimension,
} from './index';
import type { EvalReport } from '../types';

/**
 * Example 1: Basic monitoring setup
 */
export function basicMonitoringSetup() {
  const monitoring = new MonitoringSystem({
    analytics: {
      enabled: true,
      verbose: true,
      sampleRate: 1.0, // Track all events
    },
    alerts: {
      enabled: true,
      verbose: true,
      dashboardUrl: 'https://your-app.vercel.app',
      thresholds: {
        criticalRegressionCount: 1,
        maxCostPerRun: 5.0,
        minAccuracy: 85,
      },
    },
    costTracking: {
      enabled: true,
      verbose: true,
      budget: {
        dailyLimit: 50,
        monthlyLimit: 1000,
        alertThreshold: 80, // Alert at 80% of limit
      },
    },
  });

  return monitoring;
}

/**
 * Example 2: Slack integration
 */
export function slackMonitoringSetup() {
  const monitoring = new MonitoringSystem({
    alerts: {
      enabled: true,
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL!,
        channel: '#ai-evals-alerts',
        username: 'AI Evals Monitor',
        iconEmoji: ':robot_face:',
      },
      thresholds: {
        criticalRegressionCount: 1,
        majorRegressionCount: 3,
        minorRegressionCount: 10,
      },
    },
  });

  return monitoring;
}

/**
 * Example 3: Email alerting with Resend
 */
export function emailMonitoringSetup() {
  const monitoring = new MonitoringSystem({
    alerts: {
      enabled: true,
      email: {
        provider: 'resend',
        apiKey: process.env.RESEND_API_KEY!,
        from: 'alerts@your-app.com',
        to: ['team@your-app.com', 'devops@your-app.com'],
        cc: ['manager@your-app.com'],
      },
      dashboardUrl: 'https://your-app.vercel.app/evals',
    },
  });

  return monitoring;
}

/**
 * Example 4: Multi-channel alerting with escalation
 */
export function escalationMonitoringSetup() {
  const monitoring = new MonitoringSystem({
    alerts: {
      enabled: true,
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL!,
        channel: '#ai-evals-alerts',
      },
      email: {
        provider: 'resend',
        apiKey: process.env.RESEND_API_KEY!,
        from: 'alerts@your-app.com',
        to: ['team@your-app.com'],
      },
      escalation: {
        enabled: true,
        levels: [
          {
            severity: AlertSeverity.INFO,
            channels: [NotificationChannel.CONSOLE],
          },
          {
            severity: AlertSeverity.LOW,
            channels: [NotificationChannel.CONSOLE],
          },
          {
            severity: AlertSeverity.MEDIUM,
            channels: [NotificationChannel.SLACK],
          },
          {
            severity: AlertSeverity.HIGH,
            channels: [NotificationChannel.SLACK, NotificationChannel.EMAIL],
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
      webhook: {
        url: 'https://your-app.com/api/alerts',
        headers: {
          'X-API-Key': process.env.ALERTS_API_KEY!,
        },
      },
    },
  });

  return monitoring;
}

/**
 * Example 5: Processing an eval report
 */
export async function processEvalReport(report: EvalReport) {
  const monitoring = basicMonitoringSetup();

  // Process through all monitoring systems
  await monitoring.processReport(report);

  // Get summary
  const summary = monitoring.getSummary();
  console.log('Monitoring Summary:', summary);

  // Clean up
  monitoring.destroy();
}

/**
 * Example 6: Manual analytics tracking
 */
export async function manualAnalyticsTracking(report: EvalReport) {
  const analytics = new AnalyticsTracker({
    enabled: true,
    verbose: true,
  });

  // Track eval run
  await analytics.trackEvalRun(report);

  // Track baseline update
  await analytics.trackBaselineUpdate('baseline-1', 'Production Baseline', {
    totalTests: 100,
    passed: 95,
    failed: 5,
    accuracy: 95,
    passRate: 95,
    avgScore: 0.95,
    avgLatency: 250,
    totalCost: 2.5,
    breakdown: {},
  });

  // Track cost threshold exceeded
  await analytics.trackCostThresholdExceeded('job-123', 15.5, 10.0);

  analytics.destroy();
}

/**
 * Example 7: Custom alert configuration
 */
export async function customAlertConfiguration() {
  const alertManager = new AlertManager({
    enabled: true,
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL!,
    },
    thresholds: {
      // Regression thresholds
      criticalRegressionCount: 1,
      majorRegressionCount: 5,
      minorRegressionCount: 15,

      // Performance thresholds
      maxLatencyMs: 3000,
      minAccuracy: 90,
      minPassRate: 95,

      // Cost thresholds
      maxCostPerRun: 20,
      dailyCostLimit: 200,
      monthlyCostLimit: 5000,

      // Failure threshold
      maxFailureRate: 5,
    },
    dashboardUrl: 'https://your-app.vercel.app/evals',
  });

  return alertManager;
}

/**
 * Example 8: Cost tracking and analysis
 */
export async function costTrackingExample(report: EvalReport) {
  const costTracker = new CostTracker({
    enabled: true,
    verbose: true,
    budget: {
      hourlyLimit: 5,
      dailyLimit: 50,
      weeklyLimit: 300,
      monthlyLimit: 1000,
      perRunLimit: 10,
      alertThreshold: 75,
    },
  });

  // Track the run
  await costTracker.trackRun(report);

  // Get cost statistics
  const dailyStats = costTracker.getCostStats('daily');
  console.log('Daily Cost Stats:', dailyStats);

  const weeklyStats = costTracker.getCostStats('weekly');
  console.log('Weekly Cost Stats:', weeklyStats);

  // Get cost breakdown by model
  const modelBreakdown = costTracker.getCostBreakdown(CostDimension.MODEL);
  console.log('Cost by Model:', modelBreakdown);

  // Get cost breakdown by dataset
  const datasetBreakdown = costTracker.getCostBreakdown(CostDimension.DATASET);
  console.log('Cost by Dataset:', datasetBreakdown);

  // Get budget status
  const dailyBudget = costTracker.getBudgetStatus('daily');
  console.log('Daily Budget:', dailyBudget);

  const monthlyBudget = costTracker.getBudgetStatus('monthly');
  console.log('Monthly Budget:', monthlyBudget);

  // Get cost trends
  const trends = costTracker.getCostTrends('weekly', 'daily');
  console.log('Weekly Trends:', trends);

  // Get top cost drivers
  const topDrivers = costTracker.getTopCostDrivers(5);
  console.log('Top 5 Cost Drivers:', topDrivers);

  // Export data
  const csvData = costTracker.exportData('csv');
  console.log('CSV Export:', csvData);
}

/**
 * Example 9: Integration with orchestrator
 */
export async function orchestratorIntegration() {
  // Initialize monitoring
  const monitoring = new MonitoringSystem({
    analytics: {
      enabled: process.env.VERCEL_ANALYTICS_ENABLED === 'true',
    },
    alerts: {
      enabled: true,
      slack: process.env.SLACK_WEBHOOK_URL
        ? {
            webhookUrl: process.env.SLACK_WEBHOOK_URL,
            channel: '#ai-evals',
          }
        : undefined,
      email: process.env.RESEND_API_KEY
        ? {
            provider: 'resend',
            apiKey: process.env.RESEND_API_KEY,
            from: process.env.ALERT_EMAIL_FROM || 'alerts@app.com',
            to: (process.env.ALERT_EMAIL_TO || '').split(','),
          }
        : undefined,
    },
    costTracking: {
      enabled: true,
      budget: {
        dailyLimit: parseFloat(process.env.DAILY_COST_LIMIT || '50'),
        monthlyLimit: parseFloat(process.env.MONTHLY_COST_LIMIT || '1000'),
      },
    },
  });

  return monitoring;
}

/**
 * Example 10: Dashboard data preparation
 */
export function prepareDashboardData(monitoring: MonitoringSystem) {
  const costTracker = monitoring.getCostTracker();
  const alertManager = monitoring.getAlerts();

  return {
    // Cost metrics
    costs: {
      total: costTracker.getTotalCost(),
      daily: costTracker.getCostStats('daily'),
      weekly: costTracker.getCostStats('weekly'),
      monthly: costTracker.getCostStats('monthly'),
      breakdown: {
        byModel: costTracker.getCostBreakdown(CostDimension.MODEL),
        byDataset: costTracker.getCostBreakdown(CostDimension.DATASET),
        byTime: costTracker.getCostBreakdown(CostDimension.TIME),
      },
      trends: {
        daily: costTracker.getCostTrends('weekly', 'daily'),
        hourly: costTracker.getCostTrends('daily', 'hourly'),
      },
      budgets: costTracker.getAllBudgetStatuses(),
      topDrivers: costTracker.getTopCostDrivers(10),
    },

    // Alert metrics
    alerts: {
      recent: alertManager.getAlertHistory(20),
      total: alertManager.getAlertHistory().length,
    },

    // Summary
    summary: monitoring.getSummary(),
  };
}

/**
 * Environment variable configuration template
 */
export const ENV_TEMPLATE = `
# Analytics Configuration
VERCEL_ANALYTICS_ENABLED=true

# Slack Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email Alerting (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
ALERT_EMAIL_FROM=alerts@your-app.com
ALERT_EMAIL_TO=team@your-app.com,ops@your-app.com

# Email Alerting (SendGrid - alternative)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx

# Budget Configuration
DAILY_COST_LIMIT=50
MONTHLY_COST_LIMIT=1000
COST_ALERT_THRESHOLD=80

# Dashboard Configuration
DASHBOARD_URL=https://your-app.vercel.app/evals

# Webhook Configuration
ALERTS_WEBHOOK_URL=https://your-app.com/api/alerts
ALERTS_API_KEY=your-api-key
`;
