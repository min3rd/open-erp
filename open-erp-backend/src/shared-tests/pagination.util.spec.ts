import { paginate } from '../../libs/shared/database/utils/pagination.util';

describe('paginate', () => {
  it('returns pagination metadata correctly', async () => {
    const lean = jest.fn().mockResolvedValue([{ id: 11 }, { id: 12 }]);
    const limit = jest.fn().mockReturnValue({ lean });
    const skip = jest.fn().mockReturnValue({ limit });
    const sort = jest.fn().mockReturnValue({ skip });
    const find = jest.fn().mockReturnValue({ sort });
    const countDocuments = jest.fn().mockResolvedValue(25);

    const model = {
      countDocuments,
      find,
    } as any;

    const result = await paginate(
      model,
      {},
      { page: 2, limit: 10, sortBy: 'name', sortOrder: 'asc' },
    );

    expect(countDocuments).toHaveBeenCalledWith({});
    expect(sort).toHaveBeenCalledWith({ name: 1 });
    expect(skip).toHaveBeenCalledWith(10);
    expect(limit).toHaveBeenCalledWith(10);
    expect(result.meta).toEqual({
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    });
    expect(result.data).toEqual([{ id: 11 }, { id: 12 }]);
  });
});
