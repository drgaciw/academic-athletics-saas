/**
 * AI Evaluation Framework - Precision/Recall/F1 Scorer
 *
 * Task 4.4: Implements precision, recall, and F1 scores for classification tasks
 * - Supports binary and multi-class classification
 * - Configurable threshold for probability outputs
 * - Per-class metrics for detailed analysis
 * - Use for risk prediction and classification evaluation
 */

import type {
  Scorer,
  ScorerResult,
  ScoringContext,
  PrecisionRecallScorerConfig,
} from './types';

/**
 * Confusion matrix for binary classification
 */
interface ConfusionMatrix {
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
}

/**
 * Per-class metrics
 */
interface ClassMetrics {
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

/**
 * PrecisionRecallScorer - Evaluates classification performance
 *
 * Use cases:
 * - Risk prediction evaluation (high risk vs low risk)
 * - Binary classification tasks
 * - Multi-class classification with per-class metrics
 * - Eligibility prediction (eligible vs ineligible)
 */
export class PrecisionRecallScorer implements Scorer {
  public readonly name: string;
  private config: Required<PrecisionRecallScorerConfig>;

  constructor(config: PrecisionRecallScorerConfig) {
    this.config = {
      metric: config.metric,
      threshold: config.threshold ?? 0.5,
      perClass: config.perClass ?? false,
      minScore: config.minScore ?? 0.7,
    };

    this.name = `PrecisionRecall_${this.config.metric}`;
  }

