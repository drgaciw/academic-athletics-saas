/**
 * Regression tests for compare CLI command behavior
 */

const mockGetRuns = jest.fn();
const mockWriteFile = jest.fn();

jest.mock('fs/promises', () => ({
  writeFile: mockWriteFile,
  mkdir: jest.fn(),
}));

jest.mock('@aah/database', () => ({
  prisma: {},
}), { virtual: true });

jest.mock('../../db/repository', () => ({
  createEvalRepository: jest.fn(() => ({
    getRuns: mockGetRuns,
  })),
}));

jest.mock('../../config/parser', () => ({
  loadConfig: jest.fn(async () => ({
    datasets: {},
  })),
}));

jest.mock('../utils', () => ({
  section: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  spinner: jest.fn(() => ({ succeed: jest.fn(), fail: jest.fn() })),
  formatTable: jest.fn(() => 'ASCII_TABLE'),
  summaryBox: jest.fn(),
  logError: jest.fn(),
  colorScore: jest.fn((value: unknown) => String(value)),
  formatDuration: jest.fn((value: unknown) => String(value)),
  formatCost: jest.fn((value: unknown) => String(value)),
  formatPercent: jest.fn((value: number) => `${(value * 100).toFixed(2)}%`),
  writeOutputFile: jest.fn((path: string, content: string) => mockWriteFile(path, content, 'utf-8')),
}));

import { buildMockComparisonResults, createCompareCommand } from '../commands/compare';

function makeComparisonRun(id: string, modelId: string, accuracy: number, avgLatencyMs: number, totalCost: number, passedTests: number, totalTests = 100) {
  return {
    id,
    modelId,
    datasetId: 'compliance-full',
    startTime: new Date('2026-04-18T15:02:26Z'),
    metrics: {
      accuracy,
      passRate: passedTests / totalTests,
      avgLatencyMs,
      totalCost,
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      avgScore: accuracy,
    },
  };
}

describe('compare CLI command', () => {
  beforeEach(() => {
    mockGetRuns.mockReset();
    mockWriteFile.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should build comparison results only for the models passed on the command line', () => {
    const models = ['gpt-4-turbo', 'claude-3-opus'];

    const results = buildMockComparisonResults(models);

    expect(results.models).toHaveLength(2);
    expect(results.models.map((model) => model.id)).toEqual(models);
  });

  it('renders markdown table output when --format markdown is requested', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const command = createCompareCommand();

    await command.parseAsync([
      'node',
      'compare',
      '--models',
      'gpt-4-turbo',
      'claude-3-opus',
      '--format',
      'markdown',
    ], { from: 'node' });

    const output = consoleSpy.mock.calls.map((call) => String(call[0])).join('\n');

    expect(output).toContain('## Comparison Results');
    expect(output).toContain('| Model | Accuracy | Pass Rate | Avg Latency | Total Cost | Winner |');
    expect(output).toContain('| gpt-4-turbo |');
    expect(output).toContain('| claude-3-opus |');
    expect(output).not.toContain('ASCII_TABLE');
  });

  it('loads latest completed runs from the repository for the selected dataset and models when available', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const command = createCompareCommand();

    mockGetRuns
      .mockResolvedValueOnce({ runs: [makeComparisonRun('run-openai', 'gpt-4-turbo', 0.91, 1200, 0.44, 89)], total: 1 })
      .mockResolvedValueOnce({ runs: [makeComparisonRun('run-anthropic', 'claude-3-opus', 0.94, 980, 0.52, 93)], total: 1 });

    await command.parseAsync([
      'node',
      'compare',
      '--models',
      'gpt-4-turbo',
      'claude-3-opus',
      '--dataset',
      'compliance-full',
      '--format',
      'markdown',
    ], { from: 'node' });

    const output = consoleSpy.mock.calls.map((call) => String(call[0])).join('\n');

    expect(mockGetRuns).toHaveBeenNthCalledWith(1, { datasetId: 'compliance-full', modelId: 'gpt-4-turbo', status: 'completed' }, 1, 0);
    expect(mockGetRuns).toHaveBeenNthCalledWith(2, { datasetId: 'compliance-full', modelId: 'claude-3-opus', status: 'completed' }, 1, 0);
    expect(output).toContain('| gpt-4-turbo | 91.00% | 89.00% | 1200 | 0.44 |  |');
    expect(output).toContain('| claude-3-opus | 94.00% | 93.00% | 980 | 0.52 | 🏆 |');
    expect(output).not.toContain('| gpt-4-turbo | 92.00% | 90.00% | 1.23s | $0.4500 |  |');
  });

  it('writes markdown comparison output to the requested file', async () => {
    const command = createCompareCommand();

    mockGetRuns
      .mockResolvedValueOnce({ runs: [makeComparisonRun('run-openai', 'gpt-4-turbo', 0.91, 1200, 0.44, 89)], total: 1 })
      .mockResolvedValueOnce({ runs: [makeComparisonRun('run-anthropic', 'claude-3-opus', 0.94, 980, 0.52, 93)], total: 1 });

    await command.parseAsync([
      'node',
      'compare',
      '--models',
      'gpt-4-turbo',
      'claude-3-opus',
      '--dataset',
      'compliance-full',
      '--format',
      'markdown',
      '--output',
      '/tmp/ai-evals-compare.md',
    ], { from: 'node' });

    expect(mockWriteFile).toHaveBeenCalledWith(
      '/tmp/ai-evals-compare.md',
      expect.stringContaining('## Comparison Results'),
      'utf-8'
    );
  });
});
