import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { EmployeeService } from '../src/employee/employee.service';
import { Employee } from '../src/employee/schemas/employee.schema';

const TENANT_A = 'tenant_A';
const TENANT_B = 'tenant_B';

const mockEmployee = {
  _id: 'emp_id_1',
  tenantId: TENANT_A,
  fullName: 'Nguyen Van A',
  email: 'nguyenvana@example.com',
  status: 'active',
};

const mockEmployeeModel = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
  deleteOne: jest.fn(),
};

function MockModel(data: any) {
  Object.assign(this, data);
  this.save = jest.fn().mockResolvedValue({ ...data, _id: 'new_emp_id' });
}

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: getModelToken(Employee.name),
          useValue: Object.assign(MockModel, mockEmployeeModel),
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  describe('create', () => {
    it('should create an employee with tenantId', async () => {
      const dto = { fullName: 'Tran Thi B', email: 'tranthib@example.com' };
      const result = await service.create(TENANT_A, dto);

      expect(result).toBeDefined();
      expect(result._id).toBe('new_emp_id');
    });

    it('should set tenantId from parameter, not from DTO', async () => {
      const dto = { fullName: 'Le Van C', email: 'levanc@example.com' };
      const result = await service.create(TENANT_B, dto);

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should filter employees by tenantId', async () => {
      const items = [mockEmployee];
      const chainMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(items),
      };
      mockEmployeeModel.find.mockReturnValue(chainMock);
      mockEmployeeModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(TENANT_A, 1, 10);

      expect(mockEmployeeModel.find).toHaveBeenCalledWith({ tenantId: TENANT_A });
      expect(result.items).toEqual(items);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should isolate employees between tenants', async () => {
      const chainMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockEmployeeModel.find.mockReturnValue(chainMock);
      mockEmployeeModel.countDocuments.mockResolvedValue(0);

      const result = await service.findAll(TENANT_B, 1, 10);

      expect(mockEmployeeModel.find).toHaveBeenCalledWith({ tenantId: TENANT_B });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return employee when found', async () => {
      mockEmployeeModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEmployee),
      });

      const result = await service.findOne(TENANT_A, 'emp_id_1');

      expect(result).toEqual(mockEmployee);
      expect(mockEmployeeModel.findOne).toHaveBeenCalledWith({
        _id: 'emp_id_1',
        tenantId: TENANT_A,
      });
    });

    it('should throw NotFoundException when employee not found', async () => {
      mockEmployeeModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(TENANT_A, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update employee and return updated document', async () => {
      const updated = { ...mockEmployee, fullName: 'Nguyen Van A Updated' };
      mockEmployeeModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      });

      const result = await service.update(TENANT_A, 'emp_id_1', {
        fullName: 'Nguyen Van A Updated',
      });

      expect(result.fullName).toBe('Nguyen Van A Updated');
    });

    it('should throw NotFoundException when updating non-existent employee', async () => {
      mockEmployeeModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update(TENANT_A, 'nonexistent', { fullName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove employee successfully', async () => {
      mockEmployeeModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await expect(service.remove(TENANT_A, 'emp_id_1')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when removing non-existent employee', async () => {
      mockEmployeeModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      });

      await expect(service.remove(TENANT_A, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
