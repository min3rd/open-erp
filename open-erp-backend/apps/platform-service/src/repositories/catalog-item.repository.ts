import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogItem, CatalogItemDocument } from '../schemas/catalog-item.schema';

export interface CatalogItemFilter {
  tenant_id: string;
  catalog_type?: string;
  status?: string;
  parent_id?: string;
}

export interface FindAllResult {
  items: CatalogItemDocument[];
  total: number;
}

@Injectable()
export class CatalogItemRepository {
  constructor(
    @InjectModel(CatalogItem.name)
    private readonly catalogItemModel: Model<CatalogItemDocument>,
  ) {}

  async create(data: Partial<CatalogItem>): Promise<CatalogItemDocument> {
    const item = new this.catalogItemModel(data);
    return item.save();
  }

  async findById(id: string, tenantId: string): Promise<CatalogItemDocument | null> {
    return this.catalogItemModel
      .findOne({ _id: id, tenant_id: tenantId })
      .exec();
  }

  async findByTenantTypeCode(
    tenantId: string,
    catalogType: string,
    code: string,
  ): Promise<CatalogItemDocument | null> {
    return this.catalogItemModel
      .findOne({ tenant_id: tenantId, catalog_type: catalogType, code })
      .exec();
  }

  async findAll(
    filter: CatalogItemFilter,
    skip: number,
    limit: number,
  ): Promise<FindAllResult> {
    const query: Record<string, unknown> = { tenant_id: filter.tenant_id };

    if (filter.catalog_type) {
      query.catalog_type = filter.catalog_type;
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.parent_id !== undefined) {
      query.parent_id = filter.parent_id;
    }

    const [items, total] = await Promise.all([
      this.catalogItemModel
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.catalogItemModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async findAllByTenantAndType(
    tenantId: string,
    catalogType: string,
    codes?: string[],
  ): Promise<CatalogItemDocument[]> {
    const query: Record<string, unknown> = {
      tenant_id: tenantId,
      catalog_type: catalogType,
      status: 'active',
    };

    if (codes && codes.length > 0) {
      query.code = { $in: codes };
    }

    return this.catalogItemModel.find(query).exec();
  }

  async updateById(
    id: string,
    tenantId: string,
    update: Partial<CatalogItem>,
  ): Promise<CatalogItemDocument | null> {
    return this.catalogItemModel
      .findOneAndUpdate(
        { _id: id, tenant_id: tenantId },
        { $set: update },
        { new: true },
      )
      .exec();
  }

  async bulkUpdatePublishedAt(
    tenantId: string,
    ids: string[],
    publishedAt: Date,
  ): Promise<void> {
    await this.catalogItemModel
      .updateMany(
        { _id: { $in: ids }, tenant_id: tenantId },
        { $set: { published_at: publishedAt }, $inc: { version: 1 } },
      )
      .exec();
  }

  async findTree(tenantId: string, catalogType?: string): Promise<CatalogItemDocument[]> {
    const matchStage: Record<string, unknown> = { tenant_id: tenantId };
    if (catalogType) {
      matchStage.catalog_type = catalogType;
    }

    return this.catalogItemModel
      .aggregate([
        { $match: matchStage },
        {
          $graphLookup: {
            from: 'catalog_items',
            startWith: '$_id',
            connectFromField: '_id',
            connectToField: 'parent_id',
            as: 'children',
            restrictSearchWithMatch: { tenant_id: tenantId },
          },
        },
        { $match: { parent_id: null } },
      ])
      .exec();
  }
}
