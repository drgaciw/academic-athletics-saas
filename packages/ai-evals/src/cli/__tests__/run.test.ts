/**
 * Regression tests for run CLI command output persistence behavior
 */

const mockLoadConfig = jest.fn();
const mockWriteFile = jest.fn();

jest.mock('../../config/parser', () => ({
  loadConfig: mockLoadConfig,
  ConfigValidationError: class ConfigValidationError extends Error {
    formatErrors() { return 'validation error'; }
  },
  ConfigParseError: class ConfigParseError extends Error {
    cause?: Error;
    constructor(message: string, cause?: Error) {
      super(message);
      this.cause = cause;
    }
  },
}));

jest.mock('fs/promises', () => ({
  writeFile: mockWriteFile,
  mkdir: jest.fn(),
}));

jest.mock('../interactive', () => ({
  interactiveMode: jest.fn(),
}));

jest.mock('../utils', () => ({
  displayBanner: jest.fn(),
  section: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  spinner: jest.fn(() => ({ succeed: jest.fn(), fail: jest.fn() })),
  formatTable: jest.fn(() => 'ASCII_TABLE'),
  summaryBox: jest.fn(),
  logError: jest.fn(),
  colorScore: jest.fn((value: unknown) => String(value)),
  colorStatus: jest.fn((value: unknown) => String(value)),
  formatDuration: jest.fn((value: unknown) => String(value)),
  formatCost: jest.fn((value: unknown) => String(value)),
  writeOutputFile: jest.fn((path: string, content: string) => mockWriteFile(path, content, 'utf-8')),
}));

import { createRunCommand } from '../commands/run';

function makeConfig() {
  return {
    name: 'Compliance Eval',
    environment: 'test',
    models: [{ provider: 'openai', modelId: 'gpt-4-turbo' }],
    datasets: { include: ['compliance-full'] },
    output: {
      format: 'table',
      verbose: false,
      outputFile: undefined,
    },
    baseline: {
      enabled: false,
      baselineId: undefined,
    },
    runner: {
      concurrency: 5,
    },
  };
}

describe('run CLI command', () => {
  beforeEach(() => {
    mockLoadConfig.mockReset();
    mockWriteFile.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('writes JSON results to the requested output file on the current execution path', async () => {
    mockLoadConfig.mockResolvedValue(makeConfig());
    const command = createRunCommand();

    await command.parseAsync([
      'node',
      'run',
      '--output',
      '/tmp/ai-evals-run.json',
      '--format',
      'json',
    ], { from: 'node' });

    expect(mockWriteFile).toHaveBeenCalledWith(
      '/tmp/ai-evals-run.json',
      expect.stringContaining('"runId"'),
      'utf-8'
    );
  });
});
