import { describe, it, expect, vi } from 'vitest'
import { RedisCacheStorage } from '../cache-manager'

describe('RedisCacheStorage', () => {
  it('should call flushdb on clear', async () => {
    const storage = new RedisCacheStorage();
    const mockFlushDb = vi.fn();
    // specific cast to any to inject the mock client
    (storage as any).client = {
      flushdb: mockFlushDb
    };

    await storage.clear();
    expect(mockFlushDb).toHaveBeenCalled();
  });

  it('should handle missing client gracefully', async () => {
     const storage = new RedisCacheStorage();
     // Should not throw even if client is missing (which it is by default)
     await storage.clear();
  });
});
