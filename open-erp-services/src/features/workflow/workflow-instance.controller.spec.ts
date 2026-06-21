import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowInstanceController } from './workflow-instance.controller';
import { WorkflowInstanceService } from '../../core/workflow/workflow-instance.service';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';

describe('WorkflowInstanceController', () => {
  let controller: WorkflowInstanceController;
  let serviceMock: any;

  const mockService = {
    startInstance: jest.fn(),
    executeAction: jest.fn(),
    getInstanceById: jest.fn(),
  };

  const mockJwtService = { verifyAsync: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowInstanceController],
      providers: [
        { provide: WorkflowInstanceService, useValue: mockService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WorkflowInstanceController>(WorkflowInstanceController);
    serviceMock = module.get<WorkflowInstanceService>(WorkflowInstanceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startInstance', () => {
    it('should start a workflow instance successfully', async () => {
      serviceMock.startInstance.mockResolvedValue({
        id: 'inst-123',
        status: 'IN_PROGRESS',
        currentStepIds: ['step-1'],
      });

      const req = { tenantId: 'tenant-123', user: { userId: 'user-1' } };
      const result = await controller.startInstance('wf-123', { amount: 500 }, req);

      expect(result.success).toBe(true);
      expect(result.data.instanceId).toBe('inst-123');
      expect(serviceMock.startInstance).toHaveBeenCalledWith('tenant-123', 'wf-123', 'user-1', { amount: 500 });
    });

    it('should throw BadRequestException if workflowId is missing', async () => {
      const req = { tenantId: 't', user: { userId: 'u' } };
      await expect(controller.startInstance('', {}, req)).rejects.toThrow(BadRequestException);
    });
  });

  describe('executeAction', () => {
    it('should execute action successfully', async () => {
      serviceMock.executeAction.mockResolvedValue({
        id: 'inst-123',
        status: 'APPROVED',
        currentStepIds: [],
      });

      const req = { tenantId: 'tenant-123', user: { userId: 'user-1' } };
      const result = await controller.executeAction(
        'inst-123',
        'step-1',
        'APPROVE',
        'OK',
        '',
        null,
        '',
        req,
      );

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('APPROVED');
      expect(serviceMock.executeAction).toHaveBeenCalledWith('tenant-123', 'inst-123', 'user-1', {
        stepId: 'step-1',
        action: 'APPROVE',
        comment: 'OK',
        consultantId: '',
        formData: null,
        subWorkflowId: '',
      });
    });

    it('should throw BadRequestException if stepId or action is missing', async () => {
      const req = { tenantId: 't', user: { userId: 'u' } };
      await expect(
        controller.executeAction('inst-123', '', 'APPROVE', '', '', null, '', req),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return instance details', async () => {
      const mockInst = { id: 'inst-123', status: 'IN_PROGRESS' };
      serviceMock.getInstanceById.mockResolvedValue(mockInst);

      const result = await controller.findOne('inst-123', { tenantId: 'tenant-123' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInst);
    });
  });
});
