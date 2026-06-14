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
import { DepartmentService } from './department.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { SeedIndustryDto } from './dto/seed-industry.dto';


@Controller('org/departments')
@UseGuards(JwtAuthGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDepartmentDto, @Req() req: any) {
    const tenantId = req.tenantId;
    const data = await this.departmentService.create(dto, tenantId);
    return {
      success: true,
      data,
    };
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seedDepartments(@Body() dto: SeedIndustryDto, @Req() req: any) {
    const tenantId = req.tenantId;
    await this.departmentService.seedDepartments(dto, tenantId);
    return {
      success: true,
    };
  }


  @Get()
  async findAllTree(@Req() req: any) {
    const tenantId = req.tenantId;
    const data = await this.departmentService.findAllTree(tenantId);
    return {
      success: true,
      data,
    };
  }

  @Get('flat')
  async findAllFlat(@Req() req: any) {
    const tenantId = req.tenantId;
    const data = await this.departmentService.findAllFlat(tenantId);
    return {
      success: true,
      data,
    };
  }

  @Get('users')
  async getTenantUsers(@Req() req: any) {
    const tenantId = req.tenantId;
    const data = await this.departmentService.getTenantUsers(tenantId);
    return {
      success: true,
      data,
    };
  }


  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId;
    const data = await this.departmentService.findOne(id, tenantId);
    return {
      success: true,
      data,
    };
  }

  @Get(':id/employees')
  async getEmployees(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId;
    const data = await this.departmentService.getEmployees(id, tenantId);
    return {
      success: true,
      data,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @Req() req: any,
  ) {
    const tenantId = req.tenantId;
    const data = await this.departmentService.update(id, dto, tenantId);
    return {
      success: true,
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId;
    await this.departmentService.remove(id, tenantId);
    return {
      success: true,
    };
  }
}
