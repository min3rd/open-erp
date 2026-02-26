import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { OrgMembersService } from '../services/org-members.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreatePositionDto,
  UpdatePositionDto,
  AssignMemberDto,
  MembersQueryDto,
} from '../dto/org-members.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Permissions } from '@shared/authz/decorators';
import { ok, created, updated, deleted, paginated } from '@shared/response';

@ApiTags('org-members')
@ApiBearerAuth()
@Controller('organizations/:orgId')
@UseGuards(JwtAuthGuard)
export class OrgMembersController {
  constructor(private readonly orgMembersService: OrgMembersService) {}

  // ── Members ──────────────────────────────────────────────────────────────

  @Get('members')
  @ApiOperation({ summary: 'Get paginated organization members with departments and positions' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @Permissions('membership.read')
  async getMembers(
    @Param('orgId') orgId: string,
    @Query() query: MembersQueryDto,
  ) {
    const result = await this.orgMembersService.getMembers(orgId, query);
    return paginated(
      result.items,
      query.page ?? 1,
      query.size ?? 20,
      result.total,
      {},
      'Members retrieved successfully',
    );
  }

  @Patch('members/:memberId')
  @ApiOperation({ summary: 'Update member metadata (status, roles)' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @Permissions(['membership.update', 'organization.manage'], { mode: 'any' })
  async updateMember(
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: any,
  ) {
    const member = await this.orgMembersService.updateMember(orgId, memberId, updateDto);
    return updated(member, 'Member updated successfully');
  }

  @Post('members/:memberId/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign departments and positions to a member' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @Permissions(['membership.update', 'organization.manage'], { mode: 'any' })
  async assignMember(
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @Body() dto: AssignMemberDto,
  ) {
    const member = await this.orgMembersService.assignMember(orgId, memberId, dto);
    return updated(member, 'Member assignments updated successfully');
  }

  // ── Departments ───────────────────────────────────────────────────────────

  @Get('departments')
  @ApiOperation({ summary: 'Get departments for an organization' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @Permissions('organization.read')
  async getDepartments(@Param('orgId') orgId: string) {
    const departments = await this.orgMembersService.getDepartments(orgId);
    return ok(departments, 'Departments retrieved successfully');
  }

  @Post('departments')
  @ApiOperation({ summary: 'Create a department' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @Permissions(['organization.manage', 'membership.update'], { mode: 'any' })
  async createDepartment(
    @Param('orgId') orgId: string,
    @Body() dto: CreateDepartmentDto,
  ) {
    const dept = await this.orgMembersService.createDepartment(orgId, dto);
    return created(dept, 'Department created successfully');
  }

  @Patch('departments/:deptId')
  @ApiOperation({ summary: 'Update a department' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'deptId', description: 'Department ID' })
  @Permissions(['organization.manage', 'membership.update'], { mode: 'any' })
  async updateDepartment(
    @Param('orgId') orgId: string,
    @Param('deptId') deptId: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    const dept = await this.orgMembersService.updateDepartment(orgId, deptId, dto);
    return updated(dept, 'Department updated successfully');
  }

  @Delete('departments/:deptId')
  @ApiOperation({ summary: 'Delete a department' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'deptId', description: 'Department ID' })
  @Permissions(['organization.manage', 'membership.update'], { mode: 'any' })
  async deleteDepartment(
    @Param('orgId') orgId: string,
    @Param('deptId') deptId: string,
  ) {
    await this.orgMembersService.deleteDepartment(orgId, deptId);
    return deleted('Department deleted successfully');
  }

  // ── Positions ─────────────────────────────────────────────────────────────

  @Get('positions')
  @ApiOperation({ summary: 'Get positions for an organization' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @Permissions('organization.read')
  async getPositions(@Param('orgId') orgId: string) {
    const positions = await this.orgMembersService.getPositions(orgId);
    return ok(positions, 'Positions retrieved successfully');
  }

  @Post('positions')
  @ApiOperation({ summary: 'Create a position' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @Permissions(['organization.manage', 'membership.update'], { mode: 'any' })
  async createPosition(
    @Param('orgId') orgId: string,
    @Body() dto: CreatePositionDto,
  ) {
    const position = await this.orgMembersService.createPosition(orgId, dto);
    return created(position, 'Position created successfully');
  }

  @Patch('positions/:posId')
  @ApiOperation({ summary: 'Update a position' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'posId', description: 'Position ID' })
  @Permissions(['organization.manage', 'membership.update'], { mode: 'any' })
  async updatePosition(
    @Param('orgId') orgId: string,
    @Param('posId') posId: string,
    @Body() dto: UpdatePositionDto,
  ) {
    const position = await this.orgMembersService.updatePosition(orgId, posId, dto);
    return updated(position, 'Position updated successfully');
  }

  @Delete('positions/:posId')
  @ApiOperation({ summary: 'Delete a position' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'posId', description: 'Position ID' })
  @Permissions(['organization.manage', 'membership.update'], { mode: 'any' })
  async deletePosition(
    @Param('orgId') orgId: string,
    @Param('posId') posId: string,
  ) {
    await this.orgMembersService.deletePosition(orgId, posId);
    return deleted('Position deleted successfully');
  }
}
