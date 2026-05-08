import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CatalogItemService } from '../services/catalog-item.service';
import {
  CreateCatalogItemDto,
  UpdateCatalogItemDto,
  PublishCatalogItemDto,
  QueryCatalogItemDto,
} from '../dto/catalog-item.dto';
import { created, updated, deleted, fetched, paginated } from '@shared/response';
import { JwtAuthGuard } from '@shared/authz';
import { PermissionsGuard } from '@shared/authz/permissions.guard';
import { CurrentUser } from '@shared/authz/current-user.decorator';
import type { UserContext } from '@shared/authz/permissions.guard';
import { CatalogType } from '../schemas/catalog-item.schema';

@ApiTags('catalog-items')
@Controller({ path: 'platform/catalog-items', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CatalogItemController {
  constructor(private readonly catalogItemService: CatalogItemService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo mới catalog item' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'Code đã tồn tại trong tenant' })
  async create(
    @CurrentUser() currentUser: UserContext,
    @Body() dto: CreateCatalogItemDto,
  ) {
    const tenantId = currentUser.organizationId ?? '';
    const item = await this.catalogItemService.create(tenantId, dto, currentUser.userId);
    return created(item, 'Tạo catalog item thành công');
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách catalog items (có phân trang)' })
  @ApiResponse({ status: 200, description: 'Danh sách catalog items' })
  async findAll(
    @CurrentUser() currentUser: UserContext,
    @Query() query: QueryCatalogItemDto,
  ) {
    const tenantId = currentUser.organizationId ?? '';
    const result = await this.catalogItemService.findAll(tenantId, query);
    return paginated(result.items, result.page, result.limit, result.total);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Lấy cây phân cấp catalog items theo parent_id' })
  @ApiQuery({ name: 'catalogType', enum: CatalogType, required: false })
  async getTree(
    @CurrentUser() currentUser: UserContext,
    @Query('catalogType') catalogType?: string,
  ) {
    const tenantId = currentUser.organizationId ?? '';
    const tree = await this.catalogItemService.getTree(tenantId, catalogType);
    return fetched(tree, 'Lấy cây catalog item thành công');
  }

  @Post('publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish catalog items (phát event + tăng version)' })
  @ApiResponse({ status: 200, description: 'Publish thành công' })
  async publish(
    @CurrentUser() currentUser: UserContext,
    @Body() dto: PublishCatalogItemDto,
  ) {
    const tenantId = currentUser.organizationId ?? '';
    const result = await this.catalogItemService.publish(
      tenantId,
      dto,
      currentUser.userId,
    );
    return fetched(result, `Đã publish ${result.count} catalog item(s)`);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một catalog item' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId của catalog item' })
  @ApiResponse({ status: 200, description: 'Chi tiết catalog item' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findOne(
    @CurrentUser() currentUser: UserContext,
    @Param('id') id: string,
  ) {
    const tenantId = currentUser.organizationId ?? '';
    const item = await this.catalogItemService.findOne(tenantId, id);
    return fetched(item, 'Lấy catalog item thành công');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật catalog item (tự động tăng version)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId của catalog item' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async update(
    @CurrentUser() currentUser: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateCatalogItemDto,
  ) {
    const tenantId = currentUser.organizationId ?? '';
    const item = await this.catalogItemService.update(tenantId, id, dto);
    return updated(item, 'Cập nhật catalog item thành công');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm catalog item (set status=inactive)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId của catalog item' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async softDelete(
    @CurrentUser() currentUser: UserContext,
    @Param('id') id: string,
  ) {
    const tenantId = currentUser.organizationId ?? '';
    await this.catalogItemService.softDelete(tenantId, id, currentUser.userId);
    return deleted('Xóa catalog item thành công');
  }
}
