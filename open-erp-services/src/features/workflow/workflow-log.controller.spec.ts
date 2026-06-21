import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowLogController } from './workflow-log.controller';
import { WorkflowLogService } from '../../core/workflow/workflow-log.service';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

describe('WorkflowLogController', () => {
  let controller: WorkflowLogController;
  let logServiceMock: any;

  const mockLogService = {
    verifyChain: jest.fn(),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowLogController],
      providers: [
        { provide: WorkflowLogService, useValue: mockLogService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WorkflowLogController>(WorkflowLogController);
    logServiceMock = module.get<WorkflowLogService>(WorkflowLogService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verifyLogs', () => {
    it('should return verified true if chain is intact', async () => {
      logServiceMock.verifyChain.mockResolvedValue({ verified: true });

      const response = await controller.verifyLogs('instance-uuid');

      expect(logServiceMock.verifyChain).toHaveBeenCalledWith('instance-uuid');
      expect(response.success).toBe(true);
      expect(response.data.verified).toBe(true);
      expect(response.data.integrityCheckedAt).toBeDefined();
    });

    it('should throw BadRequestException if chain is corrupted', async () => {
      logServiceMock.verifyChain.mockResolvedValue({ verified: false, corruptedLogId: 'log-123' });

      await expect(controller.verifyLogs('instance-uuid')).rejects.toThrow(BadRequestException);
    });
  });
});
