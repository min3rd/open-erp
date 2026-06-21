import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { WorkflowDeadlineConsumer } from './workflow-deadline.consumer';
import { WorkflowApprover } from './entities/workflow-approver.entity';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({}),
  }),
}));

describe('WorkflowDeadlineConsumer', () => {
  let consumer: WorkflowDeadlineConsumer;
  let approverRepoMock: any;
  let queueMock: any;
  let configServiceMock: any;
  let transportMock: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    approverRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    queueMock = {
      add: jest.fn().mockResolvedValue({}),
    };

    configServiceMock = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'SMTP_HOST') return 'smtp.example.com';
        if (key === 'SMTP_PORT') return 587;
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowDeadlineConsumer,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: getRepositoryToken(WorkflowApprover),
          useValue: approverRepoMock,
        },
        {
          provide: getQueueToken('workflow-deadline-queue'),
          useValue: queueMock,
        },
      ],
    }).compile();

    consumer = module.get<WorkflowDeadlineConsumer>(WorkflowDeadlineConsumer);
    transportMock = nodemailer.createTransport();
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should schedule recurring scan-overdue-approvals job', async () => {
      await consumer.onModuleInit();
      expect(queueMock.add).toHaveBeenCalledWith(
        'scan-overdue-approvals',
        {},
        expect.objectContaining({
          repeat: { every: 3600000 },
          jobId: 'scan-overdue-approvals-job',
        }),
      );
    });
  });

  describe('process', () => {
    it('should process check-step-deadline and send reminder email if pending', async () => {
      const mockApprover = {
        id: 'app-1',
        status: 'PENDING',
        userId: 'user-1',
        deadlineAt: new Date(Date.now() + 5000),
        user: { email: 'approver@example.com', firstName: 'John', lastName: 'Doe' },
        instance: { workflow: { name: 'Purchase Request' } },
      };

      approverRepoMock.findOne.mockResolvedValue(mockApprover);

      const job: any = {
        name: 'check-step-deadline',
        data: { approverId: 'app-1' },
      };

      await consumer.process(job);

      expect(approverRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        relations: ['user', 'instance', 'instance.workflow'],
      });
      expect(transportMock.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'approver@example.com',
          subject: expect.stringContaining('Khẩn: [Purchase Request]'),
        }),
      );
    });

    it('should not send email if task is already APPROVED', async () => {
      const mockApprover = {
        id: 'app-1',
        status: 'APPROVED',
        userId: 'user-1',
        deadlineAt: new Date(Date.now() + 5000),
        user: { email: 'approver@example.com' },
      };

      approverRepoMock.findOne.mockResolvedValue(mockApprover);

      const job: any = {
        name: 'check-step-deadline',
        data: { approverId: 'app-1' },
      };

      await consumer.process(job);

      expect(transportMock.sendMail).not.toHaveBeenCalled();
    });

    it('should process scan-overdue-approvals and send warning emails for overdue items', async () => {
      const mockOverdue1 = {
        id: 'app-1',
        status: 'PENDING',
        userId: 'user-1',
        deadlineAt: new Date(Date.now() - 5000),
        user: { email: 'user1@example.com', firstName: 'User', lastName: 'One' },
        instance: { workflow: { name: 'Leave Request' } },
      };

      const mockOverdue2 = {
        id: 'app-2',
        status: 'CONSULTING',
        userId: 'user-2',
        deadlineAt: new Date(Date.now() - 10000),
        user: { email: 'user2@example.com', firstName: 'User', lastName: 'Two' },
        instance: { workflow: { name: 'Expense Request' } },
      };

      approverRepoMock.find.mockImplementation((opts: any) => {
        if (opts.where.status === 'PENDING') {
          return Promise.resolve([mockOverdue1]);
        }
        if (opts.where.status === 'CONSULTING') {
          return Promise.resolve([mockOverdue2]);
        }
        return Promise.resolve([]);
      });

      const job: any = {
        name: 'scan-overdue-approvals',
        data: {},
      };

      await consumer.process(job);

      expect(approverRepoMock.find).toHaveBeenCalledTimes(2);
      expect(transportMock.sendMail).toHaveBeenCalledTimes(2);
      expect(transportMock.sendMail).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          to: 'user1@example.com',
          subject: expect.stringContaining('Trễ hạn: [Leave Request]'),
        }),
      );
      expect(transportMock.sendMail).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          to: 'user2@example.com',
          subject: expect.stringContaining('Trễ hạn: [Expense Request]'),
        }),
      );
    });
  });
});
