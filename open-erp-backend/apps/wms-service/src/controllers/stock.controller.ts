import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { StockService } from '../services/stock.service';
import { StockQueryDto, AdjustStockDto } from '../dto/stock.dto';
import { JwtAuthGuard, CurrentUser } from '@shared/authz';
import type { UserContext } from '@shared/authz';
import { ok, paginated, created } from '@shared/response';

@ApiTags('wms-stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wms/stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: 'Tra cứu tồn kho theo tenant' })
  @ApiResponse({ status: 200, description: 'Danh sách tồn kho' })
  async getStock(
    @CurrentUser() user: UserContext,
    @Query() query: StockQueryDto,
  ) {
    const result = await this.stockService.getStock(user.organizationId!, query);
    return paginated(result.items, result.page, result.limit, result.total);
  }

  @Post('adjust')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Điều chỉnh tồn kho (adjustment/in/out)' })
  @ApiResponse({ status: 201, description: 'Điều chỉnh thành công' })
  async adjustStock(
    @CurrentUser() user: UserContext,
    @Body() dto: AdjustStockDto,
  ) {
    await this.stockService.adjustStock(user.organizationId!, dto, user.userId);
    return created(null, 'Stock adjusted successfully');
  }
}
