import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowInstanceService } from './workflow-instance.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { WorkflowApprover } from './entities/workflow-approver.entity';
import { Workflow } from './entities/workflow.entity';
import { WorkflowConsultation } from './entities/workflow-consultation.entity';
import { WorkflowLogService } from './workflow-log.service';
import { DocumentTemplateService } from '../document-template/document-template.service';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { User } from '../user/user.entity';
import { Employee } from '../../features/org/entities/employee.entity';


describe('WorkflowInstanceService', () => {
  let service: WorkflowInstanceService;
  let instanceRepoMock: any;
  let stepRepoMock: any;
  let approverRepoMock: any;
  let workflowRepoMock: any;
  let consultationRepoMock: any;
  let logServiceMock: any;
  let templateServiceMock: any;
  let dataSourceMock: any;
  let mockManager: any;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockManager = {
      save: jest.fn().mockImplementation((entityOrClass, entity) => {
        const obj = entity ? entity : entityOrClass;
        if (!obj.id) obj.id = 'gen-uuid-456';
        return Promise.resolve(obj);
      }),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    dataSourceMock = {
      transaction: jest.fn((cb) => cb(mockManager)),
    };

    logServiceMock = {
      writeLog: jest.fn().mockResolvedValue({}),
    };

    templateServiceMock = {
      generateDocument: jest.fn().mockResolvedValue({}),
    };

    const notificationClientMock = {
      emit: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowInstanceService,
        { provide: getRepositoryToken(WorkflowInstance), useValue: mockRepository },
        { provide: getRepositoryToken(WorkflowStep), useValue: mockRepository },
        { provide: getRepositoryToken(WorkflowApprover), useValue: mockRepository },
        { provide: getRepositoryToken(Workflow), useValue: mockRepository },
        { provide: getRepositoryToken(WorkflowConsultation), useValue: mockRepository },
        { provide: WorkflowLogService, useValue: logServiceMock },
        { provide: DocumentTemplateService, useValue: templateServiceMock },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: 'NOTIFICATION_SERVICE', useValue: notificationClientMock },
      ],
    }).compile();

    service = module.get<WorkflowInstanceService>(WorkflowInstanceService);
    instanceRepoMock = module.get(getRepositoryToken(WorkflowInstance));
    stepRepoMock = module.get(getRepositoryToken(WorkflowStep));
    approverRepoMock = module.get(getRepositoryToken(WorkflowApprover));
    workflowRepoMock = module.get(getRepositoryToken(Workflow));
    consultationRepoMock = module.get(getRepositoryToken(WorkflowConsultation));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startInstance', () => {
    it('should start instance successfully', async () => {
      const mockWorkflow = {
        id: 'wf-1',
        name: 'WF1',
        steps: [
          { id: 'step-start', stepType: 'START', nextStepIds: ['step-app'] },
          { id: 'step-app', stepType: 'APPROVAL', nextStepIds: ['step-end'] },
          { id: 'step-end', stepType: 'END', nextStepIds: [] },
        ],
      };

      workflowRepoMock.findOne.mockResolvedValue(mockWorkflow);
      mockManager.findOne.mockResolvedValue({ id: 'instance-123', status: 'IN_PROGRESS' });
      mockManager.find.mockResolvedValue([]); // No step assignees for simplicity

      const result = await service.startInstance('tenant-1', 'wf-1', 'user-1', { totalAmount: 1000 });
      expect(result).toBeDefined();
      expect(result.id).toBe('instance-123');
      expect(logServiceMock.writeLog).toHaveBeenCalledWith('tenant-1', expect.any(String), 'step-start', 'SUBMIT', 'user-1', { totalAmount: 1000 });
    });

    it('should throw NotFoundException if workflow not found', async () => {
      workflowRepoMock.findOne.mockResolvedValue(null);
      await expect(service.startInstance('tenant-1', 'wf-invalid', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should resolve fallback assignee when main assignee list is empty', async () => {
      const mockWorkflow = {
        id: 'wf-1',
        name: 'WF1',
        steps: [
          { id: 'step-start', stepType: 'START', nextStepIds: ['step-app'] },
          {
            id: 'step-app',
            stepType: 'APPROVAL',
            config: {
              fallbackAssignee: { type: 'USER', value: 'fallback-user-uuid' },
            },
            nextStepIds: ['step-end'],
          },
          { id: 'step-end', stepType: 'END', nextStepIds: [] },
        ],
      };

      workflowRepoMock.findOne.mockResolvedValue(mockWorkflow);
      mockManager.findOne.mockImplementation((entityClass, options) => {
        // When checking for fallback user
        if (entityClass === User) {
          return Promise.resolve({ id: 'fallback-user-uuid', email: 'fallback@example.com' });
        }
        // When finding saved instance
        return Promise.resolve({ id: 'instance-123', status: 'IN_PROGRESS' });
      });

      // No assignees in the workflow_step_assignees table
      mockManager.find.mockResolvedValue([]);

      const result = await service.startInstance('tenant-1', 'wf-1', 'user-1', {});
      expect(result).toBeDefined();

      // Check if fallback user was saved as approver
      const saveCalls = mockManager.save.mock.calls;
      const savedApproverList = saveCalls.find((call) => {
        const arg = call[1] || call[0];
        if (Array.isArray(arg)) {
          return arg.some((a) => a.userId === 'fallback-user-uuid');
        }
        return arg && arg.userId === 'fallback-user-uuid';
      });
      expect(savedApproverList).toBeDefined();
    });
  });

  describe('executeAction', () => {
    it('should successfully APPROVE a step and complete if consensus is met', async () => {
      const mockInstance = {
        id: 'inst-123',
        tenantId: 'tenant-1',
        status: 'IN_PROGRESS',
        currentStepIds: ['step-1'],
        contextData: {},
      };

      const mockStep = {
        id: 'step-1',
        stepType: 'APPROVAL',
        config: { consensusRule: 'ANY' },
        nextStepIds: ['step-end'],
      };

      const mockApproverTask = {
        id: 'task-1',
        instanceId: 'inst-123',
        stepId: 'step-1',
        userId: 'user-approver',
        status: 'PENDING',
      };

      instanceRepoMock.findOne.mockResolvedValue(mockInstance);
      approverRepoMock.findOne.mockResolvedValue(mockApproverTask);

      let findOneCount = 0;
      mockManager.findOne.mockImplementation((entityClass, options) => {
        findOneCount++;
        if (findOneCount === 1) {
          return Promise.resolve(mockStep);
        }
        if (findOneCount === 2) {
          return Promise.resolve({ id: 'step-end', stepType: 'END', nextStepIds: [] });
        }
        return Promise.resolve({
          id: 'inst-123',
          status: 'APPROVED',
          currentStepIds: [],
        });
      });

      // checkConsensusInTransaction returns true because one approved meets ANY
      mockManager.find.mockImplementation((entityClass, options) => {
        if (options?.where?.instanceId && options?.where?.stepId) {
          return Promise.resolve([ { status: 'APPROVED' } ]);
        }
        return Promise.resolve([]);
      });

      mockManager.save.mockImplementation((entityOrClass, entity) => {
        const obj = entity ? entity : entityOrClass;
        return Promise.resolve(obj);
      });

      const payload = { stepId: 'step-1', action: 'APPROVE', comment: 'Approved!' };
      const result = await service.executeAction('tenant-1', 'inst-123', 'user-approver', payload);

      expect(result).toBeDefined();
      expect(result.status).toBe('APPROVED');
      expect(logServiceMock.writeLog).toHaveBeenCalledWith('tenant-1', 'inst-123', 'step-1', 'APPROVE', 'user-approver', { comment: 'Approved!', formData: undefined });
      expect(logServiceMock.writeLog).toHaveBeenCalledWith('tenant-1', 'inst-123', 'step-1', 'STEP_COMPLETED', 'user-approver', null);
    });

    it('should REJECT the workflow instance', async () => {
      const mockInstance = { id: 'inst-123', tenantId: 'tenant-1', status: 'IN_PROGRESS' };
      const mockApproverTask = { id: 'task-1', status: 'PENDING' };

      instanceRepoMock.findOne.mockResolvedValue(mockInstance);
      approverRepoMock.findOne.mockResolvedValue(mockApproverTask);

      mockManager.findOne.mockResolvedValue({ id: 'inst-123', status: 'REJECTED' });

      const payload = { stepId: 'step-1', action: 'REJECT', comment: 'Rejected!' };
      const result = await service.executeAction('tenant-1', 'inst-123', 'user-approver', payload);

      expect(result).toBeDefined();
      expect(result.status).toBe('REJECTED');
      expect(logServiceMock.writeLog).toHaveBeenCalledWith('tenant-1', 'inst-123', 'step-1', 'REJECT', 'user-approver', { comment: 'Rejected!' });
    });

    it('should freeze step on CONSULT and block regular approval', async () => {
      const mockInstance = { id: 'inst-123', tenantId: 'tenant-1', status: 'IN_PROGRESS' };
      const mockApproverTask = { id: 'task-1', status: 'PENDING' };

      instanceRepoMock.findOne.mockResolvedValue(mockInstance);
      approverRepoMock.findOne.mockResolvedValue(mockApproverTask);

      mockManager.findOne.mockResolvedValue({ id: 'inst-123', status: 'AWAITING_CONSULTATION' });

      const payload = { stepId: 'step-1', action: 'CONSULT', consultantId: 'user-expert', comment: 'Need review' };
      const result = await service.executeAction('tenant-1', 'inst-123', 'user-approver', payload);

      expect(result).toBeDefined();
      expect(result.status).toBe('AWAITING_CONSULTATION');
      expect(logServiceMock.writeLog).toHaveBeenCalledWith('tenant-1', 'inst-123', 'step-1', 'CONSULT', 'user-approver', { consultantId: 'user-expert', comment: 'Need review' });
    });

    it('should respond to consultation on PROVIDE_FEEDBACK and resume instance', async () => {
      const mockInstance = { id: 'inst-123', tenantId: 'tenant-1', status: 'AWAITING_CONSULTATION' };
      const mockConsultation = { id: 'consult-1', instanceId: 'inst-123', stepId: 'step-1', consultantId: 'user-expert', status: 'PENDING' };
      const mockApproverTask = { id: 'task-consult', status: 'CONSULTING' };

      instanceRepoMock.findOne.mockResolvedValue(mockInstance);
      consultationRepoMock.findOne.mockResolvedValue(mockConsultation);
      
      let findOneCount = 0;
      mockManager.findOne.mockImplementation((entityClass, options) => {
        findOneCount++;
        if (findOneCount === 1) {
          return Promise.resolve(mockApproverTask);
        }
        return Promise.resolve({ id: 'inst-123', status: 'IN_PROGRESS' });
      });

      mockManager.find.mockResolvedValue([]); // other pending consultations (empty -> unfreeze)

      const payload = { stepId: 'step-1', action: 'PROVIDE_FEEDBACK', comment: 'All clear' };
      const result = await service.executeAction('tenant-1', 'inst-123', 'user-expert', payload);

      expect(result).toBeDefined();
      expect(result.status).toBe('IN_PROGRESS');
      expect(logServiceMock.writeLog).toHaveBeenCalledWith('tenant-1', 'inst-123', 'step-1', 'PROVIDE_FEEDBACK', 'user-expert', { feedback: 'All clear' });
    });
  });
});
