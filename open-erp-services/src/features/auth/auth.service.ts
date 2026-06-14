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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

      // Create Tenant Admin User
      const user = new User();
      user.tenantId = savedTenant.id;
      user.email = email;
      user.password = hashedPassword;
      user.status = 'Pending';

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

  async login(dto: LoginDto, tenantId?: string) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: tenantId ? { email, tenantId } : { email },
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

    const payload = {
      userId: user.id,
      email: user.email,
      role: 'admin',
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(
      { userId: user.id },
      { expiresIn: '7d' },
    );

    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const redisKey = `session:${user.id}:${tokenHash}`;
    await this.redisService.set(redisKey, 'active', 7 * 24 * 60 * 60);

    const tenant = await this.tenantRepository.findOne({
      where: { id: user.tenantId },
    });

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: 900,
        tenant: {
          id: user.tenantId,
          name: tenant?.name,
          subdomain: tenant?.subdomain,
        },
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const userId = payload.userId;

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

      const newPayload = {
        userId: user.id,
        email: user.email,
        role: 'admin',
        tenantId: user.tenantId,
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

    const tenant = await this.tenantRepository.findOne({
      where: { id: user.tenantId },
    });

    return {
      userId: user.id,
      subdomain: tenant?.subdomain || '',
    };
  }
}
