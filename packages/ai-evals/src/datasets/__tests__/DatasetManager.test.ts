import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { z } from 'zod';
import { DatasetManager } from '../DatasetManager';

describe('DatasetManager', () => {
  let datasetsDir: string;

  beforeEach(async () => {
    datasetsDir = await mkdtemp(join(tmpdir(), 'aah-datasets-'));
  });

  afterEach(async () => {
    await rm(datasetsDir, { recursive: true, force: true });
  });

  it('reloads persisted dataset timestamps as Date instances', async () => {
    const manager = new DatasetManager(datasetsDir);
    const created = await manager.createDataset({
      name: 'General Regression',
      description: 'Dataset reload regression coverage',
      schema: {
        input: z.object({ prompt: z.string() }),
        output: z.object({ answer: z.string() }),
      },
    });

    const loaded = await manager.loadDataset(created.id, { validate: false });

    expect(loaded.createdAt).toBeInstanceOf(Date);
    expect(loaded.updatedAt).toBeInstanceOf(Date);
    expect(loaded.createdAt.toISOString()).toBe(created.createdAt.toISOString());
  });
});
