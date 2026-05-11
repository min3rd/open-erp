import { buildMongoFilter } from '../../libs/shared/database/utils/query-builder.util';

describe('buildMongoFilter', () => {
  it('builds equality and operator filters while skipping undefined values', () => {
    const result = buildMongoFilter({
      tenantId: 'tenant-1',
      status: { in: ['active', 'trial'] },
      createdAt: { gte: new Date('2026-01-01'), lte: new Date('2026-12-31') },
      page: undefined,
    });

    expect(result).toMatchObject({
      tenantId: 'tenant-1',
      status: { $in: ['active', 'trial'] },
      createdAt: {
        $gte: new Date('2026-01-01'),
        $lte: new Date('2026-12-31'),
      },
    });
    expect(result).not.toHaveProperty('page');
  });

  it('prefers eq over other operators when eq is provided', () => {
    const result = buildMongoFilter({
      quota: { eq: 20, gte: 10, lte: 30 },
    });

    expect(result).toEqual({ quota: 20 });
  });
});
