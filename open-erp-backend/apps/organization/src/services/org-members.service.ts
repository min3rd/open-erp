import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Department,
  DepartmentDocument,
  Position,
  PositionDocument,
  OrganizationMember,
  OrganizationMemberDocument,
  User,
  UserDocument,
  MemberStatus,
} from '@shared/schemas';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreatePositionDto,
  UpdatePositionDto,
  AssignMemberDto,
  MembersQueryDto,
} from '../dto/org-members.dto';

@Injectable()
export class OrgMembersService {
  private readonly logger = new Logger(OrgMembersService.name);

  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
    @InjectModel(Position.name)
    private positionModel: Model<PositionDocument>,
    @InjectModel(OrganizationMember.name)
    private memberModel: Model<OrganizationMemberDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  // ── Members ──────────────────────────────────────────────────────────────

  async getMembers(
    orgId: string,
    query: MembersQueryDto,
  ): Promise<{ items: any[]; total: number }> {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const skip = (page - 1) * size;

    const filter: any = {
      organizationId: new Types.ObjectId(orgId),
      deletedAt: null,
    };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.role) {
      filter.roles = query.role;
    }
    if (query.department) {
      filter.departmentIds = new Types.ObjectId(query.department);
    }
    if (query.position) {
      filter.positionIds = new Types.ObjectId(query.position);
    }

    // Sort
    let sort: any = { createdAt: -1 };
    if (query.sort) {
      const [field, order] = query.sort.split(':');
      if (field) {
        sort = { [field]: order === 'asc' ? 1 : -1 };
      }
    }

    const [memberships, total] = await Promise.all([
      this.memberModel
        .find(filter)
        .populate('userId', 'fullName firstName lastName email username avatarUrl')
        .populate('departmentIds', 'id name code')
        .populate('positionIds', 'id name code level')
        .sort(sort)
        .skip(skip)
        .limit(size)
        .exec(),
      this.memberModel.countDocuments(filter).exec(),
    ]);

    // Apply search filter (on populated user fields) and map result
    let items = memberships.map((m) => {
      const user = m.userId as any;
      return {
        id: (m._id as any).toHexString(),
        userId: user?._id?.toHexString?.() ?? String(m.userId),
        name: user?.fullName ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() ?? '',
        email: user?.email ?? '',
        username: user?.username ?? '',
        avatar: user?.avatarUrl ?? null,
        departments: (m.departmentIds as any[]).map((d: any) => ({
          id: d._id?.toHexString?.() ?? String(d),
          name: d.name ?? '',
          code: d.code ?? '',
        })),
        positions: (m.positionIds as any[]).map((p: any) => ({
          id: p._id?.toHexString?.() ?? String(p),
          name: p.name ?? '',
          code: p.code ?? '',
          level: p.level ?? 0,
        })),
        roles: m.roles,
        status: m.status,
        joinedAt: m.joinedAt,
        isPrimaryOwner: m.isPrimaryOwner,
      };
    });

    // Text search on name/email/username (applied after population)
    if (query.q) {
      const q = query.q.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.username.toLowerCase().includes(q),
      );
    }

    return { items, total: query.q ? items.length : total };
  }

  async updateMember(
    orgId: string,
    memberId: string,
    updateDto: { status?: MemberStatus; roles?: string[] },
  ): Promise<OrganizationMemberDocument> {
    const member = await this.memberModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(memberId), organizationId: new Types.ObjectId(orgId), deletedAt: null },
        { $set: updateDto },
        { new: true },
      )
      .exec();

    if (!member) {
      throw new NotFoundException('Member not found');
    }
    return member;
  }

  async assignMember(
    orgId: string,
    memberId: string,
    dto: AssignMemberDto,
  ): Promise<OrganizationMemberDocument> {
    const update: any = {};
    if (dto.departments !== undefined) {
      update.departmentIds = dto.departments.map((id) => new Types.ObjectId(id));
    }
    if (dto.positions !== undefined) {
      update.positionIds = dto.positions.map((id) => new Types.ObjectId(id));
    }

    const member = await this.memberModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(memberId), organizationId: new Types.ObjectId(orgId), deletedAt: null },
        { $set: update },
        { new: true },
      )
      .exec();

    if (!member) {
      throw new NotFoundException('Member not found');
    }
    return member;
  }

  // ── Departments ───────────────────────────────────────────────────────────

  async getDepartments(orgId: string): Promise<DepartmentDocument[]> {
    return this.departmentModel
      .find({ organizationId: new Types.ObjectId(orgId), deletedAt: null })
      .sort({ name: 1 })
      .exec();
  }

  async createDepartment(
    orgId: string,
    dto: CreateDepartmentDto,
    createdBy: string,
  ): Promise<DepartmentDocument> {
    const existing = await this.departmentModel
      .findOne({ organizationId: new Types.ObjectId(orgId), code: dto.code })
      .exec();
    if (existing) {
      throw new ConflictException(`Department with code '${dto.code}' already exists`);
    }

    const dept = new this.departmentModel({
      organizationId: new Types.ObjectId(orgId),
      name: dto.name,
      code: dto.code,
      description: dto.description,
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
      status: 'active',
    });
    return dept.save();
  }

  async updateDepartment(
    orgId: string,
    deptId: string,
    dto: UpdateDepartmentDto,
  ): Promise<DepartmentDocument> {
    const dept = await this.departmentModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(deptId), organizationId: new Types.ObjectId(orgId), deletedAt: null },
        { $set: dto },
        { new: true },
      )
      .exec();

    if (!dept) {
      throw new NotFoundException('Department not found');
    }
    return dept;
  }

  async deleteDepartment(orgId: string, deptId: string): Promise<void> {
    const dept = await this.departmentModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(deptId), organizationId: new Types.ObjectId(orgId), deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .exec();

    if (!dept) {
      throw new NotFoundException('Department not found');
    }
  }

  // ── Positions ─────────────────────────────────────────────────────────────

  async getPositions(orgId: string): Promise<PositionDocument[]> {
    return this.positionModel
      .find({ organizationId: new Types.ObjectId(orgId), deletedAt: null })
      .sort({ level: 1, name: 1 })
      .exec();
  }

  async createPosition(
    orgId: string,
    dto: CreatePositionDto,
    createdBy: string,
  ): Promise<PositionDocument> {
    const existing = await this.positionModel
      .findOne({ organizationId: new Types.ObjectId(orgId), code: dto.code })
      .exec();
    if (existing) {
      throw new ConflictException(`Position with code '${dto.code}' already exists`);
    }

    const position = new this.positionModel({
      organizationId: new Types.ObjectId(orgId),
      name: dto.name,
      code: dto.code,
      description: dto.description,
      level: dto.level ?? 0,
      status: 'active',
    });
    return position.save();
  }

  async updatePosition(
    orgId: string,
    posId: string,
    dto: UpdatePositionDto,
  ): Promise<PositionDocument> {
    const position = await this.positionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(posId), organizationId: new Types.ObjectId(orgId), deletedAt: null },
        { $set: dto },
        { new: true },
      )
      .exec();

    if (!position) {
      throw new NotFoundException('Position not found');
    }
    return position;
  }

  async deletePosition(orgId: string, posId: string): Promise<void> {
    const position = await this.positionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(posId), organizationId: new Types.ObjectId(orgId), deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .exec();

    if (!position) {
      throw new NotFoundException('Position not found');
    }
  }
}
