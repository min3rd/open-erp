import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowLogService } from './workflow-log.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkflowLog } from './entities/workflow-log.entity';
import * as crypto from 'crypto';

describe('WorkflowLogService', () => {
  let service: WorkflowLogService;
  let repositoryMock: any;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowLogService,
        {
          provide: getRepositoryToken(WorkflowLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WorkflowLogService>(WorkflowLogService);
    repositoryMock = module.get(getRepositoryToken(WorkflowLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('writeLog', () => {
    it('should create log with prevHash as zeros if first log of instance', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      const tenantId = 'tenant-1';
      const instanceId = 'instance-1';
      const stepId = 'step-1';
      const action = 'SUBMIT';
      const actorId = 'actor-1';
      const payload = { data: 'some payload' };

      const result = await service.writeLog(tenantId, instanceId, stepId, action, actorId, payload);

      expect(repositoryMock.findOne).toHaveBeenCalled();
      expect(result.prevHash).toBe('0000000000000000000000000000000000000000000000000000000000000000');
      expect(result.hash).toBeDefined();
      expect(result.action).toBe(action);
      expect(result.payload).toEqual(payload);
    });

    it('should link new log to hash of previous log', async () => {
      const prevLog = {
        hash: 'abc123hash',
      };
      repositoryMock.findOne.mockResolvedValue(prevLog);

      const result = await service.writeLog('tenant-1', 'instance-1', 'step-1', 'APPROVE', 'actor-1', null);

      expect(result.prevHash).toBe('abc123hash');
      expect(result.hash).toBeDefined();
    });
  });

  describe('verifyChain', () => {
    it('should verify true for empty logs list', async () => {
      repositoryMock.find.mockResolvedValue([]);

      const result = await service.verifyChain('instance-1');

      expect(result.verified).toBe(true);
    });

    it('should verify true if the chain of hashes is completely intact', async () => {
      const tenantId = 'tenant-1';
      const instanceId = 'instance-1';
      const stepId = 'step-1';
      const actorId = 'actor-1';

      const time1 = new Date('2026-06-21T05:00:00Z');
      const hash1Data = [
        '0000000000000000000000000000000000000000000000000000000000000000',
        tenantId,
        instanceId,
        stepId,
        'SUBMIT',
        actorId,
        JSON.stringify({ note: 'first step' }),
        time1.toISOString(),
      ].join('');
      const hash1 = crypto.createHash('sha256').update(hash1Data).digest('hex');

      const time2 = new Date('2026-06-21T05:05:00Z');
      const hash2Data = [
        hash1,
        tenantId,
        instanceId,
        stepId,
        'APPROVE',
        actorId,
        '',
        time2.toISOString(),
      ].join('');
      const hash2 = crypto.createHash('sha256').update(hash2Data).digest('hex');

      const logs = [
        {
          id: 'log-1',
          tenantId,
          instanceId,
          stepId,
          action: 'SUBMIT',
          actorId,
          payload: { note: 'first step' },
          prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
          hash: hash1,
          timestamp: time1,
        },
        {
          id: 'log-2',
          tenantId,
          instanceId,
          stepId,
          action: 'APPROVE',
          actorId,
          payload: null,
          prevHash: hash1,
          hash: hash2,
          timestamp: time2,
        },
      ] as any[];

      repositoryMock.find.mockResolvedValue(logs);

      const result = await service.verifyChain(instanceId);

      expect(result.verified).toBe(true);
    });

    it('should verify false if prevHash link is broken', async () => {
      const tenantId = 'tenant-1';
      const instanceId = 'instance-1';
      const stepId = 'step-1';
      const actorId = 'actor-1';

      const time1 = new Date('2026-06-21T05:00:00Z');
      const hash1Data = [
        '0000000000000000000000000000000000000000000000000000000000000000',
        tenantId,
        instanceId,
        stepId,
        'SUBMIT',
        actorId,
        '',
        time1.toISOString(),
      ].join('');
      const hash1 = crypto.createHash('sha256').update(hash1Data).digest('hex');

      const time2 = new Date('2026-06-21T05:05:00Z');

      const logs = [
        {
          id: 'log-1',
          tenantId,
          instanceId,
          stepId,
          action: 'SUBMIT',
          actorId,
          payload: null,
          prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
          hash: hash1,
          timestamp: time1,
        },
        {
          id: 'log-2',
          tenantId,
          instanceId,
          stepId,
          action: 'APPROVE',
          actorId,
          payload: null,
          prevHash: 'wrong_prev_hash',
          hash: 'some_other_hash',
          timestamp: time2,
        },
      ] as any[];

      repositoryMock.find.mockResolvedValue(logs);

      const result = await service.verifyChain(instanceId);

      expect(result.verified).toBe(false);
      expect(result.corruptedLogId).toBe('log-2');
    });

    it('should verify false if log data is tampered (hash mismatch)', async () => {
      const logs = [
        {
          id: 'log-1',
          tenantId: 'tenant-1',
          instanceId: 'instance-1',
          stepId: 'step-1',
          action: 'SUBMIT',
          actorId: 'actor-1',
          payload: null,
          prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
          hash: 'invalid_hash_value',
          timestamp: new Date(),
        },
      ] as any[];

      repositoryMock.find.mockResolvedValue(logs);

      const result = await service.verifyChain('instance-1');

      expect(result.verified).toBe(false);
      expect(result.corruptedLogId).toBe('log-1');
    });
  });
});
