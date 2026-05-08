import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { LeaveRequestService } from '../src/leave-request/leave-request.service';
import { LeaveRequest } from '../src/leave-request/schemas/leave-request.schema';

const TENANT_A = 'tenant_A';

const mockLeaveRequest = {
  _id: 'leave_id_1',
  tenantId: TENANT_A,
  employeeId: 'emp_id_1',
  leaveType: 'annual',
  startDate: new Date('2026-05-10'),
  endDate: new Date('2026-05-12'),
  status: 'pending',
};

const mockLeaveRequestModel = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
};

function MockModel(data: any) {
  Object.assign(this, data);
  this.save = jest.fn().mockResolvedValue({ ...data, _id: 'new_leave_id' });
}

describe('LeaveRequestService', () => {
  let service: LeaveRequestService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveRequestService,
        {
          provide: getModelToken(LeaveRequest.name),
          useValue: Object.assign(MockModel, mockLeaveRequestModel),
        },
      ],
    }).compile();

    service = module.get<LeaveRequestService>(LeaveRequestService);
  });

  describe('create', () => {
    it('should create a leave request with tenantId', async () => {
      const dto = {
        employeeId: 'emp_id_1',
        leaveType: 'annual',
        startDate: '2026-05-10',
        endDate: '2026-05-12',
        reason: 'Vacation',
      };
      const result = await service.create(TENANT_A, dto);

      expect(result).toBeDefined();
      expect(result._id).toBe('new_leave_id');
    });
  });

  describe('findAll', () => {
    it('should filter leave requests by tenantId', async () => {
      const items = [mockLeaveRequest];
      const chainMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(items),
      };
      mockLeaveRequestModel.find.mockReturnValue(chainMock);
      mockLeaveRequestModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(TENANT_A, 1, 10);

      expect(mockLeaveRequestModel.find).toHaveBeenCalledWith({ tenantId: TENANT_A });
      expect(result.items).toEqual(items);
      expect(result.total).toBe(1);
    });
  });

  describe('approve', () => {
    it('should set status to approved and record approvedBy', async () => {
      const approved = { ...mockLeaveRequest, status: 'approved', approvedBy: 'manager_1' };
      mockLeaveRequestModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(approved),
      });

      const result = await service.approve(TENANT_A, 'leave_id_1', 'manager_1');

      expect(result.status).toBe('approved');
      expect(result.approvedBy).toBe('manager_1');
      expect(mockLeaveRequestModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'leave_id_1', tenantId: TENANT_A },
        { $set: { status: 'approved', approvedBy: 'manager_1' } },
        { new: true },
      );
    });

    it('should throw NotFoundException when approving non-existent request', async () => {
      mockLeaveRequestModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.approve(TENANT_A, 'nonexistent', 'manager_1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reject', () => {
    it('should set status to rejected with rejectionReason', async () => {
      const rejected = {
        ...mockLeaveRequest,
        status: 'rejected',
        approvedBy: 'manager_1',
        rejectionReason: 'Insufficient leave balance',
      };
      mockLeaveRequestModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(rejected),
      });

      const result = await service.reject(TENANT_A, 'leave_id_1', 'manager_1', {
        rejectionReason: 'Insufficient leave balance',
      });

      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe('Insufficient leave balance');
    });

    it('should throw NotFoundException when rejecting non-existent request', async () => {
      mockLeaveRequestModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.reject(TENANT_A, 'nonexistent', 'manager_1', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
