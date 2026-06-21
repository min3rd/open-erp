import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowLog } from './entities/workflow-log.entity';
import * as crypto from 'crypto';

@Injectable()
export class WorkflowLogService {
  constructor(
    @InjectRepository(WorkflowLog)
    private readonly logRepository: Repository<WorkflowLog>,
  ) {}

  async writeLog(
    tenantId: string | null,
    instanceId: string,
    stepId: string | null,
    action: string,
    actorId: string,
    payload: any,
  ): Promise<WorkflowLog> {
    const lastLog = await this.logRepository.findOne({
      where: { instanceId },
      order: { timestamp: 'DESC', id: 'DESC' },
    });

    const prevHash = lastLog ? lastLog.hash : '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date();

    const payloadStr = payload ? JSON.stringify(payload) : '';
    const dataToHash = [
      prevHash,
      tenantId || '',
      instanceId,
      stepId || '',
      action,
      actorId,
      payloadStr,
      timestamp.toISOString(),
    ].join('');

    const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    const log = new WorkflowLog();
    log.tenantId = tenantId;
    log.instanceId = instanceId;
    log.stepId = stepId;
    log.action = action;
    log.actorId = actorId;
    log.payload = payload;
    log.prevHash = prevHash;
    log.hash = hash;
    log.timestamp = timestamp;

    return this.logRepository.save(log);
  }

  async verifyChain(instanceId: string): Promise<{ verified: boolean; corruptedLogId?: string }> {
    const logs = await this.logRepository.find({
      where: { instanceId },
      order: { timestamp: 'ASC', id: 'ASC' },
    });

    if (logs.length === 0) {
      return { verified: true };
    }

    let expectedPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (const log of logs) {
      if (log.prevHash !== expectedPrevHash) {
        return { verified: false, corruptedLogId: log.id };
      }

      const payloadStr = log.payload ? JSON.stringify(log.payload) : '';
      const dataToHash = [
        log.prevHash,
        log.tenantId || '',
        log.instanceId,
        log.stepId || '',
        log.action,
        log.actorId,
        payloadStr,
        new Date(log.timestamp).toISOString(),
      ].join('');

      const computedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

      if (log.hash !== computedHash) {
        return { verified: false, corruptedLogId: log.id };
      }

      expectedPrevHash = log.hash;
    }

    return { verified: true };
  }
}
