import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsService } from './departments.service';

@Controller({ path: 'departments', version: '1' })
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async listDepartments(@Req() req: Request) {
    return this.departmentsService.listDepartments(req.user);
  }

  @Get('tree')
  async getTree(@Req() req: Request) {
    return this.departmentsService.getTree(req.user);
  }

  @Post()
  async createDepartment(@Body() dto: CreateDepartmentDto, @Req() req: Request) {
    return this.departmentsService.createDepartment(dto, req.user);
  }

  @Get(':id')
  async getDepartmentById(@Param('id') id: string, @Req() req: Request) {
    return this.departmentsService.getDepartmentById(id, req.user);
  }

  @Patch(':id')
  async updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @Req() req: Request) {
    return this.departmentsService.updateDepartment(id, dto, req.user);
  }

  @Delete(':id')
  async deleteDepartment(@Param('id') id: string, @Req() req: Request) {
    return this.departmentsService.deleteDepartment(id, req.user);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string, @Req() req: Request) {
    return this.departmentsService.getDepartmentMembers(id, req.user);
  }
}