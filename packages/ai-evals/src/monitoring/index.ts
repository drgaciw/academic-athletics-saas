/**
 * AI Evals Monitoring Module
 *
 * Comprehensive monitoring, alerting, and cost tracking for the AI evaluation framework.
 *
 * Features:
 * - Analytics tracking with Vercel Analytics integration
 * - Multi-channel alerting (Slack, email, webhooks)
 * - Cost tracking with budget management
 * - Real-time metrics and trend analysis
 *
 * @module monitoring
 */

// Analytics exports
export {
  AnalyticsTracker,
  AnalyticsEventType,
  MetricsAggregator,
  getAnalyticsTracker,
  trackEvalRun,
  trackRegression,
} from './analytics';

export type {
  AnalyticsConfig,
  EvalRunMetadata,
  RegressionMetadata,
} from './analytics';

// Alerting exports
export {
  AlertManager,
  AlertSeverity,
  AlertType,
  NotificationChannel,
  getAlertManager,
} from './alerts';

export type {
  AlertConfig,
  SlackConfig,
  EmailConfig,
  WebhookConfig,
  AlertThresholds,
  EscalationPolicy,
  Alert,
} from './alerts';

// Cost tracking exports
export {
  CostTracker,
  CostDimension,
  getCostTracker,
  formatCost,
  formatTokens,
} from './cost-tracker';

export type {
  CostTrackerConfig,
  BudgetConfig,
  CostEntry,
  CostStats,
  CostBreakdown,
  BudgetStatus,
  CostTrendPoint,
  TimePeriod,
} from './cost-tracker';

/**
 * Integrated monitoring facade for easy setup
 */
import { AnalyticsTracker, AnalyticsConfig } from './analytics';
import { AlertManager, AlertConfig } from './alerts';
import { CostTracker, CostTrackerConfig } from './cost-tracker';
import type { EvalReport } from '../types';

export interface MonitoringConfig {
  analytics?: AnalyticsConfig;
  alerts?: AlertConfig;
  costTracking?: CostTrackerConfig;
}

/**
 * Integrated monitoring system
 *
 * Combines analytics, alerting, and cost tracking in a single interface
 */
export class MonitoringSystem {
  private analytics: AnalyticsTracker;
  private alerts: AlertManager;
  private costTracker: CostTracker;

  constructor(config: MonitoringConfig = {}) {
    this.analytics = new AnalyticsTracker(config.analytics);
    this.alerts = new AlertManager(config.alerts);
    this.costTracker = new CostTracker(config.costTracking);
  }

  /**
   * Process an eval report through all monitoring systems
   */
  async processReport(report: EvalReport): Promise<void> {
    // Track analytics
    await this.analytics.trackEvalRun(report);

    // Track costs
    await this.costTracker.trackRun(report);

    // Check and send alerts
    await this.alerts.checkAndAlert(report);
  }

  /**
   * Get analytics tracker
   */
  getAnalytics(): AnalyticsTracker {
    return this.analytics;
  }

  /**
   * Get alert manager
   */
  getAlerts(): AlertManager {
    return this.alerts;
  }

  /**
   * Get cost tracker
   */
  getCostTracker(): CostTracker {
    return this.costTracker;
  }

  /**
   * Get comprehensive monitoring summary
   */
  getSummary(): {
    costs: {
      total: number;
      daily: number;
      monthly: number;
      budgetStatuses: any[];
    };
    alerts: {
      total: number;
      recent: any[];
    };
  } {
    const budgetStatuses = this.costTracker.getAllBudgetStatuses();
    const dailyStatus = budgetStatuses.find((s) => s.period === 'daily');
    const monthlyStatus = budgetStatuses.find((s) => s.period === 'monthly');

    return {
      costs: {
        total: this.costTracker.getTotalCost(),
        daily: dailyStatus?.used || 0,
        monthly: monthlyStatus?.used || 0,
        budgetStatuses,
      },
      alerts: {
        total: this.alerts.getAlertHistory().length,
        recent: this.alerts.getAlertHistory(10),
      },
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.analytics.destroy();
  }
}

/**
 * Create a singleton monitoring system
 */
let globalMonitoring: MonitoringSystem | null = null;

export function getMonitoringSystem(config?: MonitoringConfig): MonitoringSystem {
  if (!globalMonitoring) {
    globalMonitoring = new MonitoringSystem(config);
  }
  return globalMonitoring;
}
