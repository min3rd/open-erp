import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentService {
  private readonly logger = new Logger(DepartmentService.name);

  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
  ) {}

  async create(tenantId: string, dto: CreateDepartmentDto): Promise<DepartmentDocument> {
    this.logger.log(`[HR] Tenant ${tenantId} — createDepartment name="${dto.name}"`);
    const dept = new this.departmentModel({ ...dto, tenantId });
    return dept.save();
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: DepartmentDocument[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.departmentModel
        .find({ tenantId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.departmentModel.countDocuments({ tenantId }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(tenantId: string, id: string): Promise<DepartmentDocument> {
    const dept = await this.departmentModel.findOne({ _id: id, tenantId }).exec();
    if (!dept) {
      throw new NotFoundException(`Department ${id} not found`);
    }
    return dept;
  }

  async update(
    tenantId: string,
    id: string,
    dto: Partial<CreateDepartmentDto>,
  ): Promise<DepartmentDocument> {
    const dept = await this.departmentModel
      .findOneAndUpdate({ _id: id, tenantId }, { $set: dto }, { new: true })
      .exec();
    if (!dept) {
      throw new NotFoundException(`Department ${id} not found`);
    }
    return dept;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const result = await this.departmentModel.deleteOne({ _id: id, tenantId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Department ${id} not found`);
    }
  }
}
