import { readFile } from 'fs/promises';
import { parse as parseYAML } from 'yaml';
import { z } from 'zod';
import { EvalConfig, EvalConfigSchema } from './types';

/**
 * Parse configuration file (JSON or YAML)
 */
export async function parseConfigFile(filePath: string): Promise<EvalConfig> {
  try {
    const content = await readFile(filePath, 'utf-8');

    // Determine file type by extension
    const isYAML = filePath.endsWith('.yaml') || filePath.endsWith('.yml');

    // Parse content
    const rawConfig = isYAML ? parseYAML(content) : JSON.parse(content);

    // Validate against schema
    const config = EvalConfigSchema.parse(rawConfig);

    // Merge with environment variables
    return mergeWithEnvVars(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ConfigValidationError('Configuration validation failed', error);
    }
    throw new ConfigParseError(`Failed to parse config file: ${filePath}`, error as Error);
  }
}

/**
 * Merge configuration with environment variables
 */
function mergeWithEnvVars(config: EvalConfig): EvalConfig {
  const merged = { ...config };

  // Override API keys from environment
  if (process.env.OPENAI_API_KEY) {
    merged.apiKeys = merged.apiKeys || {};
    merged.apiKeys.openai = process.env.OPENAI_API_KEY;
  }

  if (process.env.ANTHROPIC_API_KEY) {
    merged.apiKeys = merged.apiKeys || {};
    merged.apiKeys.anthropic = process.env.ANTHROPIC_API_KEY;
  }

  // Override environment setting
  if (process.env.NODE_ENV === 'production') {
    merged.environment = 'production';
  } else if (process.env.NODE_ENV === 'staging') {
    merged.environment = 'staging';
  }

  return merged;
}

/**
 * Validate configuration object
 */
export function validateConfig(config: unknown): EvalConfig {
  try {
    return EvalConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ConfigValidationError('Configuration validation failed', error);
    }
    throw error;
  }
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): EvalConfig {
  return {
    name: 'Default Eval',
    version: '1.0.0',
    environment: 'development',
    models: [
      {
        provider: 'openai',
        modelId: 'gpt-4-turbo-preview',
        temperature: 0.0,
      },
    ],
    runner: {
      timeout: 30000,
      retries: 3,
      concurrency: 5,
    },
    scorer: {
      strategy: 'exact',
    },
    datasets: {},
    output: {
      format: 'table',
      verbose: false,
      showFailuresOnly: false,
      includeMetadata: true,
    },
    baseline: {
      enabled: false,
      regressionThreshold: 0.05,
      failOnRegression: true,
    },
  };
}

/**
 * Load configuration from multiple sources with priority:
 * 1. Explicit file path (highest priority)
 * 2. ./ai-evals.config.yaml
 * 3. ./ai-evals.config.json
 * 4. Default configuration (lowest priority)
 */
export async function loadConfig(configPath?: string): Promise<EvalConfig> {
  // Explicit path provided
  if (configPath) {
    return parseConfigFile(configPath);
  }

  // Try common config file names
  const configFiles = [
    './ai-evals.config.yaml',
    './ai-evals.config.yml',
    './ai-evals.config.json',
    './.ai-evals.yaml',
    './.ai-evals.json',
  ];

  for (const file of configFiles) {
    try {
      return await parseConfigFile(file);
    } catch (error) {
      // Continue to next file
      continue;
    }
  }

  // Return default config if no file found
  console.warn('No configuration file found, using default configuration');
  return getDefaultConfig();
}

/**
 * Configuration validation error
 */
export class ConfigValidationError extends Error {
  constructor(message: string, public zodError: z.ZodError) {
    super(message);
    this.name = 'ConfigValidationError';
  }

  formatErrors(): string {
    return this.zodError.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
  }
}

/**
 * Configuration parse error
 */
export class ConfigParseError extends Error {
  constructor(message: string, public cause: Error) {
    super(message);
    this.name = 'ConfigParseError';
  }
}
