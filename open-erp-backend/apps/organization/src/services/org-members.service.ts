import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Mongoose, SchemaTypes, Types } from 'mongoose';
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
import { MinioService } from '@shared/services/minio/minio.service';
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
    private readonly minioService: MinioService,
  ) {}

  // ── Members ──────────────────────────────────────────────────────────────

  async getMembers(
    orgId: string,
    query: MembersQueryDto,
  ): Promise<{ items: any[]; total: number }> {
    const page = query.page ?? 1;
    const size = query.size ?? query.limit ?? 20;
    const skip = (page - 1) * size;

    // If text search is provided, first find matching user IDs
    let userIdFilter: Types.ObjectId[] | null = null;
    if (query.q) {
      const q = query.q.trim();
      const regex = new RegExp(q, 'i');
      const matchingUsers = await this.userModel
        .find({
          $or: [
            { fullName: regex },
            { firstName: regex },
            { lastName: regex },
            { email: regex },
            { username: regex },
          ],
        })
        .select('_id')
        .limit(500)
        .exec();
      userIdFilter = matchingUsers.map((u) => u._id as Types.ObjectId);
    }

    const filter: any = {
      organizationId: new Types.ObjectId(orgId),
      deletedAt: null,
    };

    if (userIdFilter !== null) {
      filter.userId = { $in: userIdFilter };
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.role) {
      filter.roles = query.role;
    }
    if (query.department) {
      filter['assignments.departmentId'] = new Types.ObjectId(query.department);
    }
    if (query.position) {
      filter['assignments.positionIds'] = new Types.ObjectId(query.position);
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
        .populate('userId', 'fullName firstName lastName email username avatar avatarUrl')
        .populate('assignments.departmentId', 'name code')
        .populate('assignments.positionIds', 'name code level')
        .sort(sort)
        .skip(skip)
        .limit(size)
        .exec(),
      this.memberModel.countDocuments(filter).exec(),
    ]);

    // Map results and generate presigned avatar URLs
    const items = await Promise.all(
      memberships.map(async (m) => {
        const user = m.userId as any;

        // Generate presigned URL for avatar
        let avatarUrl: string | null = null;
        const avatarData = user?.avatar;
        const avatarKey = avatarData?.key || user?.avatarUrl;
        if (avatarKey) {
          try {
            const presignResult = await this.minioService.presignDownload(avatarKey, {
              bucket: avatarData?.bucket,
            });
            avatarUrl = presignResult.url;
          } catch (err) {
            this.logger.warn(`Failed to generate presigned avatar URL: ${err.message}`);
          }
        }

        const assignments = (m.assignments ?? []).map((a: any) => {
          const dept = a.departmentId as any;
          return {
            departmentId: dept?._id?.toHexString?.() ?? String(a.departmentId),
            departmentName: dept?.name ?? '',
            departmentCode: dept?.code ?? '',
            positionIds: (a.positionIds ?? []).map((p: any) => ({
              id: p?._id?.toHexString?.() ?? String(p),
              name: p?.name ?? '',
              code: p?.code ?? '',
              level: p?.level ?? 0,
            })),
          };
        });

        // Flatten for compatibility: distinct departments and positions
        const departments = assignments.map((a) => ({
          id: a.departmentId,
          name: a.departmentName,
          code: a.departmentCode,
        }));
        const positionsMap = new Map<string, any>();
        assignments.forEach((a) =>
          a.positionIds.forEach((p) => {
            if (!positionsMap.has(p.id)) positionsMap.set(p.id, p);
          }),
        );
        const positions = Array.from(positionsMap.values());

        return {
          id: (m._id as any).toHexString(),
          userId: user?._id?.toHexString?.() ?? String(m.userId),
          name:
            user?.fullName ??
            `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() ??
            '',
          email: user?.email ?? '',
          username: user?.username ?? '',
          avatar: avatarUrl,
          departments,
          positions,
          assignments,
          roles: m.roles,
          status: m.status,
          joinedAt: m.joinedAt,
          isPrimaryOwner: m.isPrimaryOwner,
        };
      }),
    );

    return { items, total };
  }

  async updateMember(
    orgId: string,
    memberId: string,
    updateDto: { status?: MemberStatus; roles?: string[] },
  ): Promise<OrganizationMemberDocument> {
    const member = await this.memberModel
      .findOneAndUpdate(
        {
          _id: new SchemaTypes.ObjectId(memberId),
          organizationId: new SchemaTypes.ObjectId(orgId),
          deletedAt: null,
        },
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
    const assignments = dto.assignments.map((a) => ({
      departmentId: new SchemaTypes.ObjectId(a.departmentId),
      positionIds: (a.positionIds ?? []).map((id) => new SchemaTypes.ObjectId(id)),
    }));

    const member = await this.memberModel
      .findOneAndUpdate(
        {
          _id: new SchemaTypes.ObjectId(memberId),
          organizationId: new SchemaTypes.ObjectId(orgId),
          deletedAt: null,
        },
        { $set: { assignments } },
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
      .find({ organizationId: new SchemaTypes.ObjectId(orgId), deletedAt: null })
      .sort({ name: 1 })
      .exec();
  }

  async createDepartment(
    orgId: string,
    dto: CreateDepartmentDto,
  ): Promise<DepartmentDocument> {
    const existing = await this.departmentModel
      .findOne({ organizationId: new SchemaTypes.ObjectId(orgId), code: dto.code })
      .exec();
    if (existing) {
      throw new ConflictException(`Department with code '${dto.code}' already exists`);
    }

    const dept = new this.departmentModel({
      organizationId: orgId,
      name: dto.name,
      code: dto.code,
      description: dto.description,
      parentId: dto.parentId ? new mongoose.Types.ObjectId(dto.parentId) : null,
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
        {
          _id: new SchemaTypes.ObjectId(deptId),
          organizationId: new SchemaTypes.ObjectId(orgId),
          deletedAt: null,
        },
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
        {
          _id: new SchemaTypes.ObjectId(deptId),
          organizationId: new SchemaTypes.ObjectId(orgId),
          deletedAt: null,
        },
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
      .find({ organizationId: new SchemaTypes.ObjectId(orgId), deletedAt: null })
      .sort({ level: 1, name: 1 })
      .exec();
  }

  async createPosition(
    orgId: string,
    dto: CreatePositionDto,
  ): Promise<PositionDocument> {
    const existing = await this.positionModel
      .findOne({ organizationId: new SchemaTypes.ObjectId(orgId), code: dto.code })
      .exec();
    if (existing) {
      throw new ConflictException(`Position with code '${dto.code}' already exists`);
    }

    const position = new this.positionModel({
      organizationId: new SchemaTypes.ObjectId(orgId),
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
        {
          _id: new SchemaTypes.ObjectId(posId),
          organizationId: new SchemaTypes.ObjectId(orgId),
          deletedAt: null,
        },
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
        {
          _id: new SchemaTypes.ObjectId(posId),
          organizationId: new SchemaTypes.ObjectId(orgId),
          deletedAt: null,
        },
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .exec();

    if (!position) {
      throw new NotFoundException('Position not found');
    }
  }
}
