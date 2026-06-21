import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from '../../core/workflow/workflow.service';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('WorkflowController', () => {
  let controller: WorkflowController;
  let serviceMock: any;

  const mockWorkflowService = {
    createWorkflow: jest.fn(),
    findAllWorkflows: jest.fn(),
    getWorkflowById: jest.fn(),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowController],
      providers: [
        { provide: WorkflowService, useValue: mockWorkflowService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WorkflowController>(WorkflowController);
    serviceMock = module.get<WorkflowService>(WorkflowService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call createWorkflow and return success response with workflowId', async () => {
      const payload = { name: 'New Workflow', steps: [] };
      const req = { tenantId: 'tenant-123' };
      const mockResult = { id: 'wf-uuid-1' };
      serviceMock.createWorkflow.mockResolvedValue(mockResult);

      const response = await controller.create(payload, req);

      expect(serviceMock.createWorkflow).toHaveBeenCalledWith('tenant-123', payload);
      expect(response).toEqual({
        success: true,
        data: {
          workflowId: 'wf-uuid-1',
        },
      });
    });
  });

  describe('findAll', () => {
    it('should call findAllWorkflows and return success response with workflows list', async () => {
      const req = { tenantId: 'tenant-123' };
      const mockList = [{ id: 'wf-uuid-1' }, { id: 'wf-uuid-2' }];
      serviceMock.findAllWorkflows.mockResolvedValue(mockList);

      const response = await controller.findAll(req);

      expect(serviceMock.findAllWorkflows).toHaveBeenCalledWith('tenant-123');
      expect(response).toEqual({
        success: true,
        data: mockList,
      });
    });
  });

  describe('findOne', () => {
    it('should call getWorkflowById and return success response with the workflow', async () => {
      const req = { tenantId: 'tenant-123' };
      const mockWorkflow = { id: 'wf-uuid-1', name: 'Wf 1' };
      serviceMock.getWorkflowById.mockResolvedValue(mockWorkflow);

      const response = await controller.findOne('wf-uuid-1', req);

      expect(serviceMock.getWorkflowById).toHaveBeenCalledWith('wf-uuid-1', 'tenant-123');
      expect(response).toEqual({
        success: true,
        data: mockWorkflow,
      });
    });
  });
});
