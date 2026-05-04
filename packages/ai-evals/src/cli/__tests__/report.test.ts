/**
 * Regression tests for report CLI command behavior
 */

const mockGetRun = jest.fn();
const mockGetRuns = jest.fn();
const mockGetActiveBaseline = jest.fn();
const mockCompareToBaseline = jest.fn();
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
    getRun: mockGetRun,
    getRuns: mockGetRuns,
    getActiveBaseline: mockGetActiveBaseline,
    compareToBaseline: mockCompareToBaseline,
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
  colorStatus: jest.fn((value: unknown) => String(value)),
  formatDuration: jest.fn((value: number) => `${value}ms`),
  formatCost: jest.fn((value: number) => `$${value.toFixed(4)}`),
  formatTimestamp: jest.fn(() => '2026-04-18 15:02:26'),
  formatPercent: jest.fn((value: number) => `${(value * 100).toFixed(2)}%`),
  divider: jest.fn(),
  box: jest.fn(),
  writeOutputFile: jest.fn((path: string, content: string) => mockWriteFile(path, content, 'utf-8')),
}));

import { createReportCommand } from '../commands/report';

function makeRun(id: string, modelId: string) {
  return {
    id,
    datasetId: 'compliance-full',
    datasetName: 'Compliance Full',
    modelId,
    startTime: new Date('2026-04-18T15:02:26Z'),
    durationMs: 187500,
    metrics: {
      accuracy: 0.896,
      avgLatencyMs: 1456,
      totalCost: 1.23,
      totalTests: 125,
      passedTests: 112,
      failedTests: 13,
      avgScore: 0.81,
    },
    results: [
      {
        testCaseId: 'compliance-045',
        passed: false,
        expected: 'eligible',
        actual: 'review_required',
        explanation: 'Model incorrectly flagged edge case',
        metadata: { category: 'progress-toward-degree' },
      },
      {
        testCaseId: 'compliance-078',
        passed: false,
        expected: 'ineligible',
        actual: 'eligible',
        explanation: 'GPA rounding error',
        metadata: { category: 'gpa-calculation' },
      },
      {
        testCaseId: 'compliance-012',
        passed: true,
        expected: 'eligible',
        actual: 'eligible',
        explanation: 'Correct',
        metadata: { category: 'initial-eligibility' },
      },
    ],
  };
}

describe('report CLI command', () => {
  beforeEach(() => {
    mockGetRun.mockReset();
    mockGetRuns.mockReset();
    mockGetActiveBaseline.mockReset();
    mockCompareToBaseline.mockReset();
    mockWriteFile.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads the requested run from the repository and includes baseline comparison when requested', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const command = createReportCommand();
    const currentRun = makeRun('test123', 'gpt-4-turbo-preview');

    mockGetRun.mockResolvedValue(currentRun);
    mockGetActiveBaseline.mockResolvedValue({ id: 'baseline-1', runId: 'baseline-run-1' });
    mockCompareToBaseline.mockResolvedValue({
      baseline: makeRun('baseline-run-1', 'gpt-4-turbo-preview'),
      current: currentRun,
      differences: {
        accuracyDelta: 0.024,
        scoreDelta: 0.03,
        latencyDelta: -164,
        costDelta: 0.05,
      },
      regressions: [
        {
          testCaseId: 'overall',
          metric: 'cost',
          baseline: 1.18,
          current: 1.23,
          percentChange: 4.2,
          severity: 'minor',
        },
      ],
    });

    await command.parseAsync([
      'node',
      'report',
      '--run-id',
      'test123',
      '--compare-baseline',
    ], { from: 'node' });

    const output = consoleSpy.mock.calls.map((call) => String(call[0])).join('\n');

    expect(mockGetRun).toHaveBeenCalledWith('test123');
    expect(mockGetActiveBaseline).toHaveBeenCalledWith('compliance-full');
    expect(mockCompareToBaseline).toHaveBeenCalledWith('test123', 'baseline-1');
    expect(output).toContain('**Run ID:** test123');
    expect(output).toContain('| compliance-045 | progress-toward-degree | eligible | review_required | Model incorrectly flagged edge case |');
    expect(output).toContain('## Baseline Comparison');
    expect(output).toContain('Baseline Run ID: baseline-run-1');
  });

  it('writes JSON report output to the requested file', async () => {
    const command = createReportCommand();
    const currentRun = makeRun('test123', 'gpt-4-turbo-preview');

    mockGetRun.mockResolvedValue(currentRun);
    mockGetActiveBaseline.mockResolvedValue({ id: 'baseline-1', runId: 'baseline-run-1' });
    mockCompareToBaseline.mockResolvedValue({
      baseline: makeRun('baseline-run-1', 'gpt-4-turbo-preview'),
      current: currentRun,
      differences: {
        accuracyDelta: 0.024,
        scoreDelta: 0.03,
        latencyDelta: -164,
        costDelta: 0.05,
      },
      regressions: [],
    });

    await command.parseAsync([
      'node',
      'report',
      '--run-id',
      'test123',
      '--compare-baseline',
      '--format',
      'json',
      '--output',
      '/tmp/ai-evals-report.json',
    ], { from: 'node' });

    expect(mockWriteFile).toHaveBeenCalledWith(
      '/tmp/ai-evals-report.json',
      expect.stringContaining('"baselineComparison"'),
      'utf-8'
    );
  });
});
