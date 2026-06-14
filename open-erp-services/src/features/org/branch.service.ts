import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async create(dto: CreateBranchDto, tenantId: string): Promise<Branch> {
    const branch = this.branchRepository.create({
      ...dto,
      tenantId,
    });
    return this.branchRepository.save(branch);
  }

  async findAll(tenantId: string): Promise<Branch[]> {
    return this.branchRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id, tenantId },
    });
    if (!branch) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'BRANCH_NOT_FOUND',
          messageKey: 'org.branch_not_found',
        },
      });
    }
    return branch;
  }

  async update(id: string, dto: UpdateBranchDto, tenantId: string): Promise<Branch> {
    const branch = await this.findOne(id, tenantId);
    Object.assign(branch, dto);
    return this.branchRepository.save(branch);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const branch = await this.findOne(id, tenantId);
    await this.branchRepository.remove(branch);
  }
}
