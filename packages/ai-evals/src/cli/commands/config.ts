import { Command } from 'commander';
import { writeFile } from 'fs/promises';
import { stringify as stringifyYAML } from 'yaml';
import {
  section,
  success,
  error,
  info,
  logError,
  formatJSON,
} from '../utils';
import {
  complianceEvalConfig,
  conversationalEvalConfig,
  ragEvalConfig,
  modelComparisonConfig,
} from '../../config/examples';
import {
  getDefaultConfig,
  parseConfigFile,
  loadConfig,
  ConfigValidationError,
} from '../../config/parser';

/**
 * Config command - Manage configuration files
 */
export function createConfigCommand(): Command {
  const command = new Command('config')
    .description('Manage configuration files');

  // Initialize config
  command
    .command('init')
    .description('Initialize a new configuration file')
    .option('-f, --format <format>', 'Format (json|yaml)', 'yaml')
    .option('-t, --template <template>', 'Template to use (default|compliance|conversational|rag|comparison)', 'default')
    .option('-o, --output <path>', 'Output file path')
    .action(handleInitConfig);

  // Validate config
  command
    .command('validate [path]')
    .description('Validate configuration file')
    .action(handleValidateConfig);

  // Show config
  command
    .command('show [path]')
    .description('Display configuration')
    .option('-f, --format <format>', 'Output format (json|yaml)', 'json')
    .action(handleShowConfig);

  return command;
}

/**
 * Initialize configuration file
 */
async function handleInitConfig(options: {
  format: 'json' | 'yaml';
  template: string;
  output?: string;
}) {
  try {
    section('Initialize Configuration');

    // Select template
    let config;
    switch (options.template) {
      case 'compliance':
        config = complianceEvalConfig;
        break;
      case 'conversational':
        config = conversationalEvalConfig;
        break;
      case 'rag':
        config = ragEvalConfig;
        break;
      case 'comparison':
        config = modelComparisonConfig;
        break;
      default:
        config = getDefaultConfig();
    }

    info(`Using template: ${options.template}`);

    // Determine output path
    const outputPath =
      options.output ||
      (options.format === 'yaml'
        ? './ai-evals.config.yaml'
        : './ai-evals.config.json');

    // Convert to appropriate format
    const content =
      options.format === 'yaml'
        ? stringifyYAML(config)
        : JSON.stringify(config, null, 2);

    // Write file
    await writeFile(outputPath, content, 'utf-8');

    success(`Configuration file created: ${outputPath}`);
    info('Edit the file to customize your evaluation setup');
    info('Run "ai-evals config validate" to check for errors');
  } catch (err) {
    error('Failed to initialize configuration');
    logError(err as Error);
    process.exit(1);
  }
}

/**
 * Validate configuration file
 */
export async function handleValidateConfig(path?: string) {
  try {
    section('Validate Configuration');

    const configPath = path || './ai-evals.config.yaml';
    info(`Validating: ${configPath}`);

    await parseConfigFile(configPath);

    success('Configuration is valid');
  } catch (err) {
    error('Configuration validation failed');
    if (err instanceof ConfigValidationError) {
      console.error(err.formatErrors());
    } else {
      logError(err as Error);
    }
    process.exit(1);
  }
}

/**
 * Show configuration
 */
async function handleShowConfig(
  path?: string,
  options?: { format: 'json' | 'yaml' }
) {
  try {
    section('Configuration');

    info(`Loading: ${path || 'default search paths'}`);

    const config = await loadConfig(path);

    if (options?.format === 'yaml') {
      console.log(stringifyYAML(config));
    } else {
      console.log(formatJSON(config));
    }
  } catch (err) {
    error('Failed to load configuration');
    if (err instanceof ConfigValidationError) {
      console.error(err.formatErrors());
    } else {
      logError(err as Error);
    }
    process.exit(1);
  }
}
