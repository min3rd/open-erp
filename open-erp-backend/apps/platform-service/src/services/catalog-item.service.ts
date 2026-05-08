import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { CatalogItemRepository } from '../repositories/catalog-item.repository';
import {
  CreateCatalogItemDto,
  UpdateCatalogItemDto,
  PublishCatalogItemDto,
  QueryCatalogItemDto,
} from '../dto/catalog-item.dto';
import { CatalogItemDocument, CatalogItemStatus } from '../schemas/catalog-item.schema';
import { RABBITMQ_PLATFORM_CLIENT } from '../constants/rabbitmq.constants';

export interface FindAllResult {
  items: CatalogItemDocument[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class CatalogItemService {
  private readonly logger = new Logger(CatalogItemService.name);

  constructor(
    private readonly catalogItemRepository: CatalogItemRepository,
    @Inject(RABBITMQ_PLATFORM_CLIENT)
    private readonly rabbitMQClient: ClientProxy,
  ) {}

  async create(
    tenantId: string,
    dto: CreateCatalogItemDto,
    userId: string,
  ): Promise<CatalogItemDocument> {
    this.logger.log(
      `[${tenantId}] Creating catalog item: type=${dto.catalogType}, code=${dto.code}`,
    );

    const existing = await this.catalogItemRepository.findByTenantTypeCode(
      tenantId,
      dto.catalogType,
      dto.code,
    );

    if (existing) {
      throw new ConflictException(
        `Catalog item với catalog_type='${dto.catalogType}' và code='${dto.code}' đã tồn tại trong tenant này`,
      );
    }

    return this.catalogItemRepository.create({
      tenant_id: tenantId,
      org_id: dto.orgId ?? null,
      catalog_type: dto.catalogType,
      code: dto.code,
      name: dto.name,
      parent_id: dto.parentId ?? null,
      metadata: dto.metadata ?? null,
      status: dto.status ?? CatalogItemStatus.ACTIVE,
      version: 1,
      published_at: null,
      created_by: userId,
      updated_by: userId,
    });
  }

  async findAll(
    tenantId: string,
    query: QueryCatalogItemDto,
  ): Promise<FindAllResult> {
    this.logger.log(`[${tenantId}] Listing catalog items: page=${query.page}, limit=${query.limit}`);

    const skip = (query.page - 1) * query.limit;
    const { items, total } = await this.catalogItemRepository.findAll(
      {
        tenant_id: tenantId,
        catalog_type: query.catalogType,
        status: query.status,
        parent_id: query.parentId,
      },
      skip,
      query.limit,
    );

    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(tenantId: string, id: string): Promise<CatalogItemDocument> {
    this.logger.log(`[${tenantId}] Finding catalog item: id=${id}`);

    const item = await this.catalogItemRepository.findById(id, tenantId);
    if (!item) {
      throw new NotFoundException(
        `Catalog item với id='${id}' không tìm thấy trong tenant này`,
      );
    }

    return item;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCatalogItemDto,
  ): Promise<CatalogItemDocument> {
    this.logger.log(`[${tenantId}] Updating catalog item: id=${id}`);

    const existing = await this.catalogItemRepository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundException(
        `Catalog item với id='${id}' không tìm thấy trong tenant này`,
      );
    }

    const updateData: Record<string, unknown> = {
      updated_by: dto.updatedBy,
      updated_at: new Date(),
      version: existing.version + 1,
    };

    if (dto.catalogType !== undefined) updateData.catalog_type = dto.catalogType;
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.orgId !== undefined) updateData.org_id = dto.orgId;
    if (dto.parentId !== undefined) updateData.parent_id = dto.parentId;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;
    if (dto.status !== undefined) updateData.status = dto.status;

    const updated = await this.catalogItemRepository.updateById(id, tenantId, updateData as never);
    if (!updated) {
      throw new NotFoundException(
        `Không thể cập nhật catalog item với id='${id}'`,
      );
    }

    return updated;
  }

  async softDelete(tenantId: string, id: string, userId: string): Promise<CatalogItemDocument> {
    this.logger.log(`[${tenantId}] Soft-deleting catalog item: id=${id}`);

    const existing = await this.catalogItemRepository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundException(
        `Catalog item với id='${id}' không tìm thấy trong tenant này`,
      );
    }

    const updated = await this.catalogItemRepository.updateById(id, tenantId, {
      status: CatalogItemStatus.INACTIVE,
      updated_by: userId,
      updated_at: new Date(),
    } as never);

    if (!updated) {
      throw new NotFoundException(
        `Không thể xóa catalog item với id='${id}'`,
      );
    }

    return updated;
  }

  async publish(
    tenantId: string,
    dto: PublishCatalogItemDto,
    userId: string,
    traceId?: string,
  ): Promise<{ count: number }> {
    this.logger.log(
      `[${tenantId}] Publishing catalog items: type=${dto.catalogType}, codes=${dto.codes?.join(',') ?? 'all'}`,
    );

    const items = await this.catalogItemRepository.findAllByTenantAndType(
      tenantId,
      dto.catalogType,
      dto.codes,
    );

    if (items.length === 0) {
      return { count: 0 };
    }

    const publishedAt = new Date();
    const ids = items.map((item) => String(item._id));
    await this.catalogItemRepository.bulkUpdatePublishedAt(tenantId, ids, publishedAt);

    const eventPayload = {
      event_id: uuidv4(),
      event_type: 'erp.platform.catalog.item.updated.v1',
      occurred_at: publishedAt.toISOString(),
      tenant_id: tenantId,
      source: 'platform-service',
      trace_id: traceId ?? uuidv4(),
      data: {
        catalog_type: dto.catalogType,
        items: items.map((item) => ({
          id: String(item._id),
          code: item.code,
          name: item.name,
          version: item.version + 1,
        })),
      },
    };

    this.rabbitMQClient.emit('erp.platform.catalog.item.updated.v1', eventPayload);
    this.logger.log(
      `[${tenantId}] Published event for ${items.length} catalog items`,
    );

    return { count: items.length };
  }

  async getTree(
    tenantId: string,
    catalogType?: string,
  ): Promise<CatalogItemDocument[]> {
    this.logger.log(`[${tenantId}] Fetching catalog item tree: type=${catalogType ?? 'all'}`);
    return this.catalogItemRepository.findTree(tenantId, catalogType);
  }
}
