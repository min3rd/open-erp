import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Department } from './entities/department.entity';
import { Employee } from './entities/employee.entity';
import { Branch } from './entities/branch.entity';
import { User } from '../../core/user/user.entity';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { SeedIndustryDto } from './dto/seed-industry.dto';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}


  async create(dto: CreateDepartmentDto, tenantId: string): Promise<Department> {
    if (dto.parentId) {
      const parent = await this.departmentRepository.findOne({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) {
        throw new NotFoundException({
          success: false,
          error: {
            code: 'PARENT_DEPARTMENT_NOT_FOUND',
            messageKey: 'org.parent_department_not_found',
          },
        });
      }
    }

    const department = this.departmentRepository.create({
      ...dto,
      tenantId,
    });
    return this.departmentRepository.save(department);
  }

  async findAllFlat(tenantId: string): Promise<Department[]> {
    return this.departmentRepository.find({
      where: { tenantId },
      relations: {
        branch: true,
        manager: true
      },
      order: { name: 'ASC' },
    });
  }

  async findAllTree(tenantId: string): Promise<any[]> {
    const flat = await this.departmentRepository.find({
      where: { tenantId },
      relations: {
        branch: true,
        manager: true
      },
      order: { name: 'ASC' },
    });

    const map = new Map<string, any>();
    for (const d of flat) {
      map.set(d.id, { ...d, children: [] });
    }

    const roots: any[] = [];
    for (const d of flat) {
      const mappedNode = map.get(d.id);
      if (d.parentId && map.has(d.parentId)) {
        const parentNode = map.get(d.parentId);
        parentNode.children.push(mappedNode);
      } else {
        roots.push(mappedNode);
      }
    }

    return roots;
  }

  async findOne(id: string, tenantId: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id, tenantId },
      relations: {
        branch: true,
        manager: true,
        children: true
      },
    });
    if (!department) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'DEPARTMENT_NOT_FOUND',
          messageKey: 'org.department_not_found',
        },
      });
    }
    return department;
  }

  async getEmployees(id: string, tenantId: string): Promise<Employee[]> {
    // Get employees for a specific department
    return this.employeeRepository.find({
      where: { departmentId: id, tenantId },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async getTenantUsers(tenantId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { tenantId },
      select: {
        id: true,
        email: true
      },
      order: { email: 'ASC' },
    });
  }


  async update(id: string, dto: UpdateDepartmentDto, tenantId: string): Promise<Department> {
    const department = await this.findOne(id, tenantId);

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'CIRCULAR_DEPENDENCY',
            messageKey: 'org.circular_dependency_error',
          },
        });
      }

      if (dto.parentId) {
        // Verify parent exists
        const parent = await this.departmentRepository.findOne({
          where: { id: dto.parentId, tenantId },
        });
        if (!parent) {
          throw new NotFoundException({
            success: false,
            error: {
              code: 'PARENT_DEPARTMENT_NOT_FOUND',
              messageKey: 'org.parent_department_not_found',
            },
          });
        }

        // Circular Loop Check using PostgreSQL recursive CTE
        const sql = `
          WITH RECURSIVE sub_departments AS (
              SELECT id, parent_id FROM departments WHERE id = $1 AND tenant_id = $2
              UNION ALL
              SELECT d.id, d.parent_id FROM departments d
              INNER JOIN sub_departments sd ON d.id = sd.parent_id
              WHERE d.tenant_id = $2
          )
          SELECT COUNT(*)::int as count FROM sub_departments WHERE id = $3;
        `;
        const queryResult = await this.departmentRepository.query(sql, [
          dto.parentId,
          tenantId,
          id,
        ]);
        const isCircular = queryResult && queryResult[0] && queryResult[0].count > 0;

        if (isCircular) {
          throw new BadRequestException({
            success: false,
            error: {
              code: 'CIRCULAR_DEPENDENCY',
              messageKey: 'org.circular_dependency_error',
            },
          });
        }
      }
    }

    Object.assign(department, dto);
    return this.departmentRepository.save(department);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const department = await this.findOne(id, tenantId);

    // 1. Orphan Prevention Rule
    const subDeptCount = await this.departmentRepository.count({
      where: { parentId: id, tenantId },
    });
    if (subDeptCount > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'ORPHAN_PREVENTION',
          messageKey: 'org.delete_orphan_error',
        },
      });
    }

    // 2. Active Employee Check Rule (employees with status 'Working' or 'Probationary')
    const activeEmpCount = await this.employeeRepository.count({
      where: {
        departmentId: id,
        tenantId,
        status: In(['Working', 'Probationary']),
      },
    });
    if (activeEmpCount > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'EMPLOYEE_ASSOCIATION',
          messageKey: 'org.delete_employee_error',
        },
      });
    }

    await this.departmentRepository.remove(department);
  }

  async seedDepartments(dto: SeedIndustryDto, tenantId: string): Promise<void> {
    const existingDeptsCount = await this.departmentRepository.count({
      where: { tenantId },
    });
    if (existingDeptsCount > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'ALREADY_HAS_DEPARTMENTS',
          messageKey: 'org.already_has_departments',
        },
      });
    }

    let branch = await this.branchRepository.findOne({
      where: { tenantId },
    });
    if (!branch) {
      branch = this.branchRepository.create({
        tenantId,
        name: 'Trụ sở chính',
        address: 'Trụ sở chính công ty',
      });
      branch = await this.branchRepository.save(branch);
    }

    interface SeedNode {
      name: string;
      children?: SeedNode[];
    }

    const templates: Record<string, SeedNode[]> = {
      technology: [
        {
          name: 'Ban Giám Đốc',
          children: [
            {
              name: 'Khối Công Nghệ & Sản Phẩm',
              children: [
                { name: 'Phòng Phát Triển Phần Mềm' },
                { name: 'Phòng Đảm Bảo Chất Lượng (QA)' },
                { name: 'Phòng Quản Trị Hệ Thống (DevOps)' },
              ],
            },
            {
              name: 'Khối Kinh Doanh & Marketing',
              children: [
                { name: 'Phòng Kinh Doanh (Sales)' },
                { name: 'Phòng Marketing & Thương Hiệu' },
              ],
            },
            {
              name: 'Khối Vận Hành & Hỗ Trợ',
              children: [
                { name: 'Phòng Hành Chính Nhân Sự' },
                { name: 'Phòng Kế Toán Tài Chính' },
              ],
            },
          ],
        },
      ],
      retail: [
        {
          name: 'Ban Giám Đốc',
          children: [
            {
              name: 'Khối Vận Hành Chuỗi Cửa Hàng',
              children: [
                { name: 'Phòng Quản Lý Cửa Hàng' },
                { name: 'Phòng Dịch Vụ Khách Hàng' },
              ],
            },
            {
              name: 'Khối Chuỗi Cung Ứng & Mua Hàng',
              children: [
                { name: 'Phòng Mua Hàng (Procurement)' },
                { name: 'Phòng Quản Lý Kho & Logistics' },
              ],
            },
            {
              name: 'Khối Kinh Doanh & Tiếp Thị',
              children: [
                { name: 'Phòng Marketing' },
                { name: 'Phòng Bán Hàng Online' },
              ],
            },
            {
              name: 'Khối Hành Chính & Hỗ Trợ',
              children: [
                { name: 'Phòng Nhân Sự' },
                { name: 'Phòng Kế Toán' },
              ],
            },
          ],
        },
      ],
      manufacturing: [
        {
          name: 'Ban Giám Đốc',
          children: [
            {
              name: 'Khối Quản Lý Sản Xuất',
              children: [
                { name: 'Phân Xưởng Sản Xuất Chính' },
                { name: 'Phòng Quản Lý Chất Lượng (QC)' },
                { name: 'Tổ Bảo Trì & Kỹ Thuật Thiết Bị' },
              ],
            },
            {
              name: 'Khối Kế Hoạch & Vật Tư',
              children: [
                { name: 'Phòng Kế Hoạch Sản Xuất' },
                { name: 'Phòng Cung Ứng Vật Tư' },
              ],
            },
            {
              name: 'Khối Kinh Doanh & Bán Hàng',
              children: [
                { name: 'Phòng Bán Hàng Dự Án' },
                { name: 'Phòng Phát Triển Thị Trường' },
              ],
            },
            {
              name: 'Khối Hành Chính & Kế Toán',
              children: [
                { name: 'Phòng Hành Chính Nhân Sự' },
                { name: 'Phòng Kế Toán Tài Chính' },
              ],
            },
          ],
        },
      ],
      services: [
        {
          name: 'Ban Giám Đốc',
          children: [
            {
              name: 'Khối Dịch Vụ & Vận Hành',
              children: [
                { name: 'Bộ Phận Phục Vụ Khách Hàng' },
                { name: 'Bộ Phận Chăm Sóc Khách Hàng (Customer Success)' },
              ],
            },
            {
              name: 'Khối Kinh Doanh & Đối Tác',
              children: [
                { name: 'Phòng Sales & Phát Triển Đối Tác' },
                { name: 'Phòng Marketing & Sự Kiện' },
              ],
            },
            {
              name: 'Khối Quản Trị & Nhân Sự',
              children: [
                { name: 'Phòng Nhân Sự & Đào Tạo' },
                { name: 'Phòng Kế Toán' },
              ],
            },
          ],
        },
      ],
    };

    const template = templates[dto.industry];
    if (!template) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_INDUSTRY',
          messageKey: 'org.industry_invalid',
        },
      });
    }

    const saveNodes = async (nodes: SeedNode[], parentId: string | null = null) => {
      for (const node of nodes) {
        const dept = this.departmentRepository.create({
          tenantId,
          name: node.name,
          parentId,
          branchId: branch.id,
        });
        const savedDept = await this.departmentRepository.save(dept);
        if (node.children && node.children.length > 0) {
          await saveNodes(node.children, savedDept.id);
        }
      }
    };

    await saveNodes(template);
  }
}
