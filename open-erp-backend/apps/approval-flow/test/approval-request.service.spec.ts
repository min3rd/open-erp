import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ApprovalRequestService } from '../src/services/approval-request.service';
import { ApprovalRequestRepository } from '../src/repositories/approval-request.repository';
import { WorkflowTemplateService } from '../src/services/workflow-template.service';
import { MinioService } from '@shared/services/minio/minio.service';
import {
  ApprovalRequestStatus,
  ApprovalActionType,
} from '@shared/schemas/approval-request.schema';
import {
  ApprovalMode,
  ApprovalScope,
  TemplateStatus,
  WorkflowNodeType,
} from '@shared/schemas/approval-workflow-template.schema';

describe('ApprovalRequestService', () => {
  let service: ApprovalRequestService;

  const userId1 = '507f1f77bcf86cd799439011';
  const userId2 = '507f1f77bcf86cd799439022';
  const userId3 = '507f1f77bcf86cd799439033';
  const requesterId = '507f1f77bcf86cd799439044';
  const templateId = '507f1f77bcf86cd799439055';
  const entityId = '507f1f77bcf86cd799439066';

  // Template with node-edge graph: start → approval1 → approval2 → end
  const mockTemplate = {
    _id: new Types.ObjectId(templateId),
    name: 'Document Approval',
    entityType: 'document',
    scope: ApprovalScope.GLOBAL,
    status: TemplateStatus.PUBLISHED,
    nodes: [
      {
        id: 'start-1',
        point: { x: 0, y: 200 },
        type: WorkflowNodeType.START,
        data: { label: 'Start' },
      },
      {
        id: 'approval-1',
        point: { x: 300, y: 200 },
        type: WorkflowNodeType.APPROVAL,
        data: {
          label: 'Manager Review',
          approverIds: [new Types.ObjectId(userId1)],
          approvalMode: ApprovalMode.ANY,
        },
      },
      {
        id: 'approval-2',
        point: { x: 600, y: 200 },
        type: WorkflowNodeType.APPROVAL,
        data: {
          label: 'Director Approval',
          approverIds: [
            new Types.ObjectId(userId2),
            new Types.ObjectId(userId3),
          ],
          approvalMode: ApprovalMode.ALL,
        },
      },
      {
        id: 'end-1',
        point: { x: 900, y: 200 },
        type: WorkflowNodeType.END,
        data: { label: 'End' },
      },
    ],
    edges: [
      { id: 'e1', source: 'start-1', target: 'approval-1' },
      { id: 'e2', source: 'approval-1', target: 'approval-2' },
      { id: 'e3', source: 'approval-2', target: 'end-1' },
    ],
  };

  // Request with node-edge data
  const mockRequest = {
    _id: new Types.ObjectId(),
    entityType: 'document',
    entityId: new Types.ObjectId(entityId),
    templateId: new Types.ObjectId(templateId),
    status: ApprovalRequestStatus.IN_PROGRESS,
    currentNodeId: 'approval-1',
    nodeStates: [
      {
        nodeId: 'approval-1',
        label: 'Manager Review',
        approverIds: [new Types.ObjectId(userId1)],
        approvalMode: ApprovalMode.ANY,
        status: ApprovalRequestStatus.IN_PROGRESS,
        approvals: [],
        startedAt: new Date(),
      },
      {
        nodeId: 'approval-2',
        label: 'Director Approval',
        approverIds: [
          new Types.ObjectId(userId2),
          new Types.ObjectId(userId3),
        ],
        approvalMode: ApprovalMode.ALL,
        status: ApprovalRequestStatus.PENDING,
        approvals: [],
      },
    ],
    edges: [
      { id: 'e1', source: 'start-1', target: 'approval-1' },
      { id: 'e2', source: 'approval-1', target: 'approval-2' },
      { id: 'e3', source: 'approval-2', target: 'end-1' },
    ],
    auditLog: [
      {
        action: 'REQUEST_CREATED',
        userId: new Types.ObjectId(requesterId),
        timestamp: new Date(),
      },
    ],
    requestedBy: new Types.ObjectId(requesterId),
  };

  const mockRequestRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    findByEntityTypeAndId: jest.fn(),
  };

  const mockTemplateService = {
    resolveTemplate: jest.fn(),
  };

  const mockMinioService = {
    getPresignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalRequestService,
        {
          provide: ApprovalRequestRepository,
          useValue: mockRequestRepo,
        },
        {
          provide: WorkflowTemplateService,
          useValue: mockTemplateService,
        },
        {
          provide: MinioService,
          useValue: mockMinioService,
        },
      ],
    }).compile();

    service = module.get<ApprovalRequestService>(ApprovalRequestService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a request, set currentNodeId to first approval node', async () => {
      mockRequestRepo.findByEntityTypeAndId.mockResolvedValue(null);
      mockTemplateService.resolveTemplate.mockResolvedValue(mockTemplate);
      mockRequestRepo.create.mockResolvedValue(mockRequest);

      const result = await service.create(
        {
          entityType: 'document',
          entityId,
        },
        requesterId,
      );

      expect(result).toEqual(mockRequest);
      expect(mockRequestRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'document',
          status: ApprovalRequestStatus.IN_PROGRESS,
          currentNodeId: 'approval-1',
        }),
      );
    });

    it('should throw when an active request already exists', async () => {
      mockRequestRepo.findByEntityTypeAndId.mockResolvedValue(mockRequest);

      await expect(
        service.create({ entityType: 'document', entityId }, requesterId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitAction', () => {
    it('should approve node in ANY mode and advance to next approval node', async () => {
      const request = JSON.parse(JSON.stringify(mockRequest));
      request._id = mockRequest._id;
      request.nodeStates[0].approverIds = [new Types.ObjectId(userId1)];
      request.requestedBy = new Types.ObjectId(requesterId);

      mockRequestRepo.findById.mockResolvedValue(request);
      mockRequestRepo.update.mockImplementation((id, data) => ({
        ...request,
        ...data,
      }));

      const result = await service.submitAction(
        request._id.toString(),
        { action: ApprovalActionType.APPROVE, comment: 'LGTM' },
        userId1,
      );

      expect(result.nodeStates[0].status).toBe(ApprovalRequestStatus.APPROVED);
      expect(result.currentNodeId).toBe('approval-2');
    });

    it('should reject the entire request on REJECT action', async () => {
      const request = JSON.parse(JSON.stringify(mockRequest));
      request._id = mockRequest._id;
      request.nodeStates[0].approverIds = [new Types.ObjectId(userId1)];
      request.requestedBy = new Types.ObjectId(requesterId);

      mockRequestRepo.findById.mockResolvedValue(request);
      mockRequestRepo.update.mockImplementation((id, data) => ({
        ...request,
        ...data,
      }));

      const result = await service.submitAction(
        request._id.toString(),
        { action: ApprovalActionType.REJECT, comment: 'Not acceptable' },
        userId1,
      );

      expect(result.status).toBe(ApprovalRequestStatus.REJECTED);
    });

    it('should throw ForbiddenException if user is not an approver', async () => {
      const request = JSON.parse(JSON.stringify(mockRequest));
      request._id = mockRequest._id;
      request.nodeStates[0].approverIds = [new Types.ObjectId(userId1)];
      request.requestedBy = new Types.ObjectId(requesterId);

      mockRequestRepo.findById.mockResolvedValue(request);

      await expect(
        service.submitAction(
          request._id.toString(),
          { action: ApprovalActionType.APPROVE },
          'non-approver-id-000000000000',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException on action for completed request', async () => {
      const request = JSON.parse(JSON.stringify(mockRequest));
      request._id = mockRequest._id;
      request.status = ApprovalRequestStatus.APPROVED;
      request.requestedBy = new Types.ObjectId(requesterId);

      mockRequestRepo.findById.mockResolvedValue(request);

      await expect(
        service.submitAction(
          request._id.toString(),
          { action: ApprovalActionType.APPROVE },
          userId1,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('evaluateNodeCompletion', () => {
    it('should return approved for ANY mode with 1 approval', () => {
      const nodeState = {
        nodeId: 'approval-1',
        label: 'Step',
        approverIds: [
          new Types.ObjectId(userId1),
          new Types.ObjectId(userId2),
        ],
        approvalMode: ApprovalMode.ANY,
        status: ApprovalRequestStatus.IN_PROGRESS,
        approvals: [
          {
            userId: new Types.ObjectId(userId1),
            action: ApprovalActionType.APPROVE,
            actionAt: new Date(),
          },
        ],
      };

      expect(service.evaluateNodeCompletion(nodeState as any)).toBe('approved');
    });

    it('should return pending for ALL mode with partial approvals', () => {
      const nodeState = {
        nodeId: 'approval-1',
        label: 'Step',
        approverIds: [
          new Types.ObjectId(userId1),
          new Types.ObjectId(userId2),
        ],
        approvalMode: ApprovalMode.ALL,
        status: ApprovalRequestStatus.IN_PROGRESS,
        approvals: [
          {
            userId: new Types.ObjectId(userId1),
            action: ApprovalActionType.APPROVE,
            actionAt: new Date(),
          },
        ],
      };

      expect(service.evaluateNodeCompletion(nodeState as any)).toBe('pending');
    });

    it('should return approved for ALL mode with all approvals', () => {
      const nodeState = {
        nodeId: 'approval-1',
        label: 'Step',
        approverIds: [
          new Types.ObjectId(userId1),
          new Types.ObjectId(userId2),
        ],
        approvalMode: ApprovalMode.ALL,
        status: ApprovalRequestStatus.IN_PROGRESS,
        approvals: [
          {
            userId: new Types.ObjectId(userId1),
            action: ApprovalActionType.APPROVE,
            actionAt: new Date(),
          },
          {
            userId: new Types.ObjectId(userId2),
            action: ApprovalActionType.APPROVE,
            actionAt: new Date(),
          },
        ],
      };

      expect(service.evaluateNodeCompletion(nodeState as any)).toBe('approved');
    });

    it('should return approved for QUORUM mode when quorum count is met', () => {
      const nodeState = {
        nodeId: 'approval-1',
        label: 'Step',
        approverIds: [
          new Types.ObjectId(userId1),
          new Types.ObjectId(userId2),
          new Types.ObjectId(userId3),
        ],
        approvalMode: ApprovalMode.QUORUM,
        quorumCount: 2,
        status: ApprovalRequestStatus.IN_PROGRESS,
        approvals: [
          {
            userId: new Types.ObjectId(userId1),
            action: ApprovalActionType.APPROVE,
            actionAt: new Date(),
          },
          {
            userId: new Types.ObjectId(userId2),
            action: ApprovalActionType.APPROVE,
            actionAt: new Date(),
          },
        ],
      };

      expect(service.evaluateNodeCompletion(nodeState as any)).toBe('approved');
    });

    it('should return pending for QUORUM mode when quorum not met', () => {
      const nodeState = {
        nodeId: 'approval-1',
        label: 'Step',
        approverIds: [
          new Types.ObjectId(userId1),
          new Types.ObjectId(userId2),
          new Types.ObjectId(userId3),
        ],
        approvalMode: ApprovalMode.QUORUM,
        quorumCount: 2,
        status: ApprovalRequestStatus.IN_PROGRESS,
        approvals: [
          {
            userId: new Types.ObjectId(userId1),
            action: ApprovalActionType.APPROVE,
            actionAt: new Date(),
          },
        ],
      };

      expect(service.evaluateNodeCompletion(nodeState as any)).toBe('pending');
    });

    it('should return rejected when any approver rejects', () => {
      const nodeState = {
        nodeId: 'approval-1',
        label: 'Step',
        approverIds: [
          new Types.ObjectId(userId1),
          new Types.ObjectId(userId2),
        ],
        approvalMode: ApprovalMode.ALL,
        status: ApprovalRequestStatus.IN_PROGRESS,
        approvals: [
          {
            userId: new Types.ObjectId(userId1),
            action: ApprovalActionType.REJECT,
            actionAt: new Date(),
          },
        ],
      };

      expect(service.evaluateNodeCompletion(nodeState as any)).toBe('rejected');
    });

    it('should return changes_requested when REQUEST_CHANGES is submitted', () => {
      const nodeState = {
        nodeId: 'approval-1',
        label: 'Step',
        approverIds: [
          new Types.ObjectId(userId1),
          new Types.ObjectId(userId2),
        ],
        approvalMode: ApprovalMode.ALL,
        status: ApprovalRequestStatus.IN_PROGRESS,
        approvals: [
          {
            userId: new Types.ObjectId(userId1),
            action: ApprovalActionType.REQUEST_CHANGES,
            actionAt: new Date(),
          },
        ],
      };

      expect(service.evaluateNodeCompletion(nodeState as any)).toBe(
        'changes_requested',
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a request by the requester', async () => {
      const request = JSON.parse(JSON.stringify(mockRequest));
      request._id = mockRequest._id;
      request.requestedBy = new Types.ObjectId(requesterId);

      mockRequestRepo.findById.mockResolvedValue(request);
      mockRequestRepo.update.mockImplementation((id, data) => ({
        ...request,
        ...data,
      }));

      const result = await service.cancel(request._id.toString(), requesterId);
      expect(result.status).toBe(ApprovalRequestStatus.CANCELLED);
    });

    it('should throw ForbiddenException if non-requester tries to cancel', async () => {
      const request = JSON.parse(JSON.stringify(mockRequest));
      request._id = mockRequest._id;
      request.requestedBy = new Types.ObjectId(requesterId);

      mockRequestRepo.findById.mockResolvedValue(request);

      await expect(
        service.cancel(request._id.toString(), userId1),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('resolveNextNode (graph traversal)', () => {
    it('should traverse start → approval node', () => {
      const nodes = [
        { id: 'start-1', type: WorkflowNodeType.START, point: { x: 0, y: 0 } },
        { id: 'approval-1', type: WorkflowNodeType.APPROVAL, point: { x: 100, y: 0 } },
        { id: 'end-1', type: WorkflowNodeType.END, point: { x: 200, y: 0 } },
      ];
      const edges = [
        { id: 'e1', source: 'start-1', target: 'approval-1' },
        { id: 'e2', source: 'approval-1', target: 'end-1' },
      ];

      const next = service.resolveNextNode('start-1', nodes, edges);
      expect(next).toBe('approval-1');
    });

    it('should return null when reaching end node', () => {
      const nodes = [
        { id: 'approval-1', type: WorkflowNodeType.APPROVAL, point: { x: 0, y: 0 } },
        { id: 'end-1', type: WorkflowNodeType.END, point: { x: 100, y: 0 } },
      ];
      const edges = [
        { id: 'e1', source: 'approval-1', target: 'end-1' },
      ];

      const next = service.resolveNextNode('approval-1', nodes, edges);
      expect(next).toBeNull();
    });

    it('should traverse through condition node following matching edge', () => {
      const nodes = [
        { id: 'approval-1', type: WorkflowNodeType.APPROVAL, point: { x: 0, y: 0 } },
        { id: 'condition-1', type: WorkflowNodeType.CONDITION, point: { x: 100, y: 0 } },
        { id: 'approval-2', type: WorkflowNodeType.APPROVAL, point: { x: 200, y: -100 } },
        { id: 'approval-3', type: WorkflowNodeType.APPROVAL, point: { x: 200, y: 100 } },
      ];
      const edges = [
        { id: 'e1', source: 'approval-1', target: 'condition-1' },
        {
          id: 'e2',
          source: 'condition-1',
          target: 'approval-2',
          data: { label: 'High value', conditions: [{ field: 'amount', operator: 'gt', value: 1000 }] },
        },
        {
          id: 'e3',
          source: 'condition-1',
          target: 'approval-3',
          data: { label: 'Low value', conditions: [{ field: 'amount', operator: 'lte', value: 1000 }] },
        },
      ];

      // amount = 5000 should match gt 1000 → approval-2
      const next = service.resolveNextNode('approval-1', nodes, edges, { amount: 5000 });
      expect(next).toBe('approval-2');
    });

    it('should follow fallback edge when first condition does not match', () => {
      const nodes = [
        { id: 'approval-1', type: WorkflowNodeType.APPROVAL, point: { x: 0, y: 0 } },
        { id: 'condition-1', type: WorkflowNodeType.CONDITION, point: { x: 100, y: 0 } },
        { id: 'approval-2', type: WorkflowNodeType.APPROVAL, point: { x: 200, y: -100 } },
        { id: 'approval-3', type: WorkflowNodeType.APPROVAL, point: { x: 200, y: 100 } },
      ];
      const edges = [
        { id: 'e1', source: 'approval-1', target: 'condition-1' },
        {
          id: 'e2',
          source: 'condition-1',
          target: 'approval-2',
          data: { conditions: [{ field: 'amount', operator: 'gt', value: 1000 }] },
        },
        {
          id: 'e3',
          source: 'condition-1',
          target: 'approval-3',
          data: { conditions: [{ field: 'amount', operator: 'lte', value: 1000 }] },
        },
      ];

      // amount = 500 should not match gt 1000, should match lte 1000 → approval-3
      const next = service.resolveNextNode('approval-1', nodes, edges, { amount: 500 });
      expect(next).toBe('approval-3');
    });
  });
});
