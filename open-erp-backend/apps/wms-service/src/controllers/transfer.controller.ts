import {
  Controller,
  Get,
  Post,
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
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { TransferService } from '../services/transfer.service';
import { CreateTransferDto, TransferQueryDto } from '../dto/transfer.dto';
import { JwtAuthGuard } from '@shared/authz';
import { CurrentUser, UserContext } from '@shared/authz';
import { created, ok, paginated } from '@shared/response';

@ApiTags('wms-transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wms/transfers')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách lệnh chuyển kho' })
  async getTransfers(
    @CurrentUser() user: UserContext,
    @Query() query: TransferQueryDto,
  ) {
    const result = await this.transferService.getTransfers(
      user.organizationId!,
      query,
    );
    return paginated(result.items, result.page, result.limit, result.total);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo lệnh chuyển kho' })
  @ApiResponse({ status: 201, description: 'Lệnh chuyển kho được tạo' })
  async createTransfer(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateTransferDto,
  ) {
    const result = await this.transferService.createTransfer(
      user.organizationId!,
      dto,
      user.userId,
    );
    return created(result, 'Transfer order created');
  }

  @Post(':referenceNo/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác nhận chuyển kho (atomic deduct + add)' })
  @ApiParam({ name: 'referenceNo', description: 'Transfer reference number' })
  @ApiResponse({ status: 200, description: 'Chuyển kho đã được xác nhận' })
  async confirmTransfer(
    @CurrentUser() user: UserContext,
    @Param('referenceNo') referenceNo: string,
  ) {
    const result = await this.transferService.confirmTransfer(
      user.organizationId!,
      referenceNo,
      user.userId,
    );
    return ok(result, 'Transfer confirmed');
  }
}