  /**
   * Score classification output
   */
  score(
    output: unknown,
    expected: unknown,
    context?: ScoringContext
  ): ScorerResult {
    try {
      // Handle different input formats
      const { predictions, labels } = this.parseInputs(output, expected);

      if (predictions.length !== labels.length) {
        throw new Error('Predictions and labels must have same length');
      }

      if (predictions.length === 0) {
        throw new Error('Cannot compute metrics for empty arrays');
      }

      // Compute metrics
      const metrics = this.computeMetrics(predictions, labels);

      const score = metrics[this.config.metric];
      const passed = score >= this.config.minScore;

      return {
        score,
        passed,
        reason: passed
          ? `${this.config.metric.toUpperCase()} score ${(score * 100).toFixed(1)}% meets threshold ${(this.config.minScore * 100).toFixed(1)}%`
          : `${this.config.metric.toUpperCase()} score ${(score * 100).toFixed(1)}% below threshold ${(this.config.minScore * 100).toFixed(1)}%`,
        breakdown: metrics,
        metadata: {
          sampleSize: predictions.length,
          threshold: this.config.threshold,
        },
      };
    } catch (error) {
      return {
        score: 0.0,
        passed: false,
        reason: `Error computing metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        breakdown: {},
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Parse inputs into predictions and labels
   */
  private parseInputs(
    output: unknown,
    expected: unknown
  ): { predictions: number[]; labels: number[] } {
    // Case 1: Output and expected are both arrays
    if (Array.isArray(output) && Array.isArray(expected)) {
      return {
        predictions: this.normalizeArray(output),
        labels: this.normalizeArray(expected),
      };
    }

    // Case 2: Single prediction and label
    if (
      !Array.isArray(output) &&
      !Array.isArray(expected) &&
      typeof output !== 'object' &&
      typeof expected !== 'object'
    ) {
      return {
        predictions: [this.normalizeValue(output)],
        labels: [this.normalizeValue(expected)],
      };
    }

    // Case 3: Object with predictions and labels fields
    if (
      typeof output === 'object' &&
      output !== null &&
      'predictions' in output &&
      'labels' in output
    ) {
      const obj = output as { predictions: unknown; labels: unknown };
      return {
        predictions: this.normalizeArray(obj.predictions),
        labels: this.normalizeArray(obj.labels),
      };
    }

    throw new Error('Invalid input format for PrecisionRecallScorer');
  }

  /**
   * Normalize array to numbers
   */
  private normalizeArray(arr: unknown): number[] {
    if (!Array.isArray(arr)) {
      throw new Error('Expected array');
    }
    return arr.map((v) => this.normalizeValue(v));
  }

  /**
   * Normalize value to number (0 or 1)
   */
  private normalizeValue(value: unknown): number {
    if (typeof value === 'number') {
      // Apply threshold if value is probability
      return value >= this.config.threshold ? 1 : 0;
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'positive') {
        return 1;
      }
      if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'negative') {
        return 0;
      }
      // Try parsing as number
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return num >= this.config.threshold ? 1 : 0;
      }
    }

    throw new Error(`Cannot normalize value to binary: ${value}`);
  }

  /**
   * Compute precision, recall, and F1 metrics
   */
  private computeMetrics(
    predictions: number[],
    labels: number[]
  ): Record<string, number> {
    const cm = this.buildConfusionMatrix(predictions, labels);

    const precision = this.calculatePrecision(cm);
    const recall = this.calculateRecall(cm);
    const f1 = this.calculateF1(precision, recall);

    const metrics: Record<string, number> = {
      precision,
      recall,
      f1,
      truePositives: cm.truePositives,
      trueNegatives: cm.trueNegatives,
      falsePositives: cm.falsePositives,
      falseNegatives: cm.falseNegatives,
      accuracy:
        (cm.truePositives + cm.trueNegatives) /
        (cm.truePositives +
          cm.trueNegatives +
          cm.falsePositives +
          cm.falseNegatives),
    };

    // Add per-class metrics if requested
    if (this.config.perClass) {
      const uniqueClasses = new Set([...predictions, ...labels]);
      for (const cls of uniqueClasses) {
        const classPredictions = predictions.map((p) => (p === cls ? 1 : 0));
        const classLabels = labels.map((l) => (l === cls ? 1 : 0));
        const classCm = this.buildConfusionMatrix(classPredictions, classLabels);

        const classPrecision = this.calculatePrecision(classCm);
        const classRecall = this.calculateRecall(classCm);
        const classF1 = this.calculateF1(classPrecision, classRecall);

        metrics[`precision_class_${cls}`] = classPrecision;
        metrics[`recall_class_${cls}`] = classRecall;
        metrics[`f1_class_${cls}`] = classF1;
      }
    }

    return metrics;
  }

  /**
   * Build confusion matrix
   */
  private buildConfusionMatrix(
    predictions: number[],
    labels: number[]
  ): ConfusionMatrix {
    let truePositives = 0;
    let trueNegatives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (let i = 0; i < predictions.length; i++) {
      const pred = predictions[i];
      const label = labels[i];

      if (pred === 1 && label === 1) {
        truePositives++;
      } else if (pred === 0 && label === 0) {
        trueNegatives++;
      } else if (pred === 1 && label === 0) {
        falsePositives++;
      } else if (pred === 0 && label === 1) {
        falseNegatives++;
      }
    }

    return {
      truePositives,
      trueNegatives,
      falsePositives,
      falseNegatives,
    };
  }

  /**
   * Calculate precision
   */
  private calculatePrecision(cm: ConfusionMatrix): number {
    const { truePositives, falsePositives } = cm;
    if (truePositives + falsePositives === 0) {
      return 0;
    }
    return truePositives / (truePositives + falsePositives);
  }

  /**
   * Calculate recall
   */
  private calculateRecall(cm: ConfusionMatrix): number {
    const { truePositives, falseNegatives } = cm;
    if (truePositives + falseNegatives === 0) {
      return 0;
    }
    return truePositives / (truePositives + falseNegatives);
  }

  /**
   * Calculate F1 score
   */
  private calculateF1(precision: number, recall: number): number {
    if (precision + recall === 0) {
      return 0;
    }
    return (2 * precision * recall) / (precision + recall);
  }
}

/**
 * Convenience functions for creating scorers
 */
export function precisionScorer(
  config?: Omit<PrecisionRecallScorerConfig, 'metric'>
): PrecisionRecallScorer {
  return new PrecisionRecallScorer({ ...config, metric: 'precision' });
}

export function recallScorer(
  config?: Omit<PrecisionRecallScorerConfig, 'metric'>
): PrecisionRecallScorer {
  return new PrecisionRecallScorer({ ...config, metric: 'recall' });
}

export function f1Scorer(
  config?: Omit<PrecisionRecallScorerConfig, 'metric'>
): PrecisionRecallScorer {
  return new PrecisionRecallScorer({ ...config, metric: 'f1' });
}
