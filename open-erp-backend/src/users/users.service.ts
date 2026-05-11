import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RabbitMQService } from '../common/services/rabbitmq.service';
import { Tenant, TenantDocument } from '../tenant/schemas/tenant.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  AuthProvider,
  User,
  UserDocument,
  UserStatus,
} from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async listUsers(query: Record<string, unknown>, user?: Express.User) {
    const tenantId = this.resolveTenantId(user, query.tenantId?.toString());
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: false,
    };

    if (query.departmentId) {
      filter.departmentId = new Types.ObjectId(query.departmentId.toString());
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      const search = query.search.toString().trim();
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      success: true,
      data: items.map((item) => this.toUserResponse(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createUser(dto: CreateUserDto, user?: Express.User) {
    this.assertTenantAdmin(user);
    const tenantId = this.resolveTenantId(user);
    await this.assertTenantCapacity(tenantId);

    const email = dto.email.trim().toLowerCase();
    const existing = await this.userModel
      .findOne({
        tenantId: new Types.ObjectId(tenantId),
        email,
        isDeleted: false,
      })
      .lean()
      .exec();

    if (existing) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: { key: 'user.email.duplicate', data: {} },
      });
    }

    const created = await this.userModel.create({
      tenantId: new Types.ObjectId(tenantId),
      email,
      fullName: dto.fullName.trim(),
      phone: dto.phone?.trim(),
      departmentId: dto.departmentId
        ? new Types.ObjectId(dto.departmentId)
        : undefined,
      positionTitle: dto.positionTitle?.trim(),
      managerId: dto.managerId ? new Types.ObjectId(dto.managerId) : undefined,
      employeeCode: dto.employeeCode?.trim(),
      roles: dto.roles ?? [],
      passwordHash: '',
      status: UserStatus.PENDING_ACTIVATION,
      authProvider: AuthProvider.LOCAL,
      mfaEnabled: false,
      isDeleted: false,
      isSystemUser: false,
    });

    await this.publishUserCreated(created);

    return { success: true, data: this.toUserResponse(created) };
  }

  async getMe(user: Express.User) {
    const tenantId = this.resolveTenantId(user);
    const currentUser = await this.userModel
      .findOne({
        _id: new Types.ObjectId(user.sub ?? ''),
        tenantId: new Types.ObjectId(tenantId),
        isDeleted: false,
      })
      .lean()
      .exec();

    if (!currentUser) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'user.not_found', data: {} },
      });
    }

    return { success: true, data: this.toUserResponse(currentUser) };
  }

  async updateMe(user: Express.User, dto: UpdateProfileDto) {
    const tenantId = this.resolveTenantId(user);
    const updated = await this.userModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(user.sub ?? ''),
          tenantId: new Types.ObjectId(tenantId),
          isDeleted: false,
        },
        {
          $set: {
            fullName: dto.fullName?.trim(),
            phone: dto.phone?.trim(),
            locale: dto.locale?.trim(),
            timezone: dto.timezone?.trim(),
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'user.not_found', data: {} },
      });
    }

    return { success: true, data: this.toUserResponse(updated) };
  }

  async getUserById(id: string, user?: Express.User) {
    const tenantId = this.resolveTenantId(user);
    const current = await this.userModel
      .findOne({
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
        isDeleted: false,
      })
      .lean()
      .exec();

    if (!current) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'user.not_found', data: {} },
      });
    }

    return { success: true, data: this.toUserResponse(current) };
  }

  async updateUser(id: string, dto: UpdateUserDto, user?: Express.User) {
    this.assertTenantAdmin(user);
    const tenantId = this.resolveTenantId(user);

    const updated = await this.userModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          tenantId: new Types.ObjectId(tenantId),
          isDeleted: false,
        },
        {
          $set: {
            ...dto,
            email: dto.email?.trim().toLowerCase(),
            fullName: dto.fullName?.trim(),
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'user.not_found', data: {} },
      });
    }

    return { success: true, data: this.toUserResponse(updated) };
  }

  async deleteUser(id: string, user?: Express.User) {
    this.assertTenantAdmin(user);
    const tenantId = this.resolveTenantId(user);
    const current = await this.userModel
      .findOne({
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
        isDeleted: false,
      })
      .exec();

    if (!current) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'user.not_found', data: {} },
      });
    }

    if (current.status === UserStatus.ACTIVE) {
      throw new UnprocessableEntityException({
        code: 'BUSINESS_RULE_VIOLATION',
        message: { key: 'user.delete.deactivate_first', data: {} },
      });
    }

    current.isDeleted = true;
    current.deletedAt = new Date();
    await current.save();

    return { success: true, data: { deleted: true } };
  }

  async updateStatus(id: string, status: UserStatus, user?: Express.User) {
    this.assertTenantAdmin(user);
    const tenantId = this.resolveTenantId(user);
    const updated = await this.userModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          tenantId: new Types.ObjectId(tenantId),
          isDeleted: false,
        },
        { $set: { status } },
        { new: true },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'user.not_found', data: {} },
      });
    }

    return { success: true, data: this.toUserResponse(updated) };
  }

  async uploadAvatar(
    userId: string,
    avatarUrl: string,
    metadata: Record<string, unknown>,
    actor?: Express.User,
  ) {
    this.assertAvatarOwnerOrAdmin(userId, actor);
    const tenantId = this.resolveTenantId(actor);

    const updated = await this.userModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(userId),
          tenantId: new Types.ObjectId(tenantId),
          isDeleted: false,
        },
        {
          $set: {
            avatarUrl,
            avatarMetadata: metadata,
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'user.not_found', data: {} },
      });
    }

    return { success: true, data: this.toUserResponse(updated) };
  }

  async bootstrapTenantAdmin(params: {
    tenantId: string;
    adminEmail: string;
    plan?: string;
  }) {
    const email = params.adminEmail.trim().toLowerCase();
    const existing = await this.userModel
      .findOne({
        tenantId: new Types.ObjectId(params.tenantId),
        email,
        isDeleted: false,
      })
      .lean()
      .exec();

    if (existing) {
      return { success: true, data: this.toUserResponse(existing) };
    }

    const created = await this.userModel.create({
      tenantId: new Types.ObjectId(params.tenantId),
      email,
      fullName: 'Quản trị viên',
      passwordHash: '',
      roles: ['TENANT_ADMIN'],
      status: UserStatus.ACTIVE,
      authProvider: AuthProvider.LOCAL,
      isSystemUser: true,
      isDeleted: false,
      mfaEnabled: false,
      locale: 'vi-VN',
      timezone: 'Asia/Ho_Chi_Minh',
    });

    await this.publishUserCreated(created, 'TENANT_ADMIN');
    return { success: true, data: this.toUserResponse(created) };
  }

  async assertTenantCapacity(tenantId: string): Promise<void> {
    const tenant = await this.tenantModel.findById(tenantId).lean().exec();
    if (!tenant || tenant.isDeleted) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'tenant.not_found', data: {} },
      });
    }

    const currentUsers = await this.userModel
      .countDocuments({
        tenantId: new Types.ObjectId(tenantId),
        isDeleted: false,
      })
      .exec();
    const maxUsers = tenant.quotas?.maxUsers ?? 0;
    if (maxUsers > 0 && currentUsers >= maxUsers) {
      throw new UnprocessableEntityException({
        code: 'QUOTA_EXCEEDED',
        message: { key: 'tenant.quota.users_exceeded', data: { maxUsers } },
      });
    }
  }

  private async publishUserCreated(userDoc: any, role = 'USER'): Promise<void> {
    await this.rabbitMQService.publish('user.created', {
      tenantId: String(userDoc.tenantId),
      userId: String(userDoc._id),
      email: userDoc.email,
      role,
    });
  }

  private resolveTenantId(user?: Express.User, fallback?: string): string {
    const tenantId = user?.tenantId ?? fallback;
    if (!tenantId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: { key: 'tenant.context.missing', data: {} },
      });
    }

    return tenantId;
  }

  private assertTenantAdmin(user?: Express.User): void {
    const roles = user?.roles ?? [];
    if (roles.includes('TENANT_ADMIN') || roles.includes('SUPER_ADMIN')) {
      return;
    }

    throw new ForbiddenException({
      code: 'FORBIDDEN',
      message: { key: 'user.access.denied', data: {} },
    });
  }

  private assertAvatarOwnerOrAdmin(userId: string, user?: Express.User): void {
    if (user?.sub === userId) {
      return;
    }

    this.assertTenantAdmin(user);
  }

  private toUserResponse(userDoc: any) {
    return {
      id: String(userDoc._id),
      tenantId: String(userDoc.tenantId),
      email: userDoc.email,
      fullName: userDoc.fullName,
      phone: userDoc.phone ?? null,
      avatarUrl: userDoc.avatarUrl ?? null,
      departmentId: userDoc.departmentId ? String(userDoc.departmentId) : null,
      positionTitle: userDoc.positionTitle ?? null,
      managerId: userDoc.managerId ? String(userDoc.managerId) : null,
      employeeCode: userDoc.employeeCode ?? null,
      status: userDoc.status,
      roles: userDoc.roles ?? [],
      mfaEnabled: Boolean(userDoc.mfaEnabled),
      locale: userDoc.locale,
      timezone: userDoc.timezone,
      isSystemUser: Boolean(userDoc.isSystemUser),
      createdAt: userDoc.createdAt ?? null,
      updatedAt: userDoc.updatedAt ?? null,
    };
  }
}
