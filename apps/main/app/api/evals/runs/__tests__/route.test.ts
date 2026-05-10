
import { GET } from '../route';
import { prisma } from '@aah/database';
import { currentUser } from '@clerk/nextjs';

// Mock the prisma client
jest.mock('@aah/database', () => ({
  prisma: {
    evalRun: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@clerk/nextjs', () => ({
  currentUser: jest.fn(),
}));

describe('GET /api/evals/runs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (currentUser as jest.Mock).mockResolvedValue({
      publicMetadata: { role: 'ADMIN' },
    });
  });

  it('rejects unauthenticated requests before querying eval runs', async () => {
    (currentUser as jest.Mock).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
    expect(prisma.evalRun.findMany).not.toHaveBeenCalled();
  });

  it('rejects non-admin requests before querying eval runs', async () => {
    (currentUser as jest.Mock).mockResolvedValue({
      publicMetadata: { role: 'STUDENT' },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
    expect(prisma.evalRun.findMany).not.toHaveBeenCalled();
  });

  it('returns formatted eval runs from database', async () => {
    const mockDate = new Date('2024-01-01T00:00:00.000Z');
    const mockDbRuns = [
      {
        id: 'run-1',
        datasetId: 'dataset-1',
        datasetName: 'Test Dataset',
        modelId: 'gpt-4',
        status: 'completed',
        createdAt: mockDate,
        metrics: {
          accuracy: 0.95,
          passRate: 0.95,
          totalTests: 100,
          totalCost: 1.5,
          avgLatencyMs: 500,
        },
      },
      {
        id: 'run-2',
        datasetId: 'dataset-2',
        datasetName: null, // Test fallback
        modelId: 'gpt-3.5',
        status: 'running',
        createdAt: mockDate,
        metrics: null, // Test missing metrics
      },
    ];

    (prisma.evalRun.findMany as jest.Mock).mockResolvedValue(mockDbRuns);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.runs).toHaveLength(2);

    expect(data.runs[0]).toEqual({
      id: 'run-1',
      datasetId: 'dataset-1',
      datasetName: 'Test Dataset',
      modelId: 'gpt-4',
      status: 'completed',
      accuracy: 0.95,
      passRate: 0.95,
      totalTests: 100,
      totalCost: 1.5,
      avgLatency: 500,
      createdAt: mockDate.toISOString(),
      hasRegressions: false,
      regressionCount: 0,
    });

    expect(data.runs[1]).toEqual({
      id: 'run-2',
      datasetId: 'dataset-2',
      datasetName: 'Unknown Dataset',
      modelId: 'gpt-3.5',
      status: 'running',
      accuracy: 0,
      passRate: 0,
      totalTests: 0,
      totalCost: 0,
      avgLatency: 0,
      createdAt: mockDate.toISOString(),
      hasRegressions: false,
      regressionCount: 0,
    });

    expect(prisma.evalRun.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      include: { metrics: true },
      take: 100,
    });
  });

  it('handles database errors', async () => {
    (prisma.evalRun.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

    // Mock console.error to avoid polluting test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch eval runs');

    consoleSpy.mockRestore();
  });
});
