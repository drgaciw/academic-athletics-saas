import { EvalConfig } from './types';

/**
 * Example configuration for NCAA compliance evaluation
 */
export const complianceEvalConfig: EvalConfig = {
  name: 'NCAA Compliance Evaluation',
  description: 'Evaluate NCAA compliance checking accuracy',
  version: '1.0.0',
  environment: 'development',

  models: [
    {
      provider: 'openai',
      modelId: 'gpt-4-turbo-preview',
      temperature: 0.0,
      maxTokens: 2000,
    },
    {
      provider: 'anthropic',
      modelId: 'claude-3-opus-20240229',
      temperature: 0.0,
      maxTokens: 2000,
    },
  ],

  runner: {
    timeout: 30000,
    retries: 3,
    concurrency: 5,
  },

  scorer: {
    strategy: 'exact',
    threshold: 1.0, // Require 100% match for compliance
  },

  datasets: {
    include: ['compliance-eligibility', 'compliance-gpa', 'compliance-progress'],
    tags: ['ncaa', 'eligibility'],
  },

  output: {
    format: 'table',
    verbose: true,
    showFailuresOnly: false,
    outputFile: './results/compliance-eval.json',
    includeMetadata: true,
  },

  baseline: {
    enabled: true,
    regressionThreshold: 0.05,
    failOnRegression: true,
  },
};

/**
 * Example configuration for conversational AI evaluation
 */
export const conversationalEvalConfig: EvalConfig = {
  name: 'Conversational AI Evaluation',
  description: 'Evaluate chat response quality and accuracy',
  version: '1.0.0',
  environment: 'development',

  models: [
    {
      provider: 'openai',
      modelId: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 1000,
    },
  ],

  runner: {
    timeout: 30000,
    retries: 3,
    concurrency: 3, // Lower concurrency for LLM-as-judge
  },

  scorer: {
    strategy: 'llm-judge',
    threshold: 0.7,
    judgeModelId: 'gpt-4-turbo-preview',
    judgePrompt: `Evaluate the AI response on the following criteria:
1. Accuracy: Does it answer the question correctly?
2. Helpfulness: Is it helpful to the student?
3. Tone: Is it professional and supportive?
4. Citations: Does it cite sources when needed?

Provide a score from 0.0 to 1.0 and explain your reasoning.`,
  },

  datasets: {
    include: ['chat-general', 'chat-policy', 'chat-edge-cases'],
    categories: ['conversational'],
  },

  output: {
    format: 'markdown',
    verbose: true,
    showFailuresOnly: false,
    outputFile: './results/conversational-eval.md',
    includeMetadata: true,
  },

  baseline: {
    enabled: true,
    regressionThreshold: 0.1,
    failOnRegression: false,
  },
};

/**
 * Example configuration for RAG evaluation
 */
export const ragEvalConfig: EvalConfig = {
  name: 'RAG Pipeline Evaluation',
  description: 'Evaluate retrieval quality and answer accuracy',
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
    timeout: 45000, // Longer timeout for RAG pipeline
    retries: 2,
    concurrency: 3,
  },

  scorer: {
    strategy: 'semantic',
    threshold: 0.85,
  },

  datasets: {
    include: ['rag-retrieval', 'rag-accuracy'],
    categories: ['rag'],
  },

  output: {
    format: 'json',
    verbose: true,
    showFailuresOnly: false,
    outputFile: './results/rag-eval.json',
    includeMetadata: true,
  },

  baseline: {
    enabled: true,
    regressionThreshold: 0.05,
    failOnRegression: true,
  },
};

/**
 * Example configuration for model comparison
 */
export const modelComparisonConfig: EvalConfig = {
  name: 'Model Comparison',
  description: 'Compare performance of different models',
  version: '1.0.0',
  environment: 'development',

  models: [
    {
      provider: 'openai',
      modelId: 'gpt-4-turbo-preview',
      temperature: 0.0,
    },
    {
      provider: 'openai',
      modelId: 'gpt-3.5-turbo',
      temperature: 0.0,
    },
    {
      provider: 'anthropic',
      modelId: 'claude-3-opus-20240229',
      temperature: 0.0,
    },
    {
      provider: 'anthropic',
      modelId: 'claude-3-sonnet-20240229',
      temperature: 0.0,
    },
  ],

  runner: {
    timeout: 30000,
    retries: 3,
    concurrency: 10, // Higher concurrency for parallel model testing
  },

  scorer: {
    strategy: 'exact',
    threshold: 0.9,
  },

  datasets: {
    // Test on all datasets
  },

  output: {
    format: 'table',
    verbose: false,
    showFailuresOnly: false,
    outputFile: './results/model-comparison.json',
    includeMetadata: true,
  },

  baseline: {
    enabled: false,
  },
};
