import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { RequirePermissions } from '../../core/auth/permissions.decorator';
import { RedisService } from '../../core/redis/redis.service';

@Controller('auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleController {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly redisService: RedisService,
  ) {}

  @Get('roles')
  @RequirePermissions('ROLE_READ')
  async getRoles(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const roles = await this.roleRepository.find({
      where: { tenantId },
      relations: {
        permissions: true
      },
    });
    return {
      success: true,
      data: roles,
    };
  }

  @Post('roles')
  @RequirePermissions('ROLE_CREATE')
  async createRole(@Req() req: any, @Body() body: { name: string; description?: string }) {
    const tenantId = req.user.tenantId;
    const role = new Role();
    role.tenantId = tenantId;
    role.name = body.name;
    role.description = body.description || null;
    role.permissions = [];
    const saved = await this.roleRepository.save(role);
    return {
      success: true,
      data: saved,
    };
  }

  @Put('roles/:id/permissions')
  @RequirePermissions('ROLE_UPDATE')
  async updateRolePermissions(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { permissionCodes: string[] },
  ) {
    const tenantId = req.user.tenantId;
    const role = await this.roleRepository.findOne({
      where: { id, tenantId },
      relations: {
        permissions: true
      },
    });

    if (!role) {
      return { success: false, message: 'Role not found' };
    }

    const permissions: Permission[] = [];
    for (const code of body.permissionCodes) {
      const perm = await this.permissionRepository.findOne({ where: { code } });
      if (perm) {
        permissions.push(perm);
      }
    }

    role.permissions = permissions;
    await this.roleRepository.save(role);

    // Invalidate Redis permissions cache for all users
    try {
      const keys = await this.redisService.keys('user:permissions:*');
      for (const key of keys) {
        await this.redisService.del(key);
      }
    } catch (e) {
      console.error('Failed to clear cache keys', e);
    }

    return {
      success: true,
      data: role,
    };
  }

  @Delete('roles/:id')
  @RequirePermissions('ROLE_DELETE')
  async deleteRole(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    const role = await this.roleRepository.findOne({ where: { id, tenantId } });
    if (!role) {
      return { success: false, message: 'Role not found' };
    }
    await this.roleRepository.remove(role);

    // Invalidate Redis permissions cache
    try {
      const keys = await this.redisService.keys('user:permissions:*');
      for (const key of keys) {
        await this.redisService.del(key);
      }
    } catch (e) {
      console.error('Failed to clear cache keys', e);
    }

    return {
      success: true,
    };
  }

  @Get('permissions')
  async getPermissions() {
    const permissions = await this.permissionRepository.find();
    return {
      success: true,
      data: permissions,
    };
  }
}
