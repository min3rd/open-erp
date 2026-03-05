import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { WorkflowTemplateService } from '../src/services/workflow-template.service';
import { WorkflowTemplateRepository } from '../src/repositories/workflow-template.repository';
import {
  ApprovalScope,
  TemplateStatus,
  ApprovalMode,
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
    steps: [
      {
        order: 0,
        name: 'Manager Review',
        approverIds: ['507f1f77bcf86cd799439055'],
        approvalMode: ApprovalMode.ANY,
        approvals: [],
      },
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
    it('should create a GLOBAL template', async () => {
      mockRepository.create.mockResolvedValue(mockTemplate);

      const result = await service.create(
        {
          name: 'Document Approval',
          entityType: 'document',
          scope: ApprovalScope.GLOBAL,
          steps: [
            {
              order: 0,
              name: 'Manager Review',
              approverIds: ['507f1f77bcf86cd799439055'],
              approvalMode: ApprovalMode.ANY,
            },
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
            steps: [
              {
                order: 0,
                name: 'Step 1',
                approverIds: ['507f1f77bcf86cd799439055'],
                approvalMode: ApprovalMode.ANY,
              },
            ],
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
            steps: [
              {
                order: 0,
                name: 'Step 1',
                approverIds: ['507f1f77bcf86cd799439055'],
                approvalMode: ApprovalMode.ANY,
              },
            ],
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('publish', () => {
    it('should publish a draft template', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockTemplate, status: TemplateStatus.DRAFT });
      mockRepository.update.mockResolvedValue({ ...mockTemplate, status: TemplateStatus.PUBLISHED });

      const result = await service.publish(mockTemplate._id);
      expect(result.status).toBe(TemplateStatus.PUBLISHED);
    });

    it('should throw ConflictException if already published', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockTemplate, status: TemplateStatus.PUBLISHED });

      await expect(service.publish(mockTemplate._id)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if no steps', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockTemplate, steps: [] });

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
});
