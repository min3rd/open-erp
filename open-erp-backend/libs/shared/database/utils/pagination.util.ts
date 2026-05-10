import { FilterQuery, Model, SortOrder } from 'mongoose';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function paginate<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options: PaginationOptions = {},
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const sortBy = options.sortBy ?? 'createdAt';
  const sortOrder: SortOrder = options.sortOrder === 'asc' ? 1 : -1;
  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    model.countDocuments(filter),
    model.find(filter).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit).lean(),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: data as T[],
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
