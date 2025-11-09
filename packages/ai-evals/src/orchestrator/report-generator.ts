/**
 * Report Generator (Task 5.4)
 *
 * Creates comprehensive evaluation reports with metrics, regressions,
 * and actionable recommendations. Supports export in multiple formats.
 */

import {
  EvalReport,
  Recommendation,
  Regression,
  RunSummary,
  ScoringResult,
  Metrics,
  CategoryMetrics,
  ExecutionMetrics,
  ExportFormat,
  ExportOptions,
  JobStatus,
} from '../types';

export interface ReportConfig {
  jobId: string;
  runSummaries: RunSummary[];
  scoringResults: ScoringResult[];
  regressions?: Regression[];
  executionMetrics?: ExecutionMetrics;
  status: JobStatus;
}

/**
 * Generate comprehensive evaluation reports
 */
export class ReportGenerator {
  /**
   * Generate a complete evaluation report
   */
  generateReport(config: ReportConfig): EvalReport {
    const metrics = this.calculateMetrics(config.runSummaries, config.scoringResults);
    const recommendations = this.generateRecommendations(
      metrics,
      config.regressions || [],
      config.executionMetrics
    );

    const totalDuration = config.runSummaries.reduce(
      (sum, run) => sum + run.totalDuration,
      0
    );

    const totalCost = config.runSummaries.reduce((sum, run) => sum + run.totalCost, 0);

    const report: EvalReport = {
      jobId: config.jobId,
      summary: {
        totalTests: metrics.totalTests,
        passed: metrics.passed,
        failed: metrics.failed,
        accuracy: metrics.accuracy,
        avgLatency: metrics.avgLatency,
        totalCost,
        duration: totalDuration,
        status: config.status,
      },
      runSummaries: config.runSummaries,
      scoringResults: config.scoringResults,
      metrics,
      regressions: config.regressions || [],
      recommendations,
      executionMetrics: config.executionMetrics,
      generatedAt: new Date(),
    };

    return report;
  }

  /**
   * Calculate aggregated metrics from run summaries and scoring results
   */
  private calculateMetrics(
    runSummaries: RunSummary[],
    scoringResults: ScoringResult[]
  ): Metrics {
    const totalTests = scoringResults.length;
    const passed = scoringResults.filter((r) => r.score.passed).length;
    const failed = totalTests - passed;

    const avgScore =
      totalTests > 0
        ? scoringResults.reduce((sum, r) => sum + r.score.score, 0) / totalTests
        : 0;

    const avgLatency =
      runSummaries.length > 0
        ? runSummaries.reduce((sum, run) => {
            const runAvg =
              run.results.reduce((s, r) => s + r.metadata.latency, 0) /
              Math.max(run.results.length, 1);
            return sum + runAvg;
          }, 0) / runSummaries.length
        : 0;

    const totalCost = runSummaries.reduce((sum, run) => sum + run.totalCost, 0);

    const breakdown = this.calculateCategoryBreakdown(runSummaries, scoringResults);

    return {
      totalTests,
      passed,
      failed,
      accuracy: totalTests > 0 ? (passed / totalTests) * 100 : 0,
      passRate: totalTests > 0 ? (passed / totalTests) * 100 : 0,
      avgScore,
      avgLatency,
      totalCost,
      breakdown,
    };
  }

  /**
   * Calculate metrics broken down by category
   */
  private calculateCategoryBreakdown(
    runSummaries: RunSummary[],
    scoringResults: ScoringResult[]
  ): Record<string, CategoryMetrics> {
    const categoryMap = new Map<string, ScoringResult[]>();

    for (const result of scoringResults) {
      const testCaseId = result.testCaseId;
      const category = this.extractCategory(testCaseId);

      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(result);
    }

    const breakdown: Record<string, CategoryMetrics> = {};

    for (const [category, results] of categoryMap.entries()) {
      const totalTests = results.length;
      const passed = results.filter((r) => r.score.passed).length;
      const avgScore =
        results.reduce((sum, r) => sum + r.score.score, 0) / Math.max(totalTests, 1);

      const categoryTestCaseIds = new Set(results.map((r) => r.testCaseId));
      const categoryResults = runSummaries.flatMap((run) =>
        run.results.filter((r) => categoryTestCaseIds.has(r.testCaseId))
      );

      const avgLatency =
        categoryResults.reduce((sum, r) => sum + r.metadata.latency, 0) /
        Math.max(categoryResults.length, 1);

      const avgCost =
        categoryResults.reduce((sum, r) => sum + r.metadata.cost, 0) /
        Math.max(categoryResults.length, 1);

      breakdown[category] = {
        category,
        totalTests,
        passed,
        accuracy: (passed / Math.max(totalTests, 1)) * 100,
        avgScore,
        avgLatency,
        avgCost,
      };
    }

    return breakdown;
  }

  /**
   * Extract category from test case ID
   */
  private extractCategory(testCaseId: string): string {
    const parts = testCaseId.split('-');
    return parts[0] || 'general';
  }

