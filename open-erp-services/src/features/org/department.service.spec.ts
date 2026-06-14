import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { Department } from './entities/department.entity';
import { Employee } from './entities/employee.entity';
import { User } from '../../core/user/user.entity';
import { Branch } from './entities/branch.entity';

describe('DepartmentService', () => {
  let service: DepartmentService;
  let deptRepository: Repository<Department>;
  let empRepository: Repository<Employee>;
  let userRepository: Repository<User>;
  let branchRepository: Repository<Branch>;

  const mockDeptRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
    query: jest.fn(),
  };

  const mockEmpRepository = {
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRepository = {
    find: jest.fn(),
  };

  const mockBranchRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentService,
        {
          provide: getRepositoryToken(Department),
          useValue: mockDeptRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmpRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: mockBranchRepository,
        },
      ],
    }).compile();

    service = module.get<DepartmentService>(DepartmentService);
    deptRepository = module.get<Repository<Department>>(getRepositoryToken(Department));
    empRepository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    branchRepository = module.get<Repository<Branch>>(getRepositoryToken(Branch));

    jest.clearAllMocks();
  });


  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update (circular check)', () => {
    it('should throw BadRequestException if parentId equals department id', async () => {
      const tenantId = 'tenant-uuid';
      const deptId = 'dept-uuid';

      mockDeptRepository.findOne.mockResolvedValue({ id: deptId, tenantId });

      await expect(
        service.update(deptId, { parentId: deptId }, tenantId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if circular query returns count > 0', async () => {
      const tenantId = 'tenant-uuid';
      const deptId = 'dept-1';
      const newParentId = 'dept-2';

      mockDeptRepository.findOne.mockResolvedValue({ id: deptId, tenantId });
      // Mock cycle detected in recursive check
      mockDeptRepository.query.mockResolvedValue([{ count: 1 }]);

      await expect(
        service.update(deptId, { parentId: newParentId }, tenantId),
      ).rejects.toThrow(BadRequestException);

      expect(mockDeptRepository.query).toHaveBeenCalled();
    });

    it('should succeed if no circular dependency is detected', async () => {
      const tenantId = 'tenant-uuid';
      const deptId = 'dept-1';
      const newParentId = 'dept-2';
      const deptMock = { id: deptId, tenantId, parentId: null };

      mockDeptRepository.findOne.mockResolvedValue(deptMock);
      mockDeptRepository.query.mockResolvedValue([{ count: 0 }]);
      mockDeptRepository.save.mockResolvedValue({ ...deptMock, parentId: newParentId });

      const result = await service.update(deptId, { parentId: newParentId }, tenantId);
      expect(result.parentId).toBe(newParentId);
    });
  });

  describe('remove (deletion rules)', () => {
    it('should throw BadRequestException if department has children (Orphan Block)', async () => {
      const tenantId = 'tenant-uuid';
      const deptId = 'dept-uuid';

      mockDeptRepository.findOne.mockResolvedValue({ id: deptId, tenantId });
      // Has 1 sub-department
      mockDeptRepository.count.mockResolvedValue(1);

      await expect(service.remove(deptId, tenantId)).rejects.toThrow(
        new BadRequestException({
          success: false,
          error: {
            code: 'ORPHAN_PREVENTION',
            messageKey: 'org.delete_orphan_error',
          },
        }),
      );
    });

    it('should throw BadRequestException if department has active employees', async () => {
      const tenantId = 'tenant-uuid';
      const deptId = 'dept-uuid';

      mockDeptRepository.findOne.mockResolvedValue({ id: deptId, tenantId });
      // Sub-departments count is 0
      mockDeptRepository.count.mockResolvedValue(0);
      // Active employees count is 2
      mockEmpRepository.count.mockResolvedValue(2);

      await expect(service.remove(deptId, tenantId)).rejects.toThrow(
        new BadRequestException({
          success: false,
          error: {
            code: 'EMPLOYEE_ASSOCIATION',
            messageKey: 'org.delete_employee_error',
          },
        }),
      );
    });

    it('should remove department if all blocks are clear', async () => {
      const tenantId = 'tenant-uuid';
      const deptId = 'dept-uuid';
      const deptMock = { id: deptId, tenantId };

      mockDeptRepository.findOne.mockResolvedValue(deptMock);
      mockDeptRepository.count.mockResolvedValue(0);
      mockEmpRepository.count.mockResolvedValue(0);
      mockDeptRepository.remove.mockResolvedValue(deptMock);

      await service.remove(deptId, tenantId);
      expect(mockDeptRepository.remove).toHaveBeenCalledWith(deptMock);
    });
  });

  describe('seedDepartments', () => {
    it('should throw BadRequestException if tenant already has departments', async () => {
      const tenantId = 'tenant-uuid';
      mockDeptRepository.count.mockResolvedValue(5);

      await expect(
        service.seedDepartments({ industry: 'technology' }, tenantId),
      ).rejects.toThrow(
        new BadRequestException({
          success: false,
          error: {
            code: 'ALREADY_HAS_DEPARTMENTS',
            messageKey: 'org.already_has_departments',
          },
        }),
      );
    });

    it('should seed departments successfully', async () => {
      const tenantId = 'tenant-uuid';
      mockDeptRepository.count.mockResolvedValue(0);
      mockBranchRepository.findOne.mockResolvedValue(null);
      mockBranchRepository.create.mockReturnValue({ id: 'branch-1', name: 'Trụ sở chính' });
      mockBranchRepository.save.mockResolvedValue({ id: 'branch-1', name: 'Trụ sở chính' });

      mockDeptRepository.create.mockImplementation((d) => ({ id: 'dept-mock', ...d }));
      mockDeptRepository.save.mockImplementation((d) => Promise.resolve(d));

      await service.seedDepartments({ industry: 'technology' }, tenantId);

      expect(mockBranchRepository.create).toHaveBeenCalled();
      expect(mockDeptRepository.create).toHaveBeenCalled();
      expect(mockDeptRepository.save).toHaveBeenCalled();
    });
  });
});

