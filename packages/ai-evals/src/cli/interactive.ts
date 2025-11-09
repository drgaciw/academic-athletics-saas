import inquirer from 'inquirer';
import { EvalConfig, ModelConfig, DatasetSelection } from '../config/types';
import { info, section, success, warning } from './utils';

/**
 * Interactive mode for guided eval execution
 */
export async function interactiveMode(): Promise<EvalConfig> {
  section('Interactive Eval Configuration');

  // Basic information
  const basicInfo = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Eval name:',
      default: 'Custom Eval',
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description (optional):',
    },
    {
      type: 'list',
      name: 'environment',
      message: 'Environment:',
      choices: ['development', 'staging', 'production'],
      default: 'development',
    },
  ]);

  // Model selection
  const models = await selectModels();

  // Dataset selection
  const datasets = await selectDatasets();

  // Scorer configuration
  const scorer = await configureScorerInteractive();

  // Runner configuration
  const runner = await configureRunnerInteractive();

  // Output configuration
  const output = await configureOutputInteractive();

  // Baseline configuration
  const baseline = await configureBaselineInteractive();

  const config: EvalConfig = {
    ...basicInfo,
    version: '1.0.0',
    models,
    datasets,
    scorer,
    runner,
    output,
    baseline,
  };

  // Confirmation
  section('Configuration Summary');
  console.log(JSON.stringify(config, null, 2));

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Proceed with this configuration?',
      default: true,
    },
  ]);

  if (!confirm) {
    throw new Error('Eval cancelled by user');
  }

  return config;
}

/**
 * Interactive model selection
 */
async function selectModels(): Promise<ModelConfig[]> {
  section('Model Selection');

  const models: ModelConfig[] = [];
  let addMore = true;

  while (addMore) {
    const modelConfig = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Select provider:',
        choices: [
          { name: 'OpenAI', value: 'openai' },
          { name: 'Anthropic', value: 'anthropic' },
        ],
      },
      {
        type: 'list',
        name: 'modelId',
        message: 'Select model:',
        choices: (answers: any) => {
          if (answers.provider === 'openai') {
            return [
              'gpt-4-turbo-preview',
              'gpt-4',
              'gpt-3.5-turbo',
              'gpt-3.5-turbo-16k',
            ];
          }
          return [
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
          ];
        },
      },
      {
        type: 'number',
        name: 'temperature',
        message: 'Temperature (0.0-2.0):',
        default: 0.0,
        validate: (value: number) => {
          if (value >= 0 && value <= 2) return true;
          return 'Temperature must be between 0.0 and 2.0';
        },
      },
      {
        type: 'number',
        name: 'maxTokens',
        message: 'Max tokens (optional, press Enter to skip):',
        default: undefined,
      },
    ]);

    models.push(modelConfig as ModelConfig);

    const { continueAdding } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueAdding',
        message: 'Add another model?',
        default: false,
      },
    ]);

    addMore = continueAdding;
  }

  success(`Added ${models.length} model(s)`);
  return models;
}

/**
 * Interactive dataset selection
 */
async function selectDatasets(): Promise<DatasetSelection> {
  section('Dataset Selection');

  const { selectionType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectionType',
      message: 'How would you like to select datasets?',
      choices: [
        { name: 'Include specific datasets', value: 'include' },
        { name: 'Select by tags', value: 'tags' },
        { name: 'Select by category', value: 'category' },
        { name: 'All datasets', value: 'all' },
      ],
    },
  ]);

  if (selectionType === 'all') {
    return {};
  }

  if (selectionType === 'include') {
    const { datasets } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'datasets',
        message: 'Select datasets:',
        choices: [
          { name: 'Compliance - Eligibility', value: 'compliance-eligibility' },
          { name: 'Compliance - GPA', value: 'compliance-gpa' },
          { name: 'Compliance - Progress', value: 'compliance-progress' },
          { name: 'Chat - General', value: 'chat-general' },
          { name: 'Chat - Policy', value: 'chat-policy' },
          { name: 'Chat - Edge Cases', value: 'chat-edge-cases' },
          { name: 'Advising - Recommendations', value: 'advising-recommendations' },
          { name: 'Advising - Conflicts', value: 'advising-conflicts' },
          { name: 'RAG - Retrieval', value: 'rag-retrieval' },
          { name: 'RAG - Accuracy', value: 'rag-accuracy' },
        ],
      },
    ]);
    return { include: datasets };
  }

  if (selectionType === 'tags') {
    const { tags } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'tags',
        message: 'Select tags:',
        choices: [
          'ncaa',
          'eligibility',
          'gpa',
          'compliance',
          'conversational',
          'advising',
          'rag',
          'policy',
        ],
      },
    ]);
    return { tags };
  }

  if (selectionType === 'category') {
    const { categories } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'categories',
        message: 'Select categories:',
        choices: ['compliance', 'conversational', 'advising', 'rag', 'risk-prediction'],
      },
    ]);
    return { categories };
  }

  return {};
}

