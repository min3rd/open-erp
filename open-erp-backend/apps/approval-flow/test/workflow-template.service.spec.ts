import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { WorkflowTemplateService } from '../src/services/workflow-template.service';
import { WorkflowTemplateRepository } from '../src/repositories/workflow-template.repository';
import {
  ApprovalScope,
  TemplateStatus,
  ApprovalMode,
  WorkflowNodeType,
} from '@shared/schemas/approval-workflow-template.schema';

describe('WorkflowTemplateService', () => {
  let service: WorkflowTemplateService;

  const userId = '507f1f77bcf86cd799439011';
  const orgId = '507f1f77bcf86cd799439022';
  const departmentId = '507f1f77bcf86cd799439033';

  const mockTemplate = {
    _id: '507f1f77bcf86cd799439044',
    name: 'Document Approval',
    description: 'Standard document approval workflow',
    entityType: 'document',
    scope: ApprovalScope.GLOBAL,
    status: TemplateStatus.DRAFT,
    version: 1,
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
          approverIds: ['507f1f77bcf86cd799439055'],
          approvalMode: ApprovalMode.ANY,
        },
      },
      {
        id: 'end-1',
        point: { x: 600, y: 200 },
        type: WorkflowNodeType.END,
        data: { label: 'End' },
      },
    ],
    edges: [
      { id: 'e1', source: 'start-1', target: 'approval-1' },
      { id: 'e2', source: 'approval-1', target: 'end-1' },
    ],
    createdBy: userId,
    deletedAt: null,
  };

  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    resolveTemplate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowTemplateService,
        {
          provide: WorkflowTemplateRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WorkflowTemplateService>(WorkflowTemplateService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a GLOBAL template with nodes and edges', async () => {
      mockRepository.create.mockResolvedValue(mockTemplate);

      const result = await service.create(
        {
          name: 'Document Approval',
          entityType: 'document',
          scope: ApprovalScope.GLOBAL,
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
                approverIds: ['507f1f77bcf86cd799439055'],
                approvalMode: ApprovalMode.ANY,
              },
            },
            {
              id: 'end-1',
              point: { x: 600, y: 200 },
              type: WorkflowNodeType.END,
            },
          ],
          edges: [
            { id: 'e1', source: 'start-1', target: 'approval-1' },
            { id: 'e2', source: 'approval-1', target: 'end-1' },
          ],
        },
        userId,
      );

      expect(result).toEqual(mockTemplate);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Document Approval',
          entityType: 'document',
          scope: ApprovalScope.GLOBAL,
          status: TemplateStatus.DRAFT,
        }),
      );
    });

    it('should throw BadRequestException for ORG scope without orgId', async () => {
      await expect(
        service.create(
          {
            name: 'Org Template',
            entityType: 'document',
            scope: ApprovalScope.ORG,
            nodes: [
              {
                id: 'start-1',
                point: { x: 0, y: 0 },
                type: WorkflowNodeType.START,
              },
            ],
            edges: [],
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for DEPARTMENT scope without departmentId', async () => {
      await expect(
        service.create(
          {
            name: 'Dept Template',
            entityType: 'document',
            scope: ApprovalScope.DEPARTMENT,
            orgId,
            nodes: [
              {
                id: 'start-1',
                point: { x: 0, y: 0 },
                type: WorkflowNodeType.START,
              },
            ],
            edges: [],
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('publish', () => {
    it('should publish a draft template with start + approval nodes', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockTemplate, status: TemplateStatus.DRAFT });
      mockRepository.update.mockResolvedValue({ ...mockTemplate, status: TemplateStatus.PUBLISHED });

      const result = await service.publish(mockTemplate._id);
      expect(result.status).toBe(TemplateStatus.PUBLISHED);
    });

    it('should throw ConflictException if already published', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockTemplate, status: TemplateStatus.PUBLISHED });

      await expect(service.publish(mockTemplate._id)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if no nodes', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockTemplate, nodes: [] });

      await expect(service.publish(mockTemplate._id)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if missing start or approval node', async () => {
      mockRepository.findById.mockResolvedValue({
        ...mockTemplate,
        nodes: [
          { id: 'end-1', point: { x: 0, y: 0 }, type: WorkflowNodeType.END },
        ],
      });

      await expect(service.publish(mockTemplate._id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should throw ConflictException when updating a published template', async () => {
      mockRepository.findById.mockResolvedValue({
        ...mockTemplate,
        status: TemplateStatus.PUBLISHED,
      });

      await expect(
        service.update(mockTemplate._id, { name: 'New Name' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('clone', () => {
    it('should clone a template with new name', async () => {
      mockRepository.findById.mockResolvedValue(mockTemplate);
      mockRepository.create.mockResolvedValue({
        ...mockTemplate,
        _id: '507f1f77bcf86cd799439099',
        name: 'Cloned Template',
        status: TemplateStatus.DRAFT,
      });

      const result = await service.clone(
        mockTemplate._id,
        { name: 'Cloned Template' },
        userId,
      );

      expect(result.name).toBe('Cloned Template');
      expect(result.status).toBe(TemplateStatus.DRAFT);
      expect(mockRepository.create).toHaveBeenCalled();
    });
  });

  describe('resolveTemplate (scope priority)', () => {
    const deptTemplate = {
      ...mockTemplate,
      _id: 'dept-template-id',
      scope: ApprovalScope.DEPARTMENT,
      departmentId,
      orgId,
    };
    const orgTemplate = {
      ...mockTemplate,
      _id: 'org-template-id',
      scope: ApprovalScope.ORG,
      orgId,
    };
    const globalTemplate = {
      ...mockTemplate,
      _id: 'global-template-id',
      scope: ApprovalScope.GLOBAL,
    };

    it('should resolve DEPARTMENT template first (highest priority)', async () => {
      mockRepository.resolveTemplate.mockResolvedValue(deptTemplate);

      const result = await service.resolveTemplate('document', orgId, departmentId);
      expect(result.scope).toBe(ApprovalScope.DEPARTMENT);
      expect(mockRepository.resolveTemplate).toHaveBeenCalledWith('document', orgId, departmentId);
    });

    it('should resolve ORG template when no DEPARTMENT template exists', async () => {
      mockRepository.resolveTemplate.mockResolvedValue(orgTemplate);

      const result = await service.resolveTemplate('document', orgId);
      expect(result.scope).toBe(ApprovalScope.ORG);
    });

    it('should resolve GLOBAL template when no ORG or DEPARTMENT template exists', async () => {
      mockRepository.resolveTemplate.mockResolvedValue(globalTemplate);

      const result = await service.resolveTemplate('document');
      expect(result.scope).toBe(ApprovalScope.GLOBAL);
    });

    it('should throw NotFoundException when no template found', async () => {
      mockRepository.resolveTemplate.mockResolvedValue(null);

      await expect(
        service.resolveTemplate('unknown-entity'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeStatus', () => {
    it('should change status from DRAFT to ARCHIVED', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockTemplate, status: TemplateStatus.DRAFT });
      mockRepository.update.mockResolvedValue({ ...mockTemplate, status: TemplateStatus.ARCHIVED });

      const result = await service.changeStatus(mockTemplate._id, TemplateStatus.ARCHIVED);
      expect(result.status).toBe(TemplateStatus.ARCHIVED);
    });

    it('should throw ConflictException if status is already the same', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockTemplate, status: TemplateStatus.DRAFT });

      await expect(
        service.changeStatus(mockTemplate._id, TemplateStatus.DRAFT),
      ).rejects.toThrow(ConflictException);
    });

    it('should delegate to publish() when changing to PUBLISHED', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockTemplate, status: TemplateStatus.DRAFT });
      mockRepository.update.mockResolvedValue({ ...mockTemplate, status: TemplateStatus.PUBLISHED });

      const result = await service.changeStatus(mockTemplate._id, TemplateStatus.PUBLISHED);
      expect(result.status).toBe(TemplateStatus.PUBLISHED);
    });
  });

  describe('validateWorkflow', () => {
    it('should return valid for a correct workflow', () => {
      const result = service.validateWorkflow(
        [
          { id: 'start-1', type: WorkflowNodeType.START },
          { id: 'approval-1', type: WorkflowNodeType.APPROVAL, data: { approverIds: ['user1'] } },
          { id: 'end-1', type: WorkflowNodeType.END },
        ],
        [
          { id: 'e1', source: 'start-1', target: 'approval-1' },
          { id: 'e2', source: 'approval-1', target: 'end-1' },
        ],
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail if no nodes provided', () => {
      const result = service.validateWorkflow([], []);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Workflow must have at least one node');
    });

    it('should fail if missing start node', () => {
      const result = service.validateWorkflow(
        [
          { id: 'approval-1', type: WorkflowNodeType.APPROVAL, data: { approverIds: ['user1'] } },
          { id: 'end-1', type: WorkflowNodeType.END },
        ],
        [],
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Workflow must have at least one start node');
    });

    it('should fail if missing end node', () => {
      const result = service.validateWorkflow(
        [
          { id: 'start-1', type: WorkflowNodeType.START },
          { id: 'approval-1', type: WorkflowNodeType.APPROVAL, data: { approverIds: ['user1'] } },
        ],
        [],
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Workflow must have at least one end node');
    });

    it('should fail if edge references non-existent node', () => {
      const result = service.validateWorkflow(
        [
          { id: 'start-1', type: WorkflowNodeType.START },
          { id: 'approval-1', type: WorkflowNodeType.APPROVAL, data: { approverIds: ['user1'] } },
          { id: 'end-1', type: WorkflowNodeType.END },
        ],
        [
          { id: 'e1', source: 'start-1', target: 'nonexistent' },
        ],
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Edge "e1" references non-existent target node "nonexistent"');
    });

    it('should fail if approval node has no approvers', () => {
      const result = service.validateWorkflow(
        [
          { id: 'start-1', type: WorkflowNodeType.START },
          { id: 'approval-1', type: WorkflowNodeType.APPROVAL, data: {} },
          { id: 'end-1', type: WorkflowNodeType.END },
        ],
        [],
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Approval node "approval-1" must have at least one approver');
    });
  });
});
