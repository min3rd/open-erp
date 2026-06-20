import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../core/redis/redis.service';
import { Tenant } from '../../core/tenant/tenant.entity';
import { User } from '../../core/user/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';

import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async checkSubdomain(subdomain: string): Promise<boolean> {
    if (!subdomain) {
      return false;
    }
    const sanitized = subdomain.trim().toLowerCase();
    if (!/^[a-z0-9]+$/.test(sanitized)) {
      return false;
    }
    const tenant = await this.tenantRepository.findOne({
      where: { subdomain: sanitized },
    });
    return !tenant;
  }

  private async ensurePermissionsSeeded(manager: any): Promise<Permission[]> {
    const permissionsList = [
      { code: 'ORG_READ', name: 'Xem phòng ban & chi nhánh', module: 'organization' },
      { code: 'ORG_CREATE', name: 'Thêm phòng ban & chi nhánh', module: 'organization' },
      { code: 'ORG_UPDATE', name: 'Sửa phòng ban & chi nhánh', module: 'organization' },
      { code: 'ORG_DELETE', name: 'Xóa phòng ban & chi nhánh', module: 'organization' },
      { code: 'ROLE_READ', name: 'Xem vai trò & phân quyền', module: 'system' },
      { code: 'ROLE_CREATE', name: 'Tạo vai trò mới', module: 'system' },
      { code: 'ROLE_UPDATE', name: 'Sửa vai trò & phân quyền', module: 'system' },
      { code: 'ROLE_DELETE', name: 'Xóa vai trò', module: 'system' },
      { code: 'CRM_READ', name: 'Xem thông tin CRM', module: 'crm' },
      { code: 'CRM_CREATE', name: 'Thêm cơ hội bán hàng', module: 'crm' },
      { code: 'CRM_UPDATE', name: 'Cập nhật cơ hội bán hàng', module: 'crm' },
      { code: 'CRM_DELETE', name: 'Xóa cơ hội bán hàng', module: 'crm' }
    ];

    const dbPermissions: Permission[] = [];
    for (const item of permissionsList) {
      let perm = await manager.findOne(Permission, { where: { code: item.code } });
      if (!perm) {
        perm = new Permission();
        perm.code = item.code;
        perm.name = item.name;
        perm.module = item.module;
        perm = await manager.save(perm);
      }
      dbPermissions.push(perm);
    }
    return dbPermissions;
  }

  async register(dto: RegisterDto) {
    let subdomain = dto.subdomain ? dto.subdomain.trim().toLowerCase() : '';
    if (!subdomain) {
      subdomain = dto.companyName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

      if (!subdomain) {
        subdomain = 'tenant';
      }

      let suffix = 1;
      let checkDomain = subdomain;
      while (!(await this.checkSubdomain(checkDomain))) {
        checkDomain = `${subdomain}${suffix}`;
        suffix++;
      }
      subdomain = checkDomain;
    } else {
      // 1. Verify subdomain availability
      const isSubdomainAvailable = await this.checkSubdomain(subdomain);
      if (!isSubdomainAvailable) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'SUBDOMAIN_ALREADY_EXISTS',
            messageKey: 'auth.subdomain_already_exists',
          },
        });
      }
    }

    const email = dto.email.trim().toLowerCase();

    // 2. Verify email availability
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          messageKey: 'auth.email_already_exists',
        },
      });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // 4. Save in transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create Tenant
      const tenant = new Tenant();
      tenant.name = dto.companyName;
      tenant.subdomain = subdomain;
      tenant.email = email;
      tenant.phone = dto.phone || null;

      const savedTenant = await queryRunner.manager.save(tenant);

      // Seed global permissions
      const seededPermissions = await this.ensurePermissionsSeeded(queryRunner.manager);

      // Create default Administrator role for tenant with full permissions
      const adminRole = new Role();
      adminRole.tenantId = savedTenant.id;
      adminRole.name = 'Administrator';
      adminRole.description = 'Quản trị viên hệ thống toàn quyền';
      adminRole.permissions = seededPermissions;

      const savedRole = await queryRunner.manager.save(adminRole);

      // Create Tenant Admin User
      const user = new User();
      user.tenantId = savedTenant.id;
      user.email = email;
      user.password = hashedPassword;
      user.status = 'Pending';
      user.roles = [savedRole];
      user.tenants = [savedTenant];

      const savedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      // 5. Simulate BullMQ email queue processing
      const activationToken =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      
      // Save activation token in Redis for 24h
      await this.redisService.set(`activation:${activationToken}`, savedUser.id, 24 * 60 * 60);

      const appProtocol = this.configService.get<string>('APP_PROTOCOL', 'http');
      const appDomain = this.configService.get<string>('APP_DOMAIN', 'localhost:4200');
      const activationLink = `${appProtocol}://${appDomain}/activate?token=${activationToken}`;
      console.log(`[BullMQ Simulation] Queued email job to ${email}`);
      console.log(`[BullMQ Simulation] Activation Link: ${activationLink}`);

      return {
        success: true,
        messageKey: 'auth.register_success',
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async registerUser(dto: RegisterUserDto) {
    const email = dto.email.trim().toLowerCase();

    // 1. Verify email availability
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          messageKey: 'auth.email_already_exists',
        },
      });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // 3. Create global User
    const user = new User();
    user.tenantId = null;
    user.email = email;
    user.password = hashedPassword;
    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    user.phone = dto.phone || null;
    user.status = 'Active';

    await this.userRepository.save(user);

    return {
      success: true,
      messageKey: 'auth.user_register_success',
    };
  }

  async login(dto: LoginDto, tenantId?: string) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'tenants'],
    });

    if (!user) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          messageKey: 'auth.invalid_credentials',
        },
      });
    }

    if (user.status !== 'Active') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'ACCOUNT_NOT_ACTIVATED',
          messageKey: 'auth.account_not_activated',
        },
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          messageKey: 'auth.invalid_credentials',
        },
      });
    }

    // Resolve all associated tenants
    const tenants: Tenant[] = [];
    if (user.tenantId) {
      const primaryTenant = await this.tenantRepository.findOne({
        where: { id: user.tenantId },
      });
      if (primaryTenant) {
        tenants.push(primaryTenant);
      }
    }
    if (user.tenants) {
      for (const t of user.tenants) {
        if (!tenants.some((ext) => ext.id === t.id)) {
          tenants.push(t);
        }
      }
    }

    // If multiple tenants exist and no tenantId was specified/selected, request tenant selection
    if (tenants.length > 1 && !tenantId) {
      return {
        success: true,
        data: {
          requireTenantSelection: true,
          tenants: tenants.map((t) => ({
            id: t.id,
            name: t.name,
            subdomain: t.subdomain,
          })),
        },
      };
    }

    const activeTenantId = tenantId || (tenants.length > 0 ? tenants[0].id : null);

    if (tenantId && activeTenantId) {
      const hasAccess = tenants.some((t) => t.id === activeTenantId);
      if (!hasAccess) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'TENANT_ACCESS_DENIED',
            messageKey: 'auth.tenant_access_denied',
          },
        });
      }
    }

    if (!activeTenantId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'NO_TENANT_ASSOCIATED',
          messageKey: 'auth.no_tenant_associated',
        },
      });
    }

    const tenantRoles = user.roles ? user.roles.filter((r) => r.tenantId === activeTenantId) : [];
    const roleName = tenantRoles.length > 0 ? tenantRoles[0].name.toLowerCase() : 'employee';

    const payload = {
      userId: user.id,
      email: user.email,
      role: roleName,
      tenantId: activeTenantId,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(
      { userId: user.id, tenantId: activeTenantId },
      { expiresIn: '7d' },
    );

    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const redisKey = `session:${user.id}:${tokenHash}`;
    await this.redisService.set(redisKey, 'active', 7 * 24 * 60 * 60);

    const activeTenant = tenants.find((t) => t.id === activeTenantId);

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: 900,
        tenant: activeTenant
          ? {
              id: activeTenantId,
              name: activeTenant.name,
              subdomain: activeTenant.subdomain,
            }
          : null,
      },
    };
  }

  async selectTenant(dto: { email: string; password?: string; tenantId: string }) {
    return this.login({ email: dto.email, password: dto.password }, dto.tenantId);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const userId = payload.userId;
      const tenantId = payload.tenantId;

      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
      const redisKey = `session:${userId}:${tokenHash}`;

      const session = await this.redisService.get(redisKey);
      if (!session) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_SESSION',
            messageKey: 'auth.invalid_session',
          },
        });
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['roles'],
      });

      if (!user || user.status !== 'Active') {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_SESSION',
            messageKey: 'auth.invalid_session',
          },
        });
      }

      const activeTenantId = tenantId || user.tenantId;
      const tenantRoles = user.roles ? user.roles.filter(r => r.tenantId === activeTenantId) : [];
      const roleName = tenantRoles.length > 0 ? tenantRoles[0].name.toLowerCase() : 'employee';

      const newPayload = {
        userId: user.id,
        email: user.email,
        role: roleName,
        tenantId: activeTenantId,
      };
      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });

      return {
        success: true,
        data: {
          accessToken,
          expiresIn: 900,
        },
      };
    } catch (err) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_SESSION',
          messageKey: 'auth.invalid_session',
        },
      });
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const userId = payload.userId;

      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
      const redisKey = `session:${userId}:${tokenHash}`;

      await this.redisService.del(redisKey);

      return {
        success: true,
      };
    } catch (err) {
      return {
        success: true,
      };
    }
  }

  async activate(token: string): Promise<{ userId: string; subdomain: string }> {
    if (!token) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_ACTIVATION_TOKEN',
          messageKey: 'auth.invalid_activation_token',
        },
      });
    }

    const redisKey = `activation:${token}`;
    const userId = await this.redisService.get(redisKey);
    if (!userId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_ACTIVATION_TOKEN',
          messageKey: 'auth.invalid_activation_token',
        },
      });
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          messageKey: 'auth.user_not_found',
        },
      });
    }

    user.status = 'Active';
    await this.userRepository.save(user);
    await this.redisService.del(redisKey);

    const tenant = user.tenantId
      ? await this.tenantRepository.findOne({
          where: { id: user.tenantId },
        })
      : null;

    return {
      userId: user.id,
      subdomain: tenant?.subdomain || '',
    };
  }

  async getUserPermissions(userId: string, tenantId?: string): Promise<string[]> {
    const cacheKey = tenantId ? `user:permissions:${userId}:${tenantId}` : `user:permissions:${userId}`;
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    const permissions: string[] = [];
    if (user && user.roles) {
      for (const role of user.roles) {
        if (role.permissions && (!tenantId || role.tenantId === tenantId)) {
          for (const perm of role.permissions) {
            if (!permissions.includes(perm.code)) {
              permissions.push(perm.code);
            }
          }
        }
      }
    }

    try {
      await this.redisService.set(cacheKey, JSON.stringify(permissions), 3600);
    } catch {}

    return permissions;
  }

  async me(userId: string, tenantId?: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          messageKey: 'auth.user_not_found',
        },
      });
    }

    const permissions = await this.getUserPermissions(userId, tenantId);
    const activeTenantId = tenantId || user.tenantId;
    const tenantRoles = user.roles ? user.roles.filter(r => !activeTenantId || r.tenantId === activeTenantId) : [];
    const roleNames = tenantRoles.map(r => r.name);

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        tenantId: activeTenantId,
        roles: roleNames,
        permissions,
      },
    };
  }

  async menu(userId: string, tenantId?: string) {
    const userPermissions = await this.getUserPermissions(userId, tenantId);

    const fullMenu = [
      {
        id: 'home',
        title: 'menu.home',
        icon: 'home',
        path: '/home',
        module: 'system',
        children: [],
      },
      {
        id: 'org-structure',
        title: 'menu.org_structure',
        icon: 'git-merge',
        path: '/org-structure',
        module: 'organization',
        requiredPermissions: ['ORG_READ'],
        children: [],
      },
      {
        id: 'roles',
        title: 'menu.roles',
        icon: 'settings',
        path: '/settings/roles',
        module: 'system',
        requiredPermissions: ['ROLE_READ'],
        children: [],
      },
    ];

    const filteredMenu = fullMenu.filter((item) => {
      if (!item.requiredPermissions) return true;
      return item.requiredPermissions.some((perm) =>
        userPermissions.includes(perm),
      );
    });

    return {
      success: true,
      data: filteredMenu.map(({ requiredPermissions, ...rest }) => rest),
    };
  }

  async testLinkTenant(email: string, subdomain: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['tenants'],
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const tenant = await this.tenantRepository.findOne({
      where: { subdomain: subdomain.trim().toLowerCase() },
    });
    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }
    if (!user.tenants) {
      user.tenants = [];
    }
    if (!user.tenants.some(t => t.id === tenant.id)) {
      user.tenants.push(tenant);
      await this.userRepository.save(user);
    }
    return { success: true };
  }
}