  /**
   * Generate actionable recommendations based on results
   */
  private generateRecommendations(
    metrics: Metrics,
    regressions: Regression[],
    executionMetrics?: ExecutionMetrics
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    const criticalRegressions = regressions.filter((r) => r.severity === 'critical');
    if (criticalRegressions.length > 0) {
      recommendations.push({
        type: 'regression',
        severity: 'high',
        title: 'Critical Regressions Detected',
        description:
          criticalRegressions.length + ' critical regression(s) found in this evaluation run.',
        actionable: true,
        suggestedActions: [
          'Review test cases with critical regressions immediately',
          'Roll back recent changes or investigate root cause',
          'Consider blocking deployment until regressions are resolved',
        ],
      });
    }

    if (metrics.accuracy < 80) {
      recommendations.push({
        type: 'accuracy',
        severity: 'high',
        title: 'Low Overall Accuracy',
        description:
          'Accuracy of ' +
          metrics.accuracy.toFixed(1) +
          '% is below acceptable threshold of 80%',
        actionable: true,
        suggestedActions: [
          'Review failed test cases to identify patterns',
          'Consider adjusting model parameters or prompts',
          'Add more diverse test cases to dataset',
          'Evaluate if expectations are realistic',
        ],
      });
    }

    if (metrics.avgLatency > 5000) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        title: 'High Average Latency',
        description:
          'Average latency of ' +
          Math.round(metrics.avgLatency) +
          'ms exceeds target of 5000ms',
        actionable: true,
        suggestedActions: [
          'Consider using faster model variants',
          'Implement prompt caching where possible',
          'Optimize input preprocessing',
          'Review timeout configurations',
        ],
      });
    }

    if (metrics.totalCost > 10) {
      recommendations.push({
        type: 'cost',
        severity: 'medium',
        title: 'High Evaluation Cost',
        description: 'Total cost of $' + metrics.totalCost.toFixed(2) + ' is significant',
        actionable: true,
        suggestedActions: [
          'Consider using more cost-effective models for evaluation',
          'Implement response caching to reduce duplicate calls',
          'Reduce test dataset size while maintaining coverage',
          'Use cheaper models for initial screening, expensive models for edge cases',
        ],
      });
    }

    if (executionMetrics && executionMetrics.parallelEfficiency < 0.6) {
      recommendations.push({
        type: 'performance',
        severity: 'low',
        title: 'Low Parallel Execution Efficiency',
        description:
          'Parallel efficiency of ' +
          (executionMetrics.parallelEfficiency * 100).toFixed(1) +
          '% indicates suboptimal concurrency',
        actionable: true,
        suggestedActions: [
          'Increase concurrency limit if rate limits allow',
          'Review rate limiting configuration',
          'Consider batching requests more effectively',
        ],
      });
    }

    const poorCategories = Object.values(metrics.breakdown).filter((cat) => cat.accuracy < 70);
    if (poorCategories.length > 0) {
      recommendations.push({
        type: 'accuracy',
        severity: 'medium',
        title: 'Poor Performance in Specific Categories',
        description:
          'Categories with low accuracy: ' +
          poorCategories.map((c) => c.category).join(', '),
        actionable: true,
        suggestedActions: [
          'Focus improvement efforts on specific categories',
          'Add more test cases for underperforming categories',
          'Consider category-specific model fine-tuning',
        ],
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'accuracy',
        severity: 'low',
        title: 'All Metrics Within Acceptable Range',
        description: 'Evaluation results look good. No critical issues detected.',
        actionable: false,
      });
    }

    return recommendations;
  }

  /**
   * Export report in specified format
   */
  exportReport(report: EvalReport, options: ExportOptions): string {
    switch (options.format) {
      case 'json':
        return this.exportJSON(report, options);
      case 'csv':
        return this.exportCSV(report, options);
      case 'html':
        return this.exportHTML(report, options);
      default:
        throw new Error('Unsupported export format: ' + options.format);
    }
  }

  /**
   * Export as JSON
   */
  private exportJSON(report: EvalReport, options: ExportOptions): string {
    if (!options.includeDetails) {
      return JSON.stringify(
        {
          jobId: report.jobId,
          summary: report.summary,
          metrics: report.metrics,
          regressions: report.regressions,
          recommendations: options.includeRecommendations ? report.recommendations : undefined,
        },
        null,
        2
      );
    }

    return JSON.stringify(report, null, 2);
  }

  /**
   * Export as CSV
   */
  private exportCSV(report: EvalReport, options: ExportOptions): string {
    let csv = 'Category,Total Tests,Passed,Accuracy,Avg Score,Avg Latency,Avg Cost\n';

    csv +=
      'Overall,' +
      report.metrics.totalTests +
      ',' +
      report.metrics.passed +
      ',' +
      report.metrics.accuracy.toFixed(2) +
      ',' +
      report.metrics.avgScore.toFixed(3) +
      ',' +
      report.metrics.avgLatency.toFixed(0) +
      ',' +
      report.metrics.totalCost.toFixed(4) +
      '\n';

    for (const [category, metrics] of Object.entries(report.metrics.breakdown)) {
      csv +=
        category +
        ',' +
        metrics.totalTests +
        ',' +
        metrics.passed +
        ',' +
        metrics.accuracy.toFixed(2) +
        ',' +
        metrics.avgScore.toFixed(3) +
        ',' +
        metrics.avgLatency.toFixed(0) +
        ',' +
        metrics.avgCost.toFixed(4) +
        '\n';
    }

    if (options.includeDetails && report.regressions.length > 0) {
      csv += '\nRegressions\n';
      csv += 'Test Case,Metric,Baseline,Current,Change %,Severity\n';

      for (const reg of report.regressions) {
        csv +=
          reg.testCaseId +
          ',' +
          reg.metric +
          ',' +
          reg.baseline.toFixed(2) +
          ',' +
          reg.current.toFixed(2) +
          ',' +
          reg.percentChange.toFixed(1) +
          ',' +
          reg.severity +
          '\n';
      }
    }

    return csv;
  }

  /**
   * Export as HTML
   */
  private exportHTML(report: EvalReport, options: ExportOptions): string {
    let html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<title>Eval Report - ' + report.jobId + '</title>\n';
    html += '<style>\n';
    html += 'body { font-family: Arial, sans-serif; margin: 20px; }\n';
    html += 'h1, h2 { color: #333; }\n';
    html += 'table { border-collapse: collapse; width: 100%; margin: 20px 0; }\n';
    html += 'th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }\n';
    html += 'th { background-color: #4CAF50; color: white; }\n';
    html += 'tr:nth-child(even) { background-color: #f2f2f2; }\n';
    html += '.critical { color: #d32f2f; font-weight: bold; }\n';
    html += '.major { color: #f57c00; font-weight: bold; }\n';
    html += '.minor { color: #fbc02d; }\n';
    html += '.good { color: #388e3c; }\n';
    html += '.recommendation { background: #fff3cd; padding: 15px; margin: 10px 0; border-left: 4px solid #ffc107; }\n';
    html += '</style>\n</head>\n<body>\n';

    html += '<h1>Evaluation Report</h1>\n';
    html += '<p><strong>Job ID:</strong> ' + report.jobId + '</p>\n';
    html += '<p><strong>Generated:</strong> ' + report.generatedAt.toISOString() + '</p>\n';
    html += '<p><strong>Status:</strong> ' + report.summary.status + '</p>\n';

    html += '<h2>Summary</h2>\n';
    html += '<table>\n';
    html += '<tr><th>Metric</th><th>Value</th></tr>\n';
    html += '<tr><td>Total Tests</td><td>' + report.summary.totalTests + '</td></tr>\n';
    html += '<tr><td>Passed</td><td class="good">' + report.summary.passed + '</td></tr>\n';
    html += '<tr><td>Failed</td><td>' + report.summary.failed + '</td></tr>\n';
    html +=
      '<tr><td>Accuracy</td><td>' + report.summary.accuracy.toFixed(2) + '%</td></tr>\n';
    html +=
      '<tr><td>Avg Latency</td><td>' +
      report.summary.avgLatency.toFixed(0) +
      'ms</td></tr>\n';
    html +=
      '<tr><td>Total Cost</td><td>$' + report.summary.totalCost.toFixed(4) + '</td></tr>\n';
    html +=
      '<tr><td>Duration</td><td>' + (report.summary.duration / 1000).toFixed(1) + 's</td></tr>\n';
    html += '</table>\n';

    if (report.regressions.length > 0) {
      html += '<h2>Regressions</h2>\n';
      html += '<table>\n';
      html += '<tr><th>Test Case</th><th>Metric</th><th>Baseline</th><th>Current</th><th>Change</th><th>Severity</th></tr>\n';

      for (const reg of report.regressions) {
        const severityClass = reg.severity;
        html += '<tr>\n';
        html += '<td>' + reg.testCaseId + '</td>\n';
        html += '<td>' + reg.metric + '</td>\n';
        html += '<td>' + reg.baseline.toFixed(2) + '</td>\n';
        html += '<td>' + reg.current.toFixed(2) + '</td>\n';
        html += '<td>' + reg.percentChange.toFixed(1) + '%</td>\n';
        html += '<td class="' + severityClass + '">' + reg.severity + '</td>\n';
        html += '</tr>\n';
      }

      html += '</table>\n';
    }

    if (options.includeRecommendations && report.recommendations.length > 0) {
      html += '<h2>Recommendations</h2>\n';

      for (const rec of report.recommendations) {
        html += '<div class="recommendation">\n';
        html += '<h3>' + rec.title + '</h3>\n';
        html += '<p>' + rec.description + '</p>\n';

        if (rec.suggestedActions && rec.suggestedActions.length > 0) {
          html += '<ul>\n';
          for (const action of rec.suggestedActions) {
            html += '<li>' + action + '</li>\n';
          }
          html += '</ul>\n';
        }

        html += '</div>\n';
      }
    }

    html += '</body>\n</html>';

    return html;
  }
}
