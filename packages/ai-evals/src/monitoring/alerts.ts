/**
 * Alerting System for AI Evals
 *
 * Task 11.2: Set up alerting
 * - Implement Slack/email notifications for regression detection
 * - Add alerts for eval failures and system errors
 * - Configure alert thresholds and escalation policies
 * - Support multiple notification channels (Slack webhooks, email via Resend/SendGrid)
 * - Include actionable context in alerts (run ID, regression details, links to dashboard)
 *
 * Usage:
 * ```typescript
 * const alertManager = new AlertManager({
 *   slack: { webhookUrl: process.env.SLACK_WEBHOOK_URL },
 *   email: { apiKey: process.env.RESEND_API_KEY }
 * });
 *
 * await alertManager.sendRegressionAlert(regression, report);
 * ```
 */

import type {
  RegressionResult,
  EvalReport,
  EvalJob,
} from '../types';

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

/**
 * Alert types
 */
export enum AlertType {
  REGRESSION = 'regression',
  EVAL_FAILURE = 'eval_failure',
  SYSTEM_ERROR = 'system_error',
  COST_EXCEEDED = 'cost_exceeded',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  BASELINE_DRIFT = 'baseline_drift',
}

/**
 * Notification channel types
 */
export enum NotificationChannel {
  SLACK = 'slack',
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  CONSOLE = 'console',
}

/**
 * Slack configuration
 */
export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

/**
 * Email configuration (supports Resend or SendGrid)
 */
export interface EmailConfig {
  provider: 'resend' | 'sendgrid';
  apiKey: string;
  from: string;
  to: string[];
  cc?: string[];
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  url: string;
  headers?: Record<string, string>;
  method?: 'POST' | 'PUT';
}

/**
 * Threshold configuration for alerts
 */
export interface AlertThresholds {
  // Regression thresholds
  criticalRegressionCount?: number; // Number of critical regressions to trigger alert
  majorRegressionCount?: number; // Number of major regressions to trigger alert
  minorRegressionCount?: number; // Number of minor regressions to trigger alert

  // Performance thresholds
  maxLatencyMs?: number; // Maximum acceptable latency
  minAccuracy?: number; // Minimum acceptable accuracy (0-100)
  minPassRate?: number; // Minimum acceptable pass rate (0-100)

  // Cost thresholds
  maxCostPerRun?: number; // Maximum cost per eval run (USD)
  dailyCostLimit?: number; // Daily cost limit (USD)
  monthlyCostLimit?: number; // Monthly cost limit (USD)

  // Failure thresholds
  maxFailureRate?: number; // Maximum failure rate (0-100)
}

/**
 * Escalation policy
 */
export interface EscalationPolicy {
  enabled: boolean;
  levels: Array<{
    severity: AlertSeverity;
    channels: NotificationChannel[];
    delay?: number; // Delay in milliseconds before escalating
  }>;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  slack?: SlackConfig;
  email?: EmailConfig;
  webhook?: WebhookConfig;
  thresholds?: AlertThresholds;
  escalation?: EscalationPolicy;
  dashboardUrl?: string; // Base URL for dashboard links
  enabled?: boolean;
  verbose?: boolean;
}

/**
 * Alert payload
 */
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  context: Record<string, any>;
  timestamp: Date;
  links?: Array<{ label: string; url: string }>;
}

/**
 * Alert Manager
 */
export class AlertManager {
  private config: AlertConfig;
  private alertHistory: Alert[] = [];
  private costTracking = {
    daily: 0,
    monthly: 0,
    lastReset: new Date(),
  };

