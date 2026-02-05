import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '@shared/schemas';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(productData: Partial<Product>): Promise<ProductDocument> {
    const product = new this.productModel(productData);
    return product.save();
  }

  async findById(
    id: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ProductDocument | null> {
    const query = this.productModel.findById(id);
    if (options?.includeDeleted) {
      query.setOptions({ includeDeleted: true });
    }
    return query.exec();
  }

  async findBySku(
    sku: string,
    organizationId?: string,
  ): Promise<ProductDocument | null> {
    const query: any = { sku };
    if (organizationId) {
      query.organizationId = new Types.ObjectId(organizationId);
    }
    return this.productModel.findOne(query).exec();
  }

  async findByBarcode(barcode: string): Promise<ProductDocument | null> {
    return this.productModel.findOne({ barcode }).exec();
  }

  async findAll(
    filter: any = {},
    options: {
      skip?: number;
      limit?: number;
      sort?: any;
      includeDeleted?: boolean;
      includeInactive?: boolean;
    } = {},
  ): Promise<{ items: ProductDocument[]; total: number }> {
    const {
      skip = 0,
      limit = 10,
      sort = { createdAt: -1 },
      includeDeleted = false,
      includeInactive = false,
    } = options;

    // Add active filter unless includeInactive is true
    // if (!includeInactive && !filter.status) {
    //   filter.status = 'active';
    // }

    const queryOptions: any = {};
    if (includeDeleted) {
      queryOptions.includeDeleted = true;
    }

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .setOptions(queryOptions)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).setOptions(queryOptions).exec(),
    ]);

    return { items, total };
  }

  async update(
    id: string,
    updateData: Partial<Product>,
  ): Promise<ProductDocument | null> {
    return this.productModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async softDelete(
    id: string,
    userId: string,
  ): Promise<ProductDocument | null> {
    return this.productModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            deletedAt: new Date(),
            deletedBy: new Types.ObjectId(userId),
            status: 'inactive',
          },
        },
        { new: true },
      )
      .exec();
  }

  async search(
    searchText: string,
    filter: any = {},
    options: {
      skip?: number;
      limit?: number;
      includeDeleted?: boolean;
      includeInactive?: boolean;
      sort?: any;
    } = {},
  ): Promise<{ items: ProductDocument[]; total: number }> {
    const {
      skip = 0,
      limit = 10,
      includeDeleted = false,
      includeInactive = false,
      sort,
    } = options;

    // Add active filter unless includeInactive is true
    // if (!includeInactive && !filter.status) {
    //   filter.status = 'active';
    // }

    // Escape special regex characters to prevent regex injection
    const escapeRegex = (str: string) => 
      str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedSearchText = escapeRegex(searchText);

    // Build partial match query for SKU, name, and barcode (case-insensitive)
    // Note: Regex queries can leverage indexes when using anchored prefix patterns (^pattern)
    // For partial matches anywhere in the string, full collection scans may occur.
    // SKU and barcode have indexes which can help with prefix matching.
    const searchRegex = new RegExp(escapedSearchText, 'i'); // case-insensitive regex
    
    const partialMatchQuery = {
      ...filter,
      $or: [
        { sku: searchRegex },
        { name: searchRegex },
        { internationalName: searchRegex },
        { barcode: searchRegex },
      ],
    };

    const queryOptions: any = {};
    if (includeDeleted) {
      queryOptions.includeDeleted = true;
    }

    // Build query with sort if provided
    let query = this.productModel
      .find(partialMatchQuery)
      .setOptions(queryOptions);

    if (sort) {
      query = query.sort(sort);
    }

    const [items, total] = await Promise.all([
      query.skip(skip).limit(limit).exec(),
      this.productModel
        .countDocuments(partialMatchQuery)
        .setOptions(queryOptions)
        .exec(),
    ]);

    return { items, total };
  }

  async incrementVersion(id: string): Promise<ProductDocument | null> {
    return this.productModel
      .findByIdAndUpdate(
        id,
        {
          $inc: { currentVersion: 1 },
          $set: { versionCreatedAt: new Date() },
        },
        { new: true },
      )
      .exec();
  }
}
