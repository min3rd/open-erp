import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { BranchService } from './branch.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Controller('org/branches')
@UseGuards(JwtAuthGuard)
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateBranchDto, @Req() req: any) {
    const tenantId = req.tenantId;
    const data = await this.branchService.create(dto, tenantId);
    return {
      success: true,
      data,
    };
  }

  @Get()
  async findAll(@Req() req: any) {
    const tenantId = req.tenantId;
    const data = await this.branchService.findAll(tenantId);
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId;
    const data = await this.branchService.findOne(id, tenantId);
    return {
      success: true,
      data,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @Req() req: any,
  ) {
    const tenantId = req.tenantId;
    const data = await this.branchService.update(id, dto, tenantId);
    return {
      success: true,
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId;
    await this.branchService.remove(id, tenantId);
    return {
      success: true,
    };
  }
}