  constructor(config: AlertConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      verbose: config.verbose ?? false,
      thresholds: {
        criticalRegressionCount: 1,
        majorRegressionCount: 3,
        minorRegressionCount: 10,
        maxLatencyMs: 5000,
        minAccuracy: 80,
        minPassRate: 90,
        maxCostPerRun: 10,
        dailyCostLimit: 100,
        monthlyCostLimit: 1000,
        maxFailureRate: 10,
        ...config.thresholds,
      },
      escalation: {
        enabled: false,
        levels: [],
        ...config.escalation,
      },
      ...config,
    };
  }

  /**
   * Send regression alert
   */
  async sendRegressionAlert(regression: RegressionResult, report: EvalReport): Promise<void> {
    if (!this.config.enabled) return;

    const severity = this.mapRegressionSeverity(regression.severity);
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: AlertType.REGRESSION,
      severity,
      title: `${regression.severity.toUpperCase()} Regression Detected`,
      message: this.formatRegressionMessage(regression, report),
      context: {
        jobId: report.id,
        testCaseId: regression.testCaseId,
        testCaseName: regression.testCaseName,
        baselineScore: regression.baselineScore,
        currentScore: regression.currentScore,
        scoreDelta: regression.scoreDelta,
        severity: regression.severity,
      },
      timestamp: new Date(),
      links: this.generateLinks(report.id, regression.testCaseId),
    };

    await this.sendAlert(alert);
  }

  /**
   * Send eval failure alert
   */
  async sendEvalFailureAlert(report: EvalReport): Promise<void> {
    if (!this.config.enabled) return;

    const failureRate = (report.metrics.failedTests / report.metrics.totalTests) * 100;
    const severity =
      failureRate > 50 ? AlertSeverity.CRITICAL : failureRate > 20 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM;

    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: AlertType.EVAL_FAILURE,
      severity,
      title: `Eval Run Failed: ${report.id}`,
      message: this.formatEvalFailureMessage(report),
      context: {
        jobId: report.id,
        totalTests: report.metrics.totalTests,
        failed: report.metrics.failedTests,
        failureRate,
      },
      timestamp: new Date(),
      links: this.generateLinks(report.id),
    };

    await this.sendAlert(alert);
  }

  /**
   * Send system error alert
   */
  async sendSystemErrorAlert(error: Error & { code?: string }, jobId?: string): Promise<void> {
    if (!this.config.enabled) return;

    const severity = AlertSeverity.HIGH;

    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: AlertType.SYSTEM_ERROR,
      severity,
      title: `System Error: ${error.name}`,
      message: this.formatSystemErrorMessage(error),
      context: {
        errorName: error.name,
        errorCode: error.code,
        message: error.message,
        jobId,
      },
      timestamp: new Date(),
      links: jobId ? this.generateLinks(jobId) : undefined,
    };

    await this.sendAlert(alert);
  }

  /**
   * Send cost exceeded alert
   */
  async sendCostExceededAlert(
    jobId: string,
    actualCost: number,
    threshold: number,
    period: 'run' | 'daily' | 'monthly'
  ): Promise<void> {
    if (!this.config.enabled) return;

    const percentOver = ((actualCost - threshold) / threshold) * 100;
    const severity = percentOver > 50 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH;

    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: AlertType.COST_EXCEEDED,
      severity,
      title: `Cost Threshold Exceeded (${period})`,
      message: `Cost of $${actualCost.toFixed(2)} exceeded ${period} threshold of $${threshold.toFixed(2)} (${percentOver.toFixed(1)}% over)`,
      context: {
        jobId,
        actualCost,
        threshold,
        percentOver,
        period,
      },
      timestamp: new Date(),
      links: this.generateLinks(jobId),
    };

    await this.sendAlert(alert);
  }

  /**
   * Send performance degradation alert
   */
  async sendPerformanceDegradationAlert(
    report: EvalReport,
    metric: string,
    threshold: number
  ): Promise<void> {
    if (!this.config.enabled) return;

    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: AlertType.PERFORMANCE_DEGRADATION,
      severity: AlertSeverity.HIGH,
      title: `Performance Degradation: ${metric}`,
      message: `Metric ${metric} is below threshold (${threshold})`,
      context: {
        jobId: report.id,
        metric,
        threshold,
        accuracy: (report.metrics.passRate * 100),
        passRate: (report.metrics.passedTests / report.metrics.totalTests) * 100,
        avgLatency: report.metrics.averageLatencyMs,
      },
      timestamp: new Date(),
      links: this.generateLinks(report.id),
    };

    await this.sendAlert(alert);
  }

  /**
   * Check and send alerts based on eval report
   */
  async checkAndAlert(report: EvalReport): Promise<void> {
    if (!this.config.enabled) return;

    const thresholds = this.config.thresholds!;

    // Check for regressions (baseline regressions don't have severity, so we treat all as major)
    const regressions = report.baseline?.regressions || [];

    if (regressions.length >= (thresholds.majorRegressionCount || 3)) {
      for (const regression of regressions) {
        // Convert baseline regression to RegressionResult format
        const regressionResult: RegressionResult = {
          testCaseId: regression.testCaseId,
          testCaseName: regression.testCaseName,
          baselineScore: regression.baselineScore,
          currentScore: regression.currentScore,
          scoreDelta: regression.delta,
          severity: 'major',
        };
        await this.sendRegressionAlert(regressionResult, report);
      }
    }

    // Check failure rate
    const failureRate = (report.metrics.failedTests / report.metrics.totalTests) * 100;
    if (failureRate > (thresholds.maxFailureRate || 10)) {
      await this.sendEvalFailureAlert(report);
    }

    // Check cost thresholds
    if (thresholds.maxCostPerRun && report.metrics.totalCost > thresholds.maxCostPerRun) {
      await this.sendCostExceededAlert(
        report.id,
        report.metrics.totalCost,
        thresholds.maxCostPerRun,
        'run'
      );
    }

    // Track daily/monthly costs
    this.trackCost(report.metrics.totalCost);
    if (thresholds.dailyCostLimit && this.costTracking.daily > thresholds.dailyCostLimit) {
      await this.sendCostExceededAlert(
        report.id,
        this.costTracking.daily,
        thresholds.dailyCostLimit,
        'daily'
      );
    }

    // Check performance thresholds
    if (thresholds.minAccuracy && (report.metrics.passRate * 100) < thresholds.minAccuracy) {
      await this.sendPerformanceDegradationAlert(report, 'accuracy', thresholds.minAccuracy);
    }

    const passRate = (report.metrics.passedTests / report.metrics.totalTests) * 100;
    if (thresholds.minPassRate && passRate < thresholds.minPassRate) {
      await this.sendPerformanceDegradationAlert(report, 'passRate', thresholds.minPassRate);
    }

    if (thresholds.maxLatencyMs && report.metrics.averageLatencyMs > thresholds.maxLatencyMs) {
      await this.sendPerformanceDegradationAlert(report, 'latency', thresholds.maxLatencyMs);
    }
  }

  /**
   * Send alert to all configured channels
   */
  private async sendAlert(alert: Alert): Promise<void> {
    this.alertHistory.push(alert);
    this.log('Sending alert:', alert);

    const channels = this.getChannelsForSeverity(alert.severity);

    const promises: Promise<void>[] = [];

    if (channels.includes(NotificationChannel.SLACK) && this.config.slack) {
      promises.push(this.sendSlackAlert(alert));
    }

    if (channels.includes(NotificationChannel.EMAIL) && this.config.email) {
      promises.push(this.sendEmailAlert(alert));
    }

    if (channels.includes(NotificationChannel.WEBHOOK) && this.config.webhook) {
      promises.push(this.sendWebhookAlert(alert));
    }

    if (channels.includes(NotificationChannel.CONSOLE) || this.config.verbose) {
      this.sendConsoleAlert(alert);
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send alert to Slack
   */
  private async sendSlackAlert(alert: Alert): Promise<void> {
    if (!this.config.slack) return;

    const color = this.getSeverityColor(alert.severity);
    const payload = {
      channel: this.config.slack.channel,
      username: this.config.slack.username || 'AI Evals Alert',
      icon_emoji: this.config.slack.iconEmoji || ':warning:',
      attachments: [
        {
          color,
          title: alert.title,
          text: alert.message,
          fields: Object.entries(alert.context).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true,
          })),
          footer: 'AI Evals Monitoring',
          ts: Math.floor(alert.timestamp.getTime() / 1000),
          actions: alert.links?.map((link) => ({
            type: 'button',
            text: link.label,
            url: link.url,
          })),
        },
      ],
    };

    try {
      const response = await fetch(this.config.slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.statusText}`);
      }

      this.log('Slack alert sent successfully');
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Send alert via email
   */
  private async sendEmailAlert(alert: Alert): Promise<void> {
    if (!this.config.email) return;

    const emailContent = this.formatEmailContent(alert);

    try {
      if (this.config.email.provider === 'resend') {
        await this.sendResendEmail(emailContent);
      } else if (this.config.email.provider === 'sendgrid') {
        await this.sendSendGridEmail(emailContent);
      }

      this.log('Email alert sent successfully');
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Send email via Resend
   */
  private async sendResendEmail(content: {
    subject: string;
    html: string;
  }): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.email!.apiKey}`,
      },
      body: JSON.stringify({
        from: this.config.email!.from,
        to: this.config.email!.to,
        cc: this.config.email!.cc,
        subject: content.subject,
        html: content.html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API failed: ${response.statusText}`);
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendSendGridEmail(content: {
    subject: string;
    html: string;
  }): Promise<void> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.email!.apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: this.config.email!.to.map((email) => ({ email })),
            cc: this.config.email!.cc?.map((email) => ({ email })),
          },
        ],
        from: { email: this.config.email!.from },
        subject: content.subject,
        content: [{ type: 'text/html', value: content.html }],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid API failed: ${response.statusText}`);
    }
  }

  /**
   * Send alert to webhook
   */
  private async sendWebhookAlert(alert: Alert): Promise<void> {
    if (!this.config.webhook) return;

    try {
      const response = await fetch(this.config.webhook.url, {
        method: this.config.webhook.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.webhook.headers,
        },
        body: JSON.stringify(alert),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      this.log('Webhook alert sent successfully');
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  /**
   * Send alert to console
   */
  private sendConsoleAlert(alert: Alert): void {
    const prefix = `[${alert.severity.toUpperCase()}]`;
    console.log(`\n${prefix} ${alert.title}`);
    console.log(alert.message);
    console.log('Context:', alert.context);
    if (alert.links) {
      console.log('Links:', alert.links);
    }
    console.log('');
  }

  /**
   * Get notification channels based on severity and escalation policy
   */
  private getChannelsForSeverity(severity: AlertSeverity): NotificationChannel[] {
    if (!this.config.escalation?.enabled) {
      // Default: all channels for critical/high, console for others
      if (severity === AlertSeverity.CRITICAL || severity === AlertSeverity.HIGH) {
        return [
          NotificationChannel.SLACK,
          NotificationChannel.EMAIL,
          NotificationChannel.WEBHOOK,
        ];
      }
      return [NotificationChannel.CONSOLE];
    }

    // Use escalation policy
    const level = this.config.escalation.levels.find((l) => l.severity === severity);
    return level?.channels || [NotificationChannel.CONSOLE];
  }

  /**
   * Format regression message
   */
  private formatRegressionMessage(regression: RegressionResult, report: EvalReport): string {
    const percentChange = ((regression.scoreDelta / regression.baselineScore) * 100).toFixed(1);
    return `
Regression detected in eval run ${report.id}

Test Case: ${regression.testCaseId} (${regression.testCaseName})
Baseline Score: ${regression.baselineScore.toFixed(2)}
Current Score: ${regression.currentScore.toFixed(2)}
Score Delta: ${regression.scoreDelta.toFixed(2)}
Change: ${percentChange}%

This represents a ${regression.severity} regression that requires attention.
    `.trim();
  }

  /**
   * Format eval failure message
   */
  private formatEvalFailureMessage(report: EvalReport): string {
    const failureRate = ((report.metrics.failedTests / report.metrics.totalTests) * 100).toFixed(1);
    return `
Eval run ${report.id} completed with failures

Total Tests: ${report.metrics.totalTests}
Failed: ${report.metrics.failedTests}
Failure Rate: ${failureRate}%

Review the failed test cases and address the issues.
    `.trim();
  }

  /**
   * Format system error message
   */
  private formatSystemErrorMessage(error: Error & { code?: string }): string {
    return `
System error occurred during eval execution

Name: ${error.name}
Code: ${error.code || 'N/A'}
Message: ${error.message}

${error.stack || ''}
    `.trim();
  }

  /**
   * Format email content
   */
  private formatEmailContent(alert: Alert): { subject: string; html: string } {
    const linksHtml = alert.links
      ? alert.links.map((link) => `<a href="${link.url}">${link.label}</a>`).join(' | ')
      : '';

    const contextHtml = Object.entries(alert.context)
      .map(([key, value]) => `<tr><td><strong>${key}:</strong></td><td>${value}</td></tr>`)
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: ${this.getSeverityColor(alert.severity)}; color: white; padding: 15px; border-radius: 5px; }
    .content { background-color: #f4f4f4; padding: 20px; margin-top: 20px; border-radius: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
    .links { margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${alert.title}</h2>
    </div>
    <div class="content">
      <p>${alert.message.replace(/\n/g, '<br>')}</p>
      <table>
        ${contextHtml}
      </table>
      ${linksHtml ? `<div class="links">${linksHtml}</div>` : ''}
    </div>
    <div class="footer">
      <p>AI Evals Monitoring - ${alert.timestamp.toISOString()}</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return {
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      html,
    };
  }

  /**
   * Map regression severity to alert severity
   */
  private mapRegressionSeverity(severity: RegressionResult['severity']): AlertSeverity {
    switch (severity) {
      case 'critical':
        return AlertSeverity.CRITICAL;
      case 'major':
        return AlertSeverity.HIGH;
      case 'minor':
        return AlertSeverity.MEDIUM;
      default:
        return AlertSeverity.LOW;
    }
  }

  /**
   * Get color for severity level
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return '#dc3545'; // Red
      case AlertSeverity.HIGH:
        return '#fd7e14'; // Orange
      case AlertSeverity.MEDIUM:
        return '#ffc107'; // Yellow
      case AlertSeverity.LOW:
        return '#17a2b8'; // Blue
      case AlertSeverity.INFO:
        return '#6c757d'; // Gray
      default:
        return '#6c757d';
    }
  }

  /**
   * Generate dashboard links
   */
  private generateLinks(jobId: string, testCaseId?: string): Array<{ label: string; url: string }> {
    if (!this.config.dashboardUrl) return [];

    const links = [
      {
        label: 'View Run Details',
        url: `${this.config.dashboardUrl}/evals/runs/${jobId}`,
      },
    ];

    if (testCaseId) {
      links.push({
        label: 'View Test Case',
        url: `${this.config.dashboardUrl}/evals/runs/${jobId}/tests/${testCaseId}`,
      });
    }

    return links;
  }

  /**
   * Track cost for daily/monthly limits
   */
  private trackCost(cost: number): void {
    const now = new Date();
    const lastReset = this.costTracking.lastReset;

    // Reset daily if new day
    if (now.getDate() !== lastReset.getDate()) {
      this.costTracking.daily = 0;
    }

    // Reset monthly if new month
    if (now.getMonth() !== lastReset.getMonth()) {
      this.costTracking.monthly = 0;
    }

    this.costTracking.daily += cost;
    this.costTracking.monthly += cost;
    this.costTracking.lastReset = now;
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit?: number): Alert[] {
    return limit ? this.alertHistory.slice(-limit) : this.alertHistory;
  }

  /**
   * Clear alert history
   */
  clearHistory(): void {
    this.alertHistory = [];
  }

  /**
   * Log if verbose mode is enabled
   */
  private log(...args: any[]): void {
    if (this.config.verbose) {
      console.log('[AlertManager]', ...args);
    }
  }
}

/**
 * Create a singleton alert manager
 */
let globalAlertManager: AlertManager | null = null;

export function getAlertManager(config?: AlertConfig): AlertManager {
  if (!globalAlertManager) {
    globalAlertManager = new AlertManager(config);
  }
  return globalAlertManager;
}