/**
 * Interactive scorer configuration
 */
async function configureScorerInteractive() {
  section('Scorer Configuration');

  const { strategy } = await inquirer.prompt([
    {
      type: 'list',
      name: 'strategy',
      message: 'Scoring strategy:',
      choices: [
        {
          name: 'Exact Match - For structured outputs',
          value: 'exact',
        },
        {
          name: 'Semantic Similarity - For natural language',
          value: 'semantic',
        },
        {
          name: 'LLM-as-Judge - For quality assessment',
          value: 'llm-judge',
        },
        {
          name: 'Custom - Custom scoring function',
          value: 'custom',
        },
      ],
    },
  ]);

  const scorer: any = { strategy };

  if (strategy !== 'exact') {
    const { threshold } = await inquirer.prompt([
      {
        type: 'number',
        name: 'threshold',
        message: 'Score threshold (0.0-1.0):',
        default: strategy === 'llm-judge' ? 0.7 : 0.85,
        validate: (value: number) => {
          if (value >= 0 && value <= 1) return true;
          return 'Threshold must be between 0.0 and 1.0';
        },
      },
    ]);
    scorer.threshold = threshold;
  }

  if (strategy === 'llm-judge') {
    const { judgeModelId, judgePrompt } = await inquirer.prompt([
      {
        type: 'list',
        name: 'judgeModelId',
        message: 'Judge model:',
        choices: ['gpt-4-turbo-preview', 'gpt-4', 'claude-3-opus-20240229'],
      },
      {
        type: 'editor',
        name: 'judgePrompt',
        message: 'Judge prompt (opens editor):',
        default: `Evaluate the AI response on the following criteria:
1. Accuracy
2. Helpfulness
3. Tone
4. Completeness

Provide a score from 0.0 to 1.0 and explain your reasoning.`,
      },
    ]);
    scorer.judgeModelId = judgeModelId;
    scorer.judgePrompt = judgePrompt;
  }

  return scorer;
}

/**
 * Interactive runner configuration
 */
async function configureRunnerInteractive() {
  section('Runner Configuration');

  const runner = await inquirer.prompt([
    {
      type: 'number',
      name: 'timeout',
      message: 'Timeout per test case (ms):',
      default: 30000,
    },
    {
      type: 'number',
      name: 'retries',
      message: 'Max retries on failure:',
      default: 3,
    },
    {
      type: 'number',
      name: 'concurrency',
      message: 'Concurrent executions:',
      default: 5,
    },
  ]);

  return runner;
}

/**
 * Interactive output configuration
 */
async function configureOutputInteractive() {
  section('Output Configuration');

  const output = await inquirer.prompt([
    {
      type: 'list',
      name: 'format',
      message: 'Output format:',
      choices: ['table', 'json', 'markdown', 'html', 'csv'],
      default: 'table',
    },
    {
      type: 'confirm',
      name: 'verbose',
      message: 'Verbose output?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'showFailuresOnly',
      message: 'Show failures only?',
      default: false,
    },
    {
      type: 'input',
      name: 'outputFile',
      message: 'Output file path (optional):',
    },
  ]);

  return {
    ...output,
    includeMetadata: true,
  };
}

/**
 * Interactive baseline configuration
 */
async function configureBaselineInteractive() {
  section('Baseline Configuration');

  const { enabled } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enabled',
      message: 'Enable baseline comparison?',
      default: false,
    },
  ]);

  if (!enabled) {
    return { enabled: false };
  }

  const baseline = await inquirer.prompt([
    {
      type: 'input',
      name: 'baselineId',
      message: 'Baseline run ID (leave empty for latest):',
    },
    {
      type: 'number',
      name: 'regressionThreshold',
      message: 'Regression threshold (0.0-1.0):',
      default: 0.05,
      validate: (value: number) => {
        if (value >= 0 && value <= 1) return true;
        return 'Threshold must be between 0.0 and 1.0';
      },
    },
    {
      type: 'confirm',
      name: 'failOnRegression',
      message: 'Fail on regression?',
      default: true,
    },
  ]);

  return { enabled: true, ...baseline };
}
