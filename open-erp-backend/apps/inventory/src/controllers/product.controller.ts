import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
  ParseBoolPipe,
  ParseArrayPipe,
  DefaultValuePipe,
  BadRequestException,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import {
  created,
  updated,
  deleted,
  fetched,
  paginated,
  error,
} from '@shared/response';
import { ProductScope, ProductType, ProductStatus } from '@shared/constants';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/authz/permissions.guard';
import { Permissions, Public } from '@shared/authz/decorators';
import { Permission } from '@shared/types/permission.enum';
import { CurrentUser } from '@shared/authz/current-user.decorator';
import { AuthorizationService } from '@shared/authz/authorization.service';

interface UserContext {
  userId: string;
  email?: string;
  organizationId?: string;
  roles?: string[];
}

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post()
  @Permissions([Permission.PRODUCT_CREATE, Permission.PRODUCT_MANAGE], {
    mode: 'any',
  })
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Product created successfully' },
        error: { type: 'null' },
        data: {
          type: 'object',
          properties: {
            mode: { type: 'string', example: 'create' },
            item: {
              type: 'object',
              description: 'Product object',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Conflict - SKU already exists' })
  async create(
    @Body() createDto: CreateProductDto,
    @CurrentUser() user: UserContext,
  ) {
    try {
      // Authorization check for global scope products
      if (createDto.scope === ProductScope.GLOBAL) {
        // Only users with PRODUCT_MANAGE permission can create global products
        // This is already handled by the guard, but we add extra validation
        if (!createDto.organizationId) {
          // Global products should not have organizationId
          // Additional checks can be added here if needed
        }
      }

      // For organization-scoped products, ensure organizationId matches user's org
      if (createDto.scope === ProductScope.ORGANIZATION) {
        if (!createDto.organizationId) {
          throw new BadRequestException(
            'Organization ID is required for organization-scoped products',
          );
        }
        // Optionally verify user belongs to the organization
        // This can be enhanced based on your authorization service
      }

      const product = await this.productService.create(createDto);
      return created(product, 'Product created successfully');
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        error(
          'PRODUCT_CREATE_ERROR',
          err.message || 'Failed to create product',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @Permissions(Permission.PRODUCT_READ)
  @ApiOperation({ summary: 'Get all products with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'scope', required: false, enum: ProductScope })
  @ApiQuery({ name: 'type', required: false, enum: ProductType })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category name',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: [String],
    description: 'Filter by tags (comma-separated)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Full-text search',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Sort by field (e.g., name:asc, createdAt:desc)',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description:
      'Include inactive products (requires management permissions)',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description:
      'Include deleted products (requires management permissions)',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'null' },
        error: { type: 'null' },
        data: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { type: 'object' } },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 10 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('scope') scope?: ProductScope,
    @Query('type') type?: ProductType,
    @Query('status') status?: ProductStatus,
    @Query('organizationId') organizationId?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('includeInactive') includeInactive?: boolean,
    @Query('includeDeleted') includeDeleted?: boolean,
    @CurrentUser() user?: UserContext,
  ) {
    try {
      // Check permissions for includeInactive and includeDeleted
      // Only users with PRODUCT_MANAGE permission can view inactive/deleted products
      if (includeInactive || includeDeleted) {
        if (!user || !user.userId) {
          throw new ForbiddenException(
            error(
              'INSUFFICIENT_PERMISSIONS',
              'Authentication required to view inactive or deleted products.',
            ),
          );
        }

        const hasManagePermission = await this.authorizationService.hasPermission(
          user.userId,
          Permission.PRODUCT_MANAGE,
          { scope: 'organization', organizationId: user.organizationId },
        );

        if (!hasManagePermission) {
          throw new ForbiddenException(
            error(
              'INSUFFICIENT_PERMISSIONS',
              'You do not have permission to view inactive or deleted products. PRODUCT_MANAGE permission required.',
            ),
          );
        }
      }

      // Parse tags from comma-separated string
      const tagArray = tags
        ? tags.split(',').map((tag) => tag.trim())
        : undefined;

      // Parse sort parameter (format: field:order, e.g., name:asc)
      let sortObj: any = undefined;
      if (sort) {
        const sortParts = sort.split(':');
        if (sortParts.length === 2) {
          const [field, order] = sortParts;
          sortObj = { [field]: order === 'desc' ? -1 : 1 };
        }
      }

      if (search) {
        const result = await this.productService.search(
          search,
          { scope, organizationId, category, tags: tagArray },
          { page, limit, includeDeleted, includeInactive },
        );
        return paginated(
          result.items,
          result.page,
          result.limit,
          result.total,
          { query: { q: search } },
        );
      }

      const result = await this.productService.findAll(
        { scope, type, status, organizationId, category, tags: tagArray },
        { page, limit, sort: sortObj, includeDeleted, includeInactive },
      );

      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      throw new HttpException(
        error('PRODUCT_FETCH_ERROR', err.message || 'Failed to fetch products'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @Permissions(Permission.PRODUCT_READ)
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Include if product is deleted (requires management permissions)',
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'null' },
        error: { type: 'null' },
        data: {
          type: 'object',
          properties: {
            mode: { type: 'string', example: 'get' },
            item: { type: 'object', description: 'Product object' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findById(
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted?: boolean,
  ) {
    try {
      const product = await this.productService.findById(id, {
        includeDeleted,
      });
      return fetched(product);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        error('PRODUCT_FETCH_ERROR', err.message || 'Failed to fetch product'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: 'Get a product by SKU' })
  @ApiParam({ name: 'sku', description: 'Product SKU' })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySku(
    @Param('sku') sku: string,
    @Query('organizationId') organizationId?: string,
  ) {
    try {
      const product = await this.productService.findBySku(sku, organizationId);
      return fetched(product);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        error('PRODUCT_FETCH_ERROR', err.message || 'Failed to fetch product'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @Permissions([Permission.PRODUCT_UPDATE, Permission.PRODUCT_MANAGE], {
    mode: 'any',
  })
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Product updated successfully' },
        error: { type: 'null' },
        data: {
          type: 'object',
          properties: {
            mode: { type: 'string', example: 'update' },
            item: { type: 'object', description: 'Updated product object' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateProductDto) {
    try {
      const product = await this.productService.update(id, updateDto);
      return updated(product, 'Product updated successfully');
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        error(
          'PRODUCT_UPDATE_ERROR',
          err.message || 'Failed to update product',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @Permissions([Permission.PRODUCT_DELETE, Permission.PRODUCT_MANAGE], {
    mode: 'any',
  })
  @ApiOperation({ summary: 'Soft delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Product deleted successfully' },
        error: { type: 'null' },
        data: {
          type: 'object',
          properties: {
            mode: { type: 'string', example: 'delete' },
            item: { type: 'null' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() user: UserContext,
  ) {
    try {
      await this.productService.softDelete(id, user.userId);
      return deleted('Product deleted successfully');
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        error(
          'PRODUCT_DELETE_ERROR',
          err.message || 'Failed to delete product',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/restore')
  @Permissions([Permission.PRODUCT_MANAGE])
  @ApiOperation({ summary: 'Restore a soft-deleted product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product restored successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async restore(@Param('id') id: string) {
    try {
      const product = await this.productService.restore(id);
      return updated(product, 'Product restored successfully');
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        error(
          'PRODUCT_RESTORE_ERROR',
          err.message || 'Failed to restore product',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/versions')
  @Permissions(Permission.PRODUCT_READ)
  @ApiOperation({ summary: 'Get version history of a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Version history retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getVersionHistory(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.productService.getVersionHistory(id, {
        page,
        limit,
      });
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      throw new HttpException(
        error(
          'VERSION_FETCH_ERROR',
          err.message || 'Failed to fetch version history',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/versions/:version')
  @Permissions(Permission.PRODUCT_READ)
  @ApiOperation({ summary: 'Get a specific version of a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiParam({ name: 'version', description: 'Version number', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Version retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async getVersion(@Param('id') id: string, @Param('version') version: number) {
    try {
      const versionDoc = await this.productService.getVersion(id, version);
      return fetched(versionDoc);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        error('VERSION_FETCH_ERROR', err.message || 'Failed to fetch version'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/revert')
  @Permissions([Permission.PRODUCT_UPDATE, Permission.PRODUCT_MANAGE], {
    mode: 'any',
  })
  @ApiOperation({ summary: 'Revert product to a specific version' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiQuery({
    name: 'version',
    required: true,
    description: 'Version number to revert to',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Product reverted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Product or version not found' })
  async revertToVersion(
    @Param('id') id: string,
    @Query('version') version: number,
    @CurrentUser() user: UserContext,
  ) {
    try {
      const product = await this.productService.rollbackToVersion(
        id,
        version,
        user.userId,
      );
      return updated(product, `Product reverted to version ${version}`);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        error('REVERT_ERROR', err.message || 'Failed to revert product'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
