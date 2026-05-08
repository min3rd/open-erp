import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument } from './schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
  ) {}

  async create(tenantId: string, dto: CreateEmployeeDto): Promise<EmployeeDocument> {
    this.logger.log(`[HR] Tenant ${tenantId} — createEmployee email="${dto.email}"`);
    const employee = new this.employeeModel({ ...dto, tenantId });
    return employee.save();
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: EmployeeDocument[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.employeeModel
        .find({ tenantId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.employeeModel.countDocuments({ tenantId }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(tenantId: string, id: string): Promise<EmployeeDocument> {
    const employee = await this.employeeModel.findOne({ _id: id, tenantId }).exec();
    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return employee;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateEmployeeDto,
  ): Promise<EmployeeDocument> {
    const employee = await this.employeeModel
      .findOneAndUpdate({ _id: id, tenantId }, { $set: dto }, { new: true })
      .exec();
    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return employee;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const result = await this.employeeModel.deleteOne({ _id: id, tenantId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
  }
}
