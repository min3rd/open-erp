import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowService } from './workflow.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { WorkflowStepAssignee } from './entities/workflow-step-assignee.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowApprover } from './entities/workflow-approver.entity';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let workflowRepoMock: any;
  let mockManager: any;
  let dataSourceMock: any;
  let mockInstanceQueryBuilder: any;
  let mockApproverQueryBuilder: any;

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

    mockInstanceQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    mockApproverQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    dataSourceMock = {
      transaction: jest.fn((cb) => cb(mockManager)),
      getRepository: jest.fn((entityClass) => {
        if (entityClass === WorkflowInstance) {
          return {
            createQueryBuilder: jest.fn(() => mockInstanceQueryBuilder),
          };
        }
        if (entityClass === WorkflowApprover) {
          return {
            createQueryBuilder: jest.fn(() => mockApproverQueryBuilder),
          };
        }
        return null;
      }),
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

  describe('getPerformanceAnalytics', () => {
    it('should return correct analytics calculations', async () => {
      const now = new Date();
      const mockInstances = [
        {
          id: 'inst-1',
          status: 'APPROVED',
          createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000), // 10 hours ago
          workflow: { name: 'Workflow Test' },
          approvers: [
            {
              id: 'app-1',
              status: 'APPROVED',
              deadlineAt: new Date(now.getTime() - 8 * 60 * 60 * 1000), // deadline 8 hours ago
              actionAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // approved 6 hours ago (delayed 2h)
            }
          ]
        },
        {
          id: 'inst-2',
          status: 'PENDING',
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          workflow: { name: 'Workflow Test' },
          approvers: [
            {
              id: 'app-2',
              status: 'PENDING',
              deadlineAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // deadline 1 hour ago (overdue now)
              actionAt: null,
            }
          ]
        }
      ];

      const mockApproverTasks = [
        {
          id: 'app-1',
          userId: 'usr-1',
          status: 'APPROVED',
          assignedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
          actionAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // processing took 4 hours
          deadlineAt: new Date(now.getTime() - 8 * 60 * 60 * 1000), // delayed
          user: { firstName: 'Alice', lastName: 'Smith', email: 'alice@test.com' },
        },
        {
          id: 'app-2',
          userId: 'usr-2',
          status: 'PENDING',
          assignedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          actionAt: null,
          deadlineAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // overdue now
          user: { firstName: 'Bob', lastName: 'Jones', email: 'bob@test.com' },
        }
      ];

      mockInstanceQueryBuilder.getMany.mockResolvedValue(mockInstances);
      mockApproverQueryBuilder.getMany.mockResolvedValue(mockApproverTasks);

      const result = await service.getPerformanceAnalytics('tenant-1', {
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: now.toISOString(),
      });

      expect(result).toBeDefined();
      expect(result.overallStats.totalInstances).toBe(2);
      // Completed is only inst-1. inst-1 took: MAX(actionAt) [now-6h] - createdAt [now-10h] = 4 hours
      expect(result.overallStats.averageCompletionTimeHours).toBe(4);
      // Both inst-1 and inst-2 have delayed approvers, so delayedPercentage = 100%
      expect(result.overallStats.delayedPercentage).toBe(100);

      // User performance
      expect(result.userPerformance.length).toBe(2);
      
      const alice = result.userPerformance.find((u: any) => u.userId === 'usr-1');
      expect(alice).toBeDefined();
      expect(alice.userName).toBe('Alice Smith');
      expect(alice.assignedTasks).toBe(1);
      expect(alice.averageProcessTimeHours).toBe(4);
      expect(alice.delayedTasksCount).toBe(1);

      const bob = result.userPerformance.find((u: any) => u.userId === 'usr-2');
      expect(bob).toBeDefined();
      expect(bob.userName).toBe('Bob Jones');
      expect(bob.assignedTasks).toBe(1);
      expect(bob.averageProcessTimeHours).toBe(0);
      expect(bob.delayedTasksCount).toBe(1);
    });
  });
});
