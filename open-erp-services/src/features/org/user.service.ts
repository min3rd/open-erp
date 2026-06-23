import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { User } from '../../core/user/user.entity';
import { Employee } from './entities/employee.entity';
import { Tenant } from '../../core/tenant/tenant.entity';
import { Role } from '../auth/entities/role.entity';
import { Department } from './entities/department.entity';
import { MailService } from '../../core/mail/mail.service';
import { RedisService } from '../../core/redis/redis.service';
import { InviteUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async invite(dto: InviteUserDto, tenantId: string): Promise<any> {
    const email = dto.email.trim().toLowerCase();

    // 1. Check if user already exists in this tenant
    const existingUser = await this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.tenants', 'tenant')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.email = :email', { email })
      .getOne();

    if (existingUser) {
      const isMember = existingUser.tenants.some((t) => t.id === tenantId);
      if (isMember) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'USER_ALREADY_MEMBER',
            messageKey: 'auth.user_already_member',
          },
        });
      }
    }

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException({
        success: false,
        error: { code: 'TENANT_NOT_FOUND', messageKey: 'auth.tenant_not_found' },
      });
    }

    // Resolve Role
    let role: Role | null = null;
    if (dto.roleId) {
      role = await this.roleRepository.findOne({ where: { id: dto.roleId, tenantId } });
    }
    if (!role) {
      role = await this.roleRepository.findOne({ where: { name: 'Employee', tenantId } });
    }
    if (!role) {
      role = await this.roleRepository.findOne({ where: { tenantId } });
    }
    if (!role) {
      throw new BadRequestException({
        success: false,
        error: { code: 'NO_ROLES_DEFINED', messageKey: 'org.no_roles_defined' },
      });
    }

    // Resolve Department
    let department: Department | null = null;
    if (dto.departmentId) {
      department = await this.departmentRepository.findOne({
        where: { id: dto.departmentId, tenantId },
      });
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let user: User;
      let isNewUser = false;

      if (existingUser) {
        user = existingUser;
        if (!user.tenants.some((t) => t.id === tenant.id)) {
          user.tenants.push(tenant);
        }
        if (!user.roles.some((r) => r.id === role.id)) {
          user.roles.push(role);
        }
        await queryRunner.manager.save(user);
      } else {
        isNewUser = true;
        user = new User();
        user.email = email;
        // Generate temporary random password
        const tempPassword = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(tempPassword, salt);
        user.firstName = dto.firstName;
        user.lastName = dto.lastName;
        user.status = 'Pending';
        user.tenantId = tenantId; // Set primary tenant ID
        user.tenants = [tenant];
        user.roles = [role];
        user = await queryRunner.manager.save(user);
      }

      // Create Employee profile
      let employee = await this.employeeRepository.findOne({
        where: { tenantId, email },
      });
      if (!employee) {
        employee = new Employee();
        employee.tenantId = tenantId;
        employee.email = email;
        employee.firstName = dto.firstName;
        employee.lastName = dto.lastName;
        employee.status = 'Working';
        employee.departmentId = department ? department.id : null;
        await queryRunner.manager.save(employee);
      } else {
        employee.firstName = dto.firstName;
        employee.lastName = dto.lastName;
        employee.departmentId = department ? department.id : null;
        await queryRunner.manager.save(employee);
      }

      await queryRunner.commitTransaction();

      // Dispatch invite link if user is Pending
      if (user.status === 'Pending') {
        const token = crypto.randomBytes(20).toString('hex');
        await this.redisService.set(`activation:${token}`, user.id, 24 * 60 * 60);

        const appProtocol = this.configService.get<string>('APP_PROTOCOL', 'http');
        // If subdomain is present, prepend to app domain
        const appDomain = this.configService.get<string>('APP_DOMAIN', 'localhost:4200');
        const activationLink = `${appProtocol}://${tenant.subdomain}.${appDomain}/activate?token=${token}`;

        await this.mailService.sendInviteEmail(
          email,
          dto.firstName,
          dto.lastName,
          activationLink,
          tenant.name,
        );
        console.log(`[Invitation] Generated link for ${email}: ${activationLink}`);
      }

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          status: user.status,
        },
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(tenantId: string): Promise<any[]> {
    const users = await this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.tenants', 'tenant')
      .leftJoinAndSelect('user.roles', 'role')
      .where('tenant.id = :tenantId', { tenantId })
      .getMany();

    const employees = await this.employeeRepository.find({
      where: { tenantId },
      relations: {
        department: true
      },
    });

    return users.map((u) => {
      const emp = employees.find((e) => e.email === u.email);
      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName || emp?.firstName || '',
        lastName: u.lastName || emp?.lastName || '',
        status: u.status,
        roleName: u.roles && u.roles.length > 0 ? u.roles[0].name : 'Employee',
        department: emp?.department
          ? { id: emp.department.id, name: emp.department.name }
          : null,
        employeeId: emp?.id || null,
      };
    });
  }

  async resendInvite(id: string, tenantId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        tenants: true
      },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: { code: 'USER_NOT_FOUND', messageKey: 'auth.user_not_found' },
      });
    }

    const isMember = user.tenants.some((t) => t.id === tenantId);
    if (!isMember) {
      throw new BadRequestException({
        success: false,
        error: { code: 'USER_NOT_MEMBER', messageKey: 'org.user_not_member' },
      });
    }

    if (user.status !== 'Pending') {
      throw new BadRequestException({
        success: false,
        error: { code: 'USER_ALREADY_ACTIVATED', messageKey: 'org.user_already_activated' },
      });
    }

    const tenant = user.tenants.find((t) => t.id === tenantId);
    if (!tenant) {
      throw new NotFoundException({
        success: false,
        error: { code: 'TENANT_NOT_FOUND', messageKey: 'auth.tenant_not_found' },
      });
    }

    // Regenerate token and store in Redis
    const token = crypto.randomBytes(20).toString('hex');
    await this.redisService.set(`activation:${token}`, user.id, 24 * 60 * 60);

    const appProtocol = this.configService.get<string>('APP_PROTOCOL', 'http');
    const appDomain = this.configService.get<string>('APP_DOMAIN', 'localhost:4200');
    const activationLink = `${appProtocol}://${tenant.subdomain}.${appDomain}/activate?token=${token}`;

    await this.mailService.sendInviteEmail(
      user.email,
      user.firstName || '',
      user.lastName || '',
      activationLink,
      tenant.name,
    );

    console.log(`[Invitation Resend] Link for ${user.email}: ${activationLink}`);
    return { success: true };
  }

  async cancelInvite(id: string, tenantId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        tenants: true
      },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: { code: 'USER_NOT_FOUND', messageKey: 'auth.user_not_found' },
      });
    }

    const isMember = user.tenants.some((t) => t.id === tenantId);
    if (!isMember) {
      throw new BadRequestException({
        success: false,
        error: { code: 'USER_NOT_MEMBER', messageKey: 'org.user_not_member' },
      });
    }

    // Remove Employee Profile
    const employee = await this.employeeRepository.findOne({
      where: { tenantId, email: user.email },
    });
    if (employee) {
      await this.employeeRepository.remove(employee);
    }

    // If user is Pending (never logged in), delete them. Otherwise just unlink.
    if (user.status === 'Pending') {
      await this.userRepository.remove(user);
    } else {
      user.tenants = user.tenants.filter((t) => t.id !== tenantId);
      await this.userRepository.save(user);
    }
  }
}
