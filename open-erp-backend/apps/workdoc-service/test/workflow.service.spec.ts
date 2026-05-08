import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowService } from '../src/workflow/workflow.service';
import { WorkflowRequest } from '../src/workflow/schemas/workflow-request.schema';

const TENANT_A = 'tenant_A';

const mockPendingRequest = {
  _id: 'wf_id_1',
  tenantId: TENANT_A,
  entityType: 'purchase_order',
  entityId: 'po_001',
  requestedBy: 'user_1',
  status: 'pending',
  save: jest.fn(),
};

const mockApprovedRequest = {
  ...mockPendingRequest,
  status: 'approved',
  save: jest.fn(),
};

const mockWorkflowModel = {
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
};

function MockModel(data: any) {
  Object.assign(this, data);
  this.save = jest.fn().mockResolvedValue({ ...data, _id: 'new_wf_id' });
}

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        {
          provide: getModelToken(WorkflowRequest.name),
          useValue: Object.assign(MockModel, mockWorkflowModel),
        },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
  });

  describe('create', () => {
    it('should create a workflow request with tenantId and requestedBy', async () => {
      const dto = { entityType: 'purchase_order', entityId: 'po_001' };
      const result = await service.create(TENANT_A, dto, 'user_1');

      expect(result).toBeDefined();
      expect(result._id).toBe('new_wf_id');
    });
  });

  describe('findAll', () => {
    it('should filter workflow requests by tenantId', async () => {
      const items = [{ _id: 'wf1', tenantId: TENANT_A, status: 'pending' }];
      const chainMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(items),
      };
      mockWorkflowModel.find.mockReturnValue(chainMock);
      mockWorkflowModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(TENANT_A, 1, 10);

      expect(mockWorkflowModel.find).toHaveBeenCalledWith({ tenantId: TENANT_A });
      expect(result.items).toEqual(items);
      expect(result.total).toBe(1);
    });
  });

  describe('approve', () => {
    it('should approve a pending workflow request', async () => {
      const saveMock = jest.fn().mockResolvedValue({ ...mockPendingRequest, status: 'approved' });
      const pendingDoc = { ...mockPendingRequest, save: saveMock };
      const execMock = jest.fn().mockResolvedValue(pendingDoc);
      mockWorkflowModel.findOne.mockReturnValue({ exec: execMock });

      const result = await service.approve(TENANT_A, 'wf_id_1', 'approver_1', 'LGTM');

      expect(result.status).toBe('approved');
      expect(saveMock).toHaveBeenCalled();
    });

    it('should throw BadRequestException when approving non-pending workflow', async () => {
      const execMock = jest.fn().mockResolvedValue(mockApprovedRequest);
      mockWorkflowModel.findOne.mockReturnValue({ exec: execMock });

      await expect(
        service.approve(TENANT_A, 'wf_id_1', 'approver_2'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when workflow not found', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      mockWorkflowModel.findOne.mockReturnValue({ exec: execMock });

      await expect(
        service.approve(TENANT_A, 'nonexistent', 'approver_1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reject', () => {
    it('should reject a pending workflow request with reason', async () => {
      const saveMock = jest.fn().mockResolvedValue({ ...mockPendingRequest, status: 'rejected' });
      const pendingDoc = { ...mockPendingRequest, save: saveMock };
      const execMock = jest.fn().mockResolvedValue(pendingDoc);
      mockWorkflowModel.findOne.mockReturnValue({ exec: execMock });

      const result = await service.reject(TENANT_A, 'wf_id_1', 'reviewer_1', 'Missing info');

      expect(result.status).toBe('rejected');
      expect(saveMock).toHaveBeenCalled();
    });

    it('should throw BadRequestException when rejecting non-pending workflow', async () => {
      const execMock = jest.fn().mockResolvedValue({ ...mockPendingRequest, status: 'rejected' });
      mockWorkflowModel.findOne.mockReturnValue({ exec: execMock });

      await expect(
        service.reject(TENANT_A, 'wf_id_1', 'reviewer_1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
