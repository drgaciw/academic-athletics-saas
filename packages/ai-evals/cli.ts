#!/usr/bin/env node

import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  createRunCommand,
  createCompareCommand,
  createReportCommand,
  createDatasetCommand,
  createConfigCommand,
} from './src/cli/commands';

/**
 * Main CLI application
 */
async function main() {
  const program = new Command();

  // Load package.json for version
  const packageJson = JSON.parse(
    await readFile(join(__dirname, 'package.json'), 'utf-8')
  );

  program
    .name('ai-evals')
    .description('AI Evaluation Framework for Athletic Academics Hub')
    .version(packageJson.version)
    .addHelpText(
      'after',
      `
Examples:
  # Run evaluations with default configuration
  $ ai-evals run

  # Run with specific configuration file
  $ ai-evals run --config ./my-eval.yaml

  # Run with interactive mode
  $ ai-evals run --interactive

  # Run specific datasets only
  $ ai-evals run --dataset compliance-eligibility compliance-gpa

  # Compare multiple models
  $ ai-evals compare --models gpt-4-turbo claude-3-opus gpt-3.5-turbo

  # Generate report for latest run
  $ ai-evals report --latest --format markdown

  # Initialize configuration file
  $ ai-evals config init --template compliance

  # List available datasets
  $ ai-evals dataset list

Configuration Files:
  The CLI looks for configuration files in the following order:
  1. File specified with --config option
  2. ./ai-evals.config.yaml
  3. ./ai-evals.config.json
  4. Default configuration

  Generate a starter config with:
  $ ai-evals config init

Environment Variables:
  OPENAI_API_KEY       OpenAI API key
  ANTHROPIC_API_KEY    Anthropic API key
  NODE_ENV             Environment (development|staging|production)

Documentation:
  https://github.com/your-org/athletic-academics-hub/tree/main/packages/ai-evals

Report Issues:
  https://github.com/your-org/athletic-academics-hub/issues
      `
    );

  // Register commands
  program.addCommand(createRunCommand());
  program.addCommand(createCompareCommand());
  program.addCommand(createReportCommand());
  program.addCommand(createDatasetCommand());
  program.addCommand(createConfigCommand());

  // Parse arguments
  await program.parseAsync(process.argv);
}

// Execute main function
main().catch((error) => {
  console.error('Fatal error:', error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});
