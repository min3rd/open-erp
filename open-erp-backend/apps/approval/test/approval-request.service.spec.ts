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
} from '@shared/schemas/approval-workflow-template.schema';

describe('ApprovalRequestService', () => {
  let service: ApprovalRequestService;

  const userId1 = '507f1f77bcf86cd799439011';
  const userId2 = '507f1f77bcf86cd799439022';
  const userId3 = '507f1f77bcf86cd799439033';
  const requesterId = '507f1f77bcf86cd799439044';
  const templateId = '507f1f77bcf86cd799439055';
  const entityId = '507f1f77bcf86cd799439066';

  const mockTemplate = {
    _id: new Types.ObjectId(templateId),
    name: 'Document Approval',
    entityType: 'document',
    scope: ApprovalScope.GLOBAL,
    status: TemplateStatus.PUBLISHED,
    steps: [
      {
        order: 0,
        name: 'Manager Review',
        approverIds: [new Types.ObjectId(userId1)],
        approvalMode: ApprovalMode.ANY,
      },
      {
        order: 1,
        name: 'Director Approval',
        approverIds: [
          new Types.ObjectId(userId2),
          new Types.ObjectId(userId3),
        ],
        approvalMode: ApprovalMode.ALL,
      },
    ],
  };

  const mockRequest = {
    _id: new Types.ObjectId(),
    entityType: 'document',
    entityId: new Types.ObjectId(entityId),
    templateId: new Types.ObjectId(templateId),
    status: ApprovalRequestStatus.IN_PROGRESS,
    currentStepOrder: 0,
    steps: [
      {
        order: 0,
        name: 'Manager Review',
        approverIds: [new Types.ObjectId(userId1)],
        approvalMode: ApprovalMode.ANY,
        status: ApprovalRequestStatus.IN_PROGRESS,
        approvals: [],
        startedAt: new Date(),
      },
      {
        order: 1,
        name: 'Director Approval',
        approverIds: [
          new Types.ObjectId(userId2),
          new Types.ObjectId(userId3),
        ],
        approvalMode: ApprovalMode.ALL,
        status: ApprovalRequestStatus.PENDING,
        approvals: [],
      },
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
    it('should create an approval request and start first step', async () => {
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
          currentStepOrder: 0,
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
    it('should approve step in ANY mode (single approver)', async () => {
      const request = JSON.parse(JSON.stringify(mockRequest));
      request._id = mockRequest._id;
      request.steps[0].approverIds = [new Types.ObjectId(userId1)];
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

      expect(result.steps[0].status).toBe(ApprovalRequestStatus.APPROVED);
      expect(result.currentStepOrder).toBe(1);
    });

    it('should reject the entire request on REJECT action', async () => {
      const request = JSON.parse(JSON.stringify(mockRequest));
      request._id = mockRequest._id;
      request.steps[0].approverIds = [new Types.ObjectId(userId1)];
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
      request.steps[0].approverIds = [new Types.ObjectId(userId1)];
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

  describe('evaluateStepCompletion', () => {
    it('should return approved for ANY mode with 1 approval', () => {
      const step = {
        order: 0,
        name: 'Step',
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

      expect(service.evaluateStepCompletion(step as any)).toBe('approved');
    });

    it('should return pending for ALL mode with partial approvals', () => {
      const step = {
        order: 0,
        name: 'Step',
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

      expect(service.evaluateStepCompletion(step as any)).toBe('pending');
    });

    it('should return approved for ALL mode with all approvals', () => {
      const step = {
        order: 0,
        name: 'Step',
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

      expect(service.evaluateStepCompletion(step as any)).toBe('approved');
    });

    it('should return approved for QUORUM mode when quorum count is met', () => {
      const step = {
        order: 0,
        name: 'Step',
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

      expect(service.evaluateStepCompletion(step as any)).toBe('approved');
    });

    it('should return pending for QUORUM mode when quorum not met', () => {
      const step = {
        order: 0,
        name: 'Step',
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

      expect(service.evaluateStepCompletion(step as any)).toBe('pending');
    });

    it('should return rejected when any approver rejects', () => {
      const step = {
        order: 0,
        name: 'Step',
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

      expect(service.evaluateStepCompletion(step as any)).toBe('rejected');
    });

    it('should return changes_requested when REQUEST_CHANGES is submitted', () => {
      const step = {
        order: 0,
        name: 'Step',
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

      expect(service.evaluateStepCompletion(step as any)).toBe(
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
});
