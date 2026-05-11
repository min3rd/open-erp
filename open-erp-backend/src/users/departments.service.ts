import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from '../tenant/schemas/tenant.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department, DepartmentDocument } from './schemas/department.schema';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
  ) {}

  async listDepartments(user?: Express.User) {
    const tenantId = this.resolveTenantId(user);
    const items = await this.departmentModel
      .find({ tenantId: new Types.ObjectId(tenantId), isDeleted: false })
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();

    return { success: true, data: items };
  }

  async getTree(user?: Express.User) {
    const flat = await this.listDepartments(user);
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const item of flat.data as any[]) {
      map.set(String(item._id), { ...item, children: [] });
    }

    for (const item of flat.data as any[]) {
      const node = map.get(String(item._id));
      if (item.parentId && map.has(String(item.parentId))) {
        map.get(String(item.parentId)).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return { success: true, data: roots };
  }

  async createDepartment(dto: CreateDepartmentDto, user?: Express.User) {
    this.assertTenantAdmin(user);
    const tenantId = this.resolveTenantId(user);

    const parent = dto.parentId
      ? await this.departmentModel
          .findOne({ _id: dto.parentId, tenantId: new Types.ObjectId(tenantId), isDeleted: false })
          .lean()
          .exec()
      : null;

    const created = await this.departmentModel.create({
      tenantId: new Types.ObjectId(tenantId),
      name: dto.name.trim(),
      code: dto.code?.trim(),
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : undefined,
      managerId: dto.managerId ? new Types.ObjectId(dto.managerId) : undefined,
      level: parent ? (parent.level ?? 0) + 1 : 0,
      path: parent ? `${parent.path}/${parent._id.toString()}` : '/',
      order: dto.order ?? 0,
      isDeleted: false,
      isActive: true,
    });

    return { success: true, data: this.toDepartmentResponse(created) };
  }

  async getDepartmentById(id: string, user?: Express.User) {
    const tenantId = this.resolveTenantId(user);
    const current = await this.departmentModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId), isDeleted: false })
      .lean()
      .exec();

    if (!current) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'department.not_found', data: {} },
      });
    }

    return { success: true, data: current };
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto, user?: Express.User) {
    this.assertTenantAdmin(user);
    const tenantId = this.resolveTenantId(user);
    const current = await this.departmentModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId), isDeleted: false })
      .exec();

    if (!current) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'department.not_found', data: {} },
      });
    }

    if (dto.name) current.name = dto.name.trim();
    if (dto.code !== undefined) current.code = dto.code?.trim();
    if (dto.parentId !== undefined) current.parentId = dto.parentId ? new Types.ObjectId(dto.parentId) : undefined;
    if (dto.managerId !== undefined) current.managerId = dto.managerId ? new Types.ObjectId(dto.managerId) : undefined;
    if (dto.order !== undefined) current.order = dto.order;
    if (dto.isActive !== undefined) current.isActive = dto.isActive;

    await current.save();
    return { success: true, data: this.toDepartmentResponse(current) };
  }

  async deleteDepartment(id: string, user?: Express.User) {
    this.assertTenantAdmin(user);
    const tenantId = this.resolveTenantId(user);

    const memberCount = await this.userModel
      .countDocuments({ tenantId: new Types.ObjectId(tenantId), departmentId: new Types.ObjectId(id), isDeleted: false })
      .exec();
    if (memberCount > 0) {
      throw new UnprocessableEntityException({
        code: 'BUSINESS_RULE_VIOLATION',
        message: { key: 'department.delete.has_members', data: { memberCount } },
      });
    }

    const childCount = await this.departmentModel
      .countDocuments({ tenantId: new Types.ObjectId(tenantId), parentId: new Types.ObjectId(id), isDeleted: false })
      .exec();
    if (childCount > 0) {
      throw new UnprocessableEntityException({
        code: 'BUSINESS_RULE_VIOLATION',
        message: { key: 'department.delete.has_children', data: { childCount } },
      });
    }

    const current = await this.departmentModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId), isDeleted: false })
      .exec();

    if (!current) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: { key: 'department.not_found', data: {} },
      });
    }

    current.isDeleted = true;
    await current.save();

    return { success: true, data: { deleted: true } };
  }

  async getDepartmentMembers(id: string, user?: Express.User) {
    const tenantId = this.resolveTenantId(user);
    const members = await this.userModel
      .find({ tenantId: new Types.ObjectId(tenantId), departmentId: new Types.ObjectId(id), isDeleted: false })
      .lean()
      .exec();

    return {
      success: true,
      data: members.map((member) => ({
        id: String(member._id),
        email: member.email,
        fullName: member.fullName,
        status: member.status,
      })),
    };
  }

  private resolveTenantId(user?: Express.User): string {
    const tenantId = user?.tenantId;
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
      message: { key: 'department.access.denied', data: {} },
    });
  }

  private toDepartmentResponse(departmentDoc: any) {
    return {
      id: String(departmentDoc._id),
      tenantId: String(departmentDoc.tenantId),
      name: departmentDoc.name,
      code: departmentDoc.code ?? null,
      parentId: departmentDoc.parentId ? String(departmentDoc.parentId) : null,
      managerId: departmentDoc.managerId ? String(departmentDoc.managerId) : null,
      level: departmentDoc.level ?? 0,
      path: departmentDoc.path ?? '/',
      order: departmentDoc.order ?? 0,
      isActive: Boolean(departmentDoc.isActive),
    };
  }
}