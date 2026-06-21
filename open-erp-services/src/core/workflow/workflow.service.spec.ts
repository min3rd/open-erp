import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowService } from './workflow.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { WorkflowStepAssignee } from './entities/workflow-step-assignee.entity';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let workflowRepoMock: any;
  let mockManager: any;
  let dataSourceMock: any;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockManager = {
      save: jest.fn().mockImplementation((entityOrClass, entity) => {
        const obj = entity ? entity : entityOrClass;
        if (Array.isArray(obj)) {
          return Promise.resolve(obj);
        }
        if (!obj.id) {
          obj.id = 'gen-uuid-123';
        }
        return Promise.resolve(obj);
      }),
      findOne: jest.fn().mockImplementation((entityClass, options) => {
        return Promise.resolve({
          id: 'gen-uuid-123',
          name: 'Quy trình test',
          steps: [],
        });
      }),
    };

    dataSourceMock = {
      transaction: jest.fn((cb) => cb(mockManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        {
          provide: getRepositoryToken(Workflow),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(WorkflowStep),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(WorkflowStepAssignee),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
    workflowRepoMock = module.get(getRepositoryToken(Workflow));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWorkflow', () => {
    it('should throw BadRequestException if name is missing', async () => {
      const payload = {
        description: 'No name spec',
        steps: [],
      };
      await expect(service.createWorkflow('tenant-1', payload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if steps is missing or empty', async () => {
      const payload = {
        name: 'Quy trình mua hàng',
        steps: [],
      };
      await expect(service.createWorkflow('tenant-1', payload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if no START step is provided', async () => {
      const payload = {
        name: 'Quy trình mua hàng',
        steps: [
          { id: 'step_end', name: 'Kết thúc', stepOrder: 1, stepType: 'END', nextStepIds: [] },
        ],
      };
      await expect(service.createWorkflow('tenant-1', payload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if no END step is provided', async () => {
      const payload = {
        name: 'Quy trình mua hàng',
        steps: [
          { id: 'step_start', name: 'Bắt đầu', stepOrder: 1, stepType: 'START', nextStepIds: [] },
        ],
      };
      await expect(service.createWorkflow('tenant-1', payload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if nextStepId referenced does not exist', async () => {
      const payload = {
        name: 'Quy trình mua hàng',
        steps: [
          { id: 'step_start', name: 'Bắt đầu', stepOrder: 1, stepType: 'START', nextStepIds: ['step_nonexistent'] },
          { id: 'step_end', name: 'Kết thúc', stepOrder: 2, stepType: 'END', nextStepIds: [] },
        ],
      };
      await expect(service.createWorkflow('tenant-1', payload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if cycle is detected', async () => {
      const payload = {
        name: 'Quy trình tuần hoàn',
        steps: [
          { id: 'step_start', name: 'Bắt đầu', stepOrder: 1, stepType: 'START', nextStepIds: ['step_loop_1'] },
          { id: 'step_loop_1', name: 'Nhánh 1', stepOrder: 2, stepType: 'APPROVAL', nextStepIds: ['step_loop_2'] },
          { id: 'step_loop_2', name: 'Nhánh 2', stepOrder: 3, stepType: 'APPROVAL', nextStepIds: ['step_loop_1'] },
          { id: 'step_end', name: 'Kết thúc', stepOrder: 4, stepType: 'END', nextStepIds: [] },
        ],
      };
      await expect(service.createWorkflow('tenant-1', payload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create and return workflow successfully with UUID mapping and assignees extraction', async () => {
      const payload = {
        name: 'Quy trình rẽ nhánh song song',
        description: 'Fork / Join',
        steps: [
          { id: 'step_start', name: 'Bắt đầu', stepOrder: 1, stepType: 'START', nextStepIds: ['step_fork'] },
          { id: 'step_fork', name: 'Rẽ nhánh', stepOrder: 2, stepType: 'FORK', nextStepIds: ['step_branch_1', 'step_branch_2'] },
          {
            id: 'step_branch_1',
            name: 'Duyệt 1',
            stepOrder: 3,
            stepType: 'APPROVAL',
            nextStepIds: ['step_join'],
            config: {
              assignees: { type: 'ROLE', value: 'MANAGER' },
            },
          },
          {
            id: 'step_branch_2',
            name: 'Duyệt 2',
            stepOrder: 4,
            stepType: 'APPROVAL',
            nextStepIds: ['step_join'],
            config: {
              assignees: [
                { type: 'USER', value: 'user-uuid-1' },
                { type: 'DEPARTMENT', value: 'dept-uuid-2' },
              ],
            },
          },
          { id: 'step_join', name: 'Gộp nhánh', stepOrder: 5, stepType: 'JOIN', nextStepIds: ['step_end'] },
          { id: 'step_end', name: 'Kết thúc', stepOrder: 6, stepType: 'END', nextStepIds: [] },
        ],
      };

      const result = await service.createWorkflow('tenant-1', payload);

      expect(dataSourceMock.transaction).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('gen-uuid-123');
    });
  });

  describe('getWorkflowById', () => {
    it('should return workflow if exists', async () => {
      const mockWorkflow = { id: 'wf-1', name: 'Workflow 1', tenantId: 'tenant-1' };
      workflowRepoMock.findOne.mockResolvedValue(mockWorkflow);

      const result = await service.getWorkflowById('wf-1', 'tenant-1');
      expect(result).toEqual(mockWorkflow);
    });

    it('should throw NotFoundException if workflow does not exist', async () => {
      workflowRepoMock.findOne.mockResolvedValue(null);
      await expect(service.getWorkflowById('wf-missing', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllWorkflows', () => {
    it('should return list of workflows', async () => {
      const mockList = [{ id: 'wf-1' }, { id: 'wf-2' }];
      workflowRepoMock.find.mockResolvedValue(mockList);

      const result = await service.findAllWorkflows('tenant-1');
      expect(result).toEqual(mockList);
    });
  });
});
