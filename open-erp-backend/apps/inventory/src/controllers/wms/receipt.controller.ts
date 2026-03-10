import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  HttpStatus,
  HttpException,
  UseGuards,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReceiptService } from '../../services/wms/receipt.service';
import {
  CreateReceiptDto,
  UpdateReceiptDto,
  SubmitReceiptDto,
  ReviewReceiptDto,
  ApproveReceiptDto,
  ReceiveReceiptDto,
  FinalizeReceiptDto,
  UnlockReceiptDto,
  QcReceiptDto,
  RequestUploadUrlDto,
} from '../../dto/wms/receipt.dto';
import { ReceiptStatus } from '@shared/schemas';
import { created, fetched, paginated, error, ok } from '@shared/response';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Permissions } from '@shared/authz/decorators';
import { Permission } from '@shared/types/permission.enum';
import { MinioService } from '@shared/services/minio/minio.service';

@ApiTags('wms-receipts')
@Controller('wms/receipts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReceiptController {
  constructor(
    private readonly receiptService: ReceiptService,
    @Inject(MinioService) private readonly minioService: MinioService,
  ) {}

  @Post()
  @Permissions(Permission.WMS_RECEIPT_CREATE)
  @ApiOperation({ summary: 'Create a new receipt (from PO or manual)' })
  @ApiResponse({ status: 201, description: 'Receipt created successfully' })
  async create(@Body() createDto: CreateReceiptDto, @Request() req: any) {
    try {
      const userId = req.user?.userId || req.user?.sub;
      const receipt = await this.receiptService.create(createDto, userId);
      return created(receipt, 'Receipt created successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_CREATE_ERROR', err.message || 'Failed to create receipt'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @Permissions(Permission.WMS_RECEIPT_READ)
  @ApiOperation({ summary: 'List receipts with filters, search and sort' })
  @ApiQuery({ name: 'orgId', required: false, type: String })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'poId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ReceiptStatus })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Text search (poId, supplier, notes)' })
  @ApiQuery({ name: 'sortField', required: false, type: String, description: 'Field to sort by (default: createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: Number, description: 'Sort direction: 1 asc, -1 desc (default: -1)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Receipts retrieved successfully' })
  async findAll(
    @Query('orgId') orgId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('poId') poId?: string,
    @Query('status') status?: ReceiptStatus,
    @Query('q') q?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const parsedSortOrder = sortOrder ? (parseInt(sortOrder as string, 10) as 1 | -1) : undefined;
      const result = await this.receiptService.findAll(
        { orgId, warehouseId, poId, status, q },
        { page, limit, sortField, sortOrder: parsedSortOrder },
      );
      return paginated(result.items, result.page, result.limit, result.total);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_FETCH_ERROR', err.message || 'Failed to fetch receipts'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @Permissions(Permission.WMS_RECEIPT_READ)
  @ApiOperation({ summary: 'Get receipt by ID' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Receipt retrieved successfully' })
  async findById(@Param('id') id: string) {
    try {
      const receipt = await this.receiptService.findById(id);
      return fetched(receipt);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_FETCH_ERROR', err.message || 'Failed to fetch receipt'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/audit')
  @Permissions(Permission.WMS_RECEIPT_READ)
  @ApiOperation({ summary: 'Get receipt audit trail' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Audit trail retrieved successfully' })
  async getAudit(@Param('id') id: string) {
    try {
      const receipt = await this.receiptService.findById(id);
      const auditTrail = this.receiptService.getAuditTrail(receipt);
      return ok(auditTrail, 'Audit trail retrieved successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_AUDIT_ERROR', err.message || 'Failed to fetch audit trail'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/label')
  @Permissions(Permission.WMS_RECEIPT_READ)
  @ApiOperation({ summary: 'Get receipt QR/barcode label data' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Label data retrieved successfully' })
  async getLabel(@Param('id') id: string) {
    try {
      const receipt = await this.receiptService.findById(id);
      return ok({
        id: receipt.id,
        code: (receipt as any).code,
        url: `/wms/receipts/${receipt.id}`,
        qrData: `${receipt.id}`,
      }, 'Label data retrieved successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_LABEL_ERROR', err.message || 'Failed to generate label'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @Permissions(Permission.WMS_RECEIPT_UPDATE)
  @ApiOperation({ summary: 'Update a draft receipt' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Receipt updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateReceiptDto, @Request() req: any) {
    try {
      const userId = req.user?.userId || req.user?.sub;
      const receipt = await this.receiptService.update(id, dto, userId);
      return ok(receipt, 'Receipt updated successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_UPDATE_ERROR', err.message || 'Failed to update receipt'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/submit')
  @Permissions(Permission.WMS_RECEIPT_UPDATE)
  @ApiOperation({ summary: 'Submit receipt for review (draft → under_review)' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Receipt submitted for review' })
  async submit(@Param('id') id: string, @Body() dto: SubmitReceiptDto, @Request() req: any) {
    try {
      const userId = req.user?.userId || req.user?.sub;
      // Forward the JWT token so the approval-flow service can authenticate the caller
      const authToken = req.headers?.authorization as string | undefined;
      const receipt = await this.receiptService.submit(id, dto, userId, authToken);
      return ok(receipt, 'Receipt submitted for review');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_SUBMIT_ERROR', err.message || 'Failed to submit receipt'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/review')
  @Permissions(Permission.WMS_RECEIPT_REVIEW)
  @ApiOperation({ summary: 'Review a receipt (accept or reject)' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Review applied successfully' })
  async review(@Param('id') id: string, @Body() dto: ReviewReceiptDto, @Request() req: any) {
    try {
      const userId = req.user?.userId || req.user?.sub;
      const receipt = await this.receiptService.review(id, dto, userId);
      return ok(receipt, 'Review applied successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_REVIEW_ERROR', err.message || 'Failed to review receipt'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/approve')
  @Permissions(Permission.WMS_RECEIPT_APPROVE)
  @ApiOperation({ summary: 'Approve a receipt (under_review → approved)' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Receipt approved successfully' })
  async approve(@Param('id') id: string, @Body() dto: ApproveReceiptDto, @Request() req: any) {
    try {
      const userId = req.user?.userId || req.user?.sub;
      const receipt = await this.receiptService.approve(id, dto, userId);
      return ok(receipt, 'Receipt approved successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_APPROVE_ERROR', err.message || 'Failed to approve receipt'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/receive')
  @Permissions(Permission.WMS_RECEIPT_UPDATE)
  @ApiOperation({ summary: 'Record receipt of goods (approved → received/partial)' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Items received successfully' })
  async receive(@Param('id') id: string, @Body() dto: ReceiveReceiptDto, @Request() req: any) {
    try {
      const userId = req.user?.userId || req.user?.sub;
      const receipt = await this.receiptService.receive(id, dto, userId);
      return ok(receipt, 'Items received successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_RECEIVE_ERROR', err.message || 'Failed to process receive'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/finalize')
  @Permissions(Permission.WMS_RECEIPT_FINALIZE)
  @ApiOperation({ summary: 'Finalize and lock a receipt' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Receipt finalized successfully' })
  async finalize(@Param('id') id: string, @Body() dto: FinalizeReceiptDto, @Request() req: any) {
    try {
      const userId = req.user?.userId || req.user?.sub;
      const receipt = await this.receiptService.finalize(id, dto, userId);
      return ok(receipt, 'Receipt finalized successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_FINALIZE_ERROR', err.message || 'Failed to finalize receipt'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/unlock')
  @Permissions(Permission.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Unlock a finalized receipt (admin only)' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Receipt unlocked successfully' })
  async unlock(@Param('id') id: string, @Body() dto: UnlockReceiptDto, @Request() req: any) {
    try {
      const userId = req.user?.userId || req.user?.sub;
      const receipt = await this.receiptService.unlock(id, dto, userId);
      return ok(receipt, 'Receipt unlocked successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_UNLOCK_ERROR', err.message || 'Failed to unlock receipt'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/qc')
  @Permissions(Permission.WMS_QC_MANAGE)
  @ApiOperation({ summary: 'Apply QC result to receipt lines' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'QC applied successfully' })
  async applyQc(@Param('id') id: string, @Body() dto: QcReceiptDto, @Request() req: any) {
    try {
      const userId = req.user?.userId || req.user?.sub;
      const receipt = await this.receiptService.applyQc(id, dto, userId);
      return ok(receipt, 'QC applied successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_QC_ERROR', err.message || 'Failed to apply QC'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/complete')
  @Permissions(Permission.WMS_RECEIPT_UPDATE)
  @ApiOperation({ summary: 'Complete a receipt after QC passed' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Receipt completed successfully' })
  async complete(@Param('id') id: string) {
    try {
      const receipt = await this.receiptService.complete(id);
      return ok(receipt, 'Receipt completed successfully');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_COMPLETE_ERROR', err.message || 'Failed to complete receipt'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/upload-url')
  @Permissions(Permission.WMS_RECEIPT_UPDATE)
  @ApiOperation({ summary: 'Get a presigned upload URL for attaching a reference document to a receipt' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Presigned upload URL returned' })
  async getUploadUrl(@Param('id') id: string, @Body() dto: RequestUploadUrlDto, @Request() req: any) {
    try {
      // Verify receipt exists
      const receipt = await this.receiptService.findById(id);
      const orgId = receipt.orgId?.toString() ?? 'unknown';

      const ts = Date.now();
      const fileKey = `receipts/${orgId}/${id}/documents/${ts}-${dto.fileName}`;

      const presigned = await this.minioService.presignUpload(fileKey, {
        expiresIn: 600, // 10 minutes
        contentType: dto.mimeType,
      });

      return ok({
        uploadUrl: presigned.url,
        method: presigned.method,
        fileKey,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        expiresAt: presigned.expiresAt,
      }, 'Presigned upload URL generated');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        error('RECEIPT_UPLOAD_URL_ERROR', err.message || 'Failed to generate upload URL'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
