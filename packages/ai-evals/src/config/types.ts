import { z } from 'zod';

/**
 * Model configuration schema
 */
export const ModelConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic']),
  modelId: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;

/**
 * Runner configuration schema
 */
export const RunnerConfigSchema = z.object({
  timeout: z.number().positive().default(30000), // 30 seconds
  retries: z.number().nonnegative().default(3),
  concurrency: z.number().positive().default(5),
  rateLimit: z.object({
    maxRequests: z.number().positive(),
    perSeconds: z.number().positive(),
  }).optional(),
});

export type RunnerConfig = z.infer<typeof RunnerConfigSchema>;

/**
 * Scorer configuration schema
 */
export const ScorerConfigSchema = z.object({
  strategy: z.enum(['exact', 'semantic', 'llm-judge', 'custom']),
  threshold: z.number().min(0).max(1).optional(),
  judgeModelId: z.string().optional(),
  judgePrompt: z.string().optional(),
  customScorer: z.string().optional(), // Path to custom scorer module
});

export type ScorerConfig = z.infer<typeof ScorerConfigSchema>;

/**
 * Dataset selection schema
 */
export const DatasetSelectionSchema = z.object({
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

export type DatasetSelection = z.infer<typeof DatasetSelectionSchema>;

/**
 * Output format configuration
 */
export const OutputConfigSchema = z.object({
  format: z.enum(['json', 'table', 'markdown', 'html', 'csv']).default('table'),
  verbose: z.boolean().default(false),
  showFailuresOnly: z.boolean().default(false),
  outputFile: z.string().optional(),
  includeMetadata: z.boolean().default(true),
});

export type OutputConfig = z.infer<typeof OutputConfigSchema>;

/**
 * Baseline comparison configuration
 */
export const BaselineConfigSchema = z.object({
  enabled: z.boolean().default(false),
  baselineId: z.string().optional(),
  regressionThreshold: z.number().min(0).max(1).default(0.05), // 5% threshold
  failOnRegression: z.boolean().default(true),
});

export type BaselineConfig = z.infer<typeof BaselineConfigSchema>;

/**
 * Main eval configuration schema
 */
export const EvalConfigSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),

  // Environment-specific settings
  environment: z.enum(['development', 'staging', 'production']).default('development'),

  // Model configurations
  models: z.array(ModelConfigSchema).min(1),

  // Runner settings
  runner: RunnerConfigSchema.default({}),

  // Scorer settings
  scorer: ScorerConfigSchema,

  // Dataset selection
  datasets: DatasetSelectionSchema.default({}),

  // Output configuration
  output: OutputConfigSchema.default({}),

  // Baseline comparison
  baseline: BaselineConfigSchema.default({}),

  // API keys (can be overridden by environment variables)
  apiKeys: z.object({
    openai: z.string().optional(),
    anthropic: z.string().optional(),
  }).optional(),

  // Additional metadata
  metadata: z.record(z.any()).optional(),
});

export type EvalConfig = z.infer<typeof EvalConfigSchema>;

/**
 * CLI command options schemas
 */
export const RunCommandOptionsSchema = z.object({
  config: z.string().optional(),
  dataset: z.array(z.string()).optional(),
  model: z.array(z.string()).optional(),
  baseline: z.string().optional(),
  output: z.string().optional(),
  format: z.enum(['json', 'table', 'markdown', 'html', 'csv']).optional(),
  verbose: z.boolean().optional(),
  interactive: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  parallel: z.boolean().optional(),
  concurrency: z.number().positive().optional(),
});

export type RunCommandOptions = z.infer<typeof RunCommandOptionsSchema>;

export const CompareCommandOptionsSchema = z.object({
  config: z.string().optional(),
  dataset: z.array(z.string()).optional(),
  models: z.array(z.string()).min(2),
  output: z.string().optional(),
  format: z.enum(['json', 'table', 'markdown', 'html']).optional(),
  metric: z.array(z.string()).optional(),
  verbose: z.boolean().optional(),
});

export type CompareCommandOptions = z.infer<typeof CompareCommandOptionsSchema>;

export const ReportCommandOptionsSchema = z.object({
  runId: z.string().optional(),
  latest: z.boolean().optional(),
  format: z.enum(['json', 'markdown', 'html', 'pdf']).optional(),
  output: z.string().optional(),
  includeFailures: z.boolean().optional(),
  includeMetrics: z.boolean().optional(),
  compareBaseline: z.boolean().optional(),
});

export type ReportCommandOptions = z.infer<typeof ReportCommandOptionsSchema>;
