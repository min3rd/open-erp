/**
 * Unit tests for SeedStateTracker
 */

import { SeedStateTracker } from '../utils/seed-state';
import type { SeedStats } from '../utils/seed-utils';

describe('SeedStateTracker', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const baseStats: SeedStats = {
    total: 10,
    inserted: 8,
    updated: 1,
    skipped: 1,
    errors: 0,
  };

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  describe('hasRun', () => {
    it('should return true when seed metadata exists', async () => {
      process.env.NODE_ENV = 'test';
      const tracker = new SeedStateTracker();
      const mockFindOne = jest.fn().mockResolvedValue({ _id: 'exists' });
      (tracker as any).model = { findOne: mockFindOne };

      await expect(tracker.hasRun('seed-users', '1.2.0')).resolves.toBe(true);
      expect(mockFindOne).toHaveBeenCalledWith({
        name: 'seed-users',
        version: '1.2.0',
        environment: 'test',
      });
    });

    it('should return false when seed metadata is missing', async () => {
      process.env.NODE_ENV = 'development';
      const tracker = new SeedStateTracker();
      const mockFindOne = jest.fn().mockResolvedValue(null);
      (tracker as any).model = { findOne: mockFindOne };

      await expect(tracker.hasRun('seed-roles')).resolves.toBe(false);
      expect(mockFindOne).toHaveBeenCalledWith({
        name: 'seed-roles',
        version: '1.0.0',
        environment: 'development',
      });
    });

    it('should return false when query throws', async () => {
      process.env.NODE_ENV = 'test';
      const tracker = new SeedStateTracker();
      const mockFindOne = jest.fn().mockRejectedValue(new Error('db unavailable'));
      (tracker as any).model = { findOne: mockFindOne };

      await expect(tracker.hasRun('seed-navigation', '2.0.0')).resolves.toBe(false);
    });
  });

  describe('markComplete', () => {
    it('should upsert completion state with checksum', async () => {
      process.env.NODE_ENV = 'test';
      const tracker = new SeedStateTracker();
      const mockFindOneAndUpdate = jest.fn().mockResolvedValue({});
      (tracker as any).model = { findOneAndUpdate: mockFindOneAndUpdate };

      await tracker.markComplete(
        'seed-users',
        '1.0.1',
        baseStats,
        235,
        'checksum-abc',
      );

      expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1);
      const [filter, update, options] = mockFindOneAndUpdate.mock.calls[0];

      expect(filter).toEqual({
        name: 'seed-users',
        version: '1.0.1',
        environment: 'test',
      });
      expect(options).toEqual({ upsert: true, new: true });
      expect(update.$set).toMatchObject({
        name: 'seed-users',
        version: '1.0.1',
        duration: 235,
        stats: baseStats,
        environment: 'test',
        checksum: 'checksum-abc',
      });
      expect(update.$set.runAt).toBeInstanceOf(Date);
    });

    it('should upsert completion state without checksum', async () => {
      process.env.NODE_ENV = 'production';
      const tracker = new SeedStateTracker();
      const mockFindOneAndUpdate = jest.fn().mockResolvedValue({});
      (tracker as any).model = { findOneAndUpdate: mockFindOneAndUpdate };

      await tracker.markComplete('seed-roles', '1.0.0', baseStats, 120);

      const [, update] = mockFindOneAndUpdate.mock.calls[0];
      expect(update.$set.checksum).toBeUndefined();
      expect(update.$set.environment).toBe('production');
    });
  });
});
