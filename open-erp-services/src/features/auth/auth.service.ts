import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Tenant } from '../../core/tenant/tenant.entity';
import { User } from '../../core/user/user.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
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
    const subdomain = dto.subdomain.trim().toLowerCase();
    const email = dto.email.trim().toLowerCase();

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

      await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      // 5. Simulate BullMQ email queue processing
      const activationToken =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      const activationLink = `https://${subdomain}.open-erp.9ms.io.vn/activate?token=${activationToken}`;
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
}
