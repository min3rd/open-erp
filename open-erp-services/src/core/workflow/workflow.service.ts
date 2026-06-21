import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { WorkflowStepAssignee } from './entities/workflow-step-assignee.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowApprover } from './entities/workflow-approver.entity';
import { User } from '../user/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowStep)
    private readonly stepRepository: Repository<WorkflowStep>,
    @InjectRepository(WorkflowStepAssignee)
    private readonly assigneeRepository: Repository<WorkflowStepAssignee>,
    private readonly dataSource: DataSource,
  ) {}

  async createWorkflow(tenantId: string | null, payload: any): Promise<Workflow> {
    const { name, description, steps } = payload;

    if (!name) {
      throw new BadRequestException({
        success: false,
        error: { code: 'NAME_REQUIRED', messageKey: 'workflow.name_required' },
      });
    }

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      throw new BadRequestException({
        success: false,
        error: { code: 'STEPS_REQUIRED', messageKey: 'workflow.steps_required' },
      });
    }

    // 1. Validation: check that there is at least one START and one END step
    const hasStart = steps.some((s) => s.stepType === 'START');
    const hasEnd = steps.some((s) => s.stepType === 'END');
    if (!hasStart) {
      throw new BadRequestException({
        success: false,
        error: { code: 'MISSING_START_STEP', messageKey: 'workflow.missing_start_step' },
      });
    }
    if (!hasEnd) {
      throw new BadRequestException({
        success: false,
        error: { code: 'MISSING_END_STEP', messageKey: 'workflow.missing_end_step' },
      });
    }

    // 2. Validation: ensure all step IDs referenced in nextStepIds exist in the steps array
    const stepIds = new Set(steps.map((s) => s.id));
    for (const step of steps) {
      if (step.nextStepIds && Array.isArray(step.nextStepIds)) {
        for (const nextId of step.nextStepIds) {
          if (!stepIds.has(nextId)) {
            throw new BadRequestException({
              success: false,
              error: {
                code: 'INVALID_NEXT_STEP_ID',
                messageKey: 'workflow.invalid_next_step_id',
                meta: { stepId: step.id, nextStepId: nextId },
              },
            });
          }
        }
      }
    }

    // 3. Validation: cycle detection using DFS
    if (this.hasCycle(steps)) {
      throw new BadRequestException({
        success: false,
        error: { code: 'CYCLE_DETECTED', messageKey: 'workflow.cycle_detected' },
      });
    }

    // 4. Map user-provided step string IDs to UUIDs
    const idMap = new Map<string, string>();
    for (const step of steps) {
      // If the id is already a valid UUID, reuse it, otherwise generate a new UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(step.id);
      idMap.set(step.id, isUuid ? step.id : crypto.randomUUID());
    }

    return this.dataSource.transaction(async (manager) => {
      // Create Workflow
      const workflow = new Workflow();
      workflow.name = name;
      workflow.description = description || null;
      workflow.tenantId = tenantId;
      workflow.isActive = true;

      const savedWorkflow = await manager.save(Workflow, workflow);

      // Create steps and assignees
      const stepEntities: WorkflowStep[] = [];
      const assigneeEntities: WorkflowStepAssignee[] = [];

      for (const step of steps) {
        const stepEntity = new WorkflowStep();
        stepEntity.id = idMap.get(step.id)!;
        stepEntity.workflowId = savedWorkflow.id;
        stepEntity.tenantId = tenantId;
        stepEntity.name = step.name;
        stepEntity.stepOrder = step.stepOrder;
        stepEntity.stepType = step.stepType || 'APPROVAL';
        stepEntity.nextStepIds = step.nextStepIds
          ? step.nextStepIds.map((nid: string) => idMap.get(nid)!)
          : [];
        stepEntity.config = step.config || null;
        stepEntity.formId = step.formId || null;
        stepEntity.templateId = step.templateId || null;

        stepEntities.push(stepEntity);

        // Process assignees if present in step config
        let assigneesPayload: any[] = [];
        if (step.config?.assignees) {
          if (Array.isArray(step.config.assignees)) {
            assigneesPayload = step.config.assignees;
          } else {
            assigneesPayload = [step.config.assignees];
          }
        }

        for (const val of assigneesPayload) {
          if (val && val.type && val.value) {
            const assigneeEntity = new WorkflowStepAssignee();
            assigneeEntity.stepId = stepEntity.id;
            assigneeEntity.tenantId = tenantId;
            assigneeEntity.assigneeType = val.type;
            assigneeEntity.assigneeId = val.value;
            assigneeEntities.push(assigneeEntity);
          }
        }
      }

      // Save steps and assignees
      await manager.save(WorkflowStep, stepEntities);
      if (assigneeEntities.length > 0) {
        await manager.save(WorkflowStepAssignee, assigneeEntities);
      }

      // Fetch saved workflow with relations
      return manager.findOne(Workflow, {
        where: { id: savedWorkflow.id },
        relations: ['steps', 'steps.assignees'],
      }) as Promise<Workflow>;
    });
  }

  async getWorkflowById(id: string, tenantId: string | null): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id, tenantId: tenantId as any },
      relations: ['steps', 'steps.assignees'],
    });

    if (!workflow) {
      throw new NotFoundException({
        success: false,
        error: { code: 'WORKFLOW_NOT_FOUND', messageKey: 'workflow.not_found' },
      });
    }

    return workflow;
  }

  async findAllWorkflows(tenantId: string | null): Promise<Workflow[]> {
    return this.workflowRepository.find({
      where: { tenantId: tenantId as any },
      relations: ['steps', 'steps.assignees'],
    });
  }

  private hasCycle(steps: any[]): boolean {
    const adj = new Map<string, string[]>();
    for (const step of steps) {
      adj.set(step.id, step.nextStepIds || []);
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      if (recStack.has(nodeId)) {
        return true;
      }
      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = adj.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (dfs(neighbor)) {
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        if (dfs(step.id)) {
          return true;
        }
      }
    }

    return false;
  }

  async getPerformanceAnalytics(
    tenantId: string | null,
    query: { startDate?: string; endDate?: string },
  ): Promise<any> {
    const { startDate, endDate } = query;

    const instanceRepo = this.dataSource.getRepository(WorkflowInstance);
    const approverRepo = this.dataSource.getRepository(WorkflowApprover);

    // Query WorkflowInstance
    const queryBuilder = instanceRepo.createQueryBuilder('instance')
      .leftJoinAndSelect('instance.approvers', 'approver')
      .leftJoinAndSelect('instance.workflow', 'workflow')
      .where('instance.tenantId = :tenantId', { tenantId });

    if (startDate) {
      queryBuilder.andWhere('instance.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      queryBuilder.andWhere('instance.createdAt <= :endDate', { endDate: new Date(endDate) });
    }

    const instances = await queryBuilder.getMany();

    // Calculate overall stats
    const totalInstances = instances.length;
    let completedInstancesCount = 0;
    let totalCompletionTimeMs = 0;
    let delayedInstancesCount = 0;

    const now = new Date();

    for (const inst of instances) {
      const isCompleted = inst.status === 'APPROVED' || inst.status === 'REJECTED';
      
      // Determine if instance is delayed
      let hasDelayedApprover = false;
      const apps = inst.approvers || [];
      
      for (const app of apps) {
        if (app.deadlineAt) {
          const deadlineTime = new Date(app.deadlineAt).getTime();
          if (app.actionAt) {
            const actionTime = new Date(app.actionAt).getTime();
            if (actionTime > deadlineTime) {
              hasDelayedApprover = true;
            }
          } else if (app.status === 'PENDING' || app.status === 'CONSULTING') {
            if (now.getTime() > deadlineTime) {
              hasDelayedApprover = true;
            }
          }
        }
      }

      if (hasDelayedApprover) {
        delayedInstancesCount++;
      }

      if (isCompleted) {
        completedInstancesCount++;
        // Completion time: MAX(actionAt) of approvers - createdAt of instance
        const actionTimes = apps
          .filter(a => a.actionAt && (a.status === 'APPROVED' || a.status === 'REJECTED'))
          .map(a => new Date(a.actionAt!).getTime());
        
        const completionTime = actionTimes.length > 0 ? Math.max(...actionTimes) : new Date(inst.createdAt).getTime();
        const start = new Date(inst.createdAt).getTime();
        totalCompletionTimeMs += Math.max(0, completionTime - start);
      }
    }

    const averageCompletionTimeHours = completedInstancesCount > 0
      ? parseFloat((totalCompletionTimeMs / completedInstancesCount / (1000 * 60 * 60)).toFixed(1))
      : 0;

    const delayedPercentage = totalInstances > 0
      ? parseFloat(((delayedInstancesCount / totalInstances) * 100).toFixed(1))
      : 0;

    // Compute user performance stats
    const appQueryBuilder = approverRepo.createQueryBuilder('approver')
      .leftJoinAndSelect('approver.user', 'user')
      .where('approver.tenantId = :tenantId', { tenantId });

    if (startDate) {
      appQueryBuilder.andWhere('approver.assignedAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      appQueryBuilder.andWhere('approver.assignedAt <= :endDate', { endDate: new Date(endDate) });
    }

    const approvers = await appQueryBuilder.getMany();

    // Group approvers by userId
    const userStatsMap = new Map<string, {
      userId: string;
      userName: string;
      assignedTasks: number;
      totalProcessTimeMs: number;
      completedTasksCount: number;
      delayedTasksCount: number;
    }>();

    for (const app of approvers) {
      const uId = app.userId;
      if (!uId) continue;

      let stats = userStatsMap.get(uId);
      if (!stats) {
        const uName = app.user
          ? `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim() || app.user.email
          : 'Unknown User';

        stats = {
          userId: uId,
          userName: uName,
          assignedTasks: 0,
          totalProcessTimeMs: 0,
          completedTasksCount: 0,
          delayedTasksCount: 0,
        };
        userStatsMap.set(uId, stats);
      }

      stats.assignedTasks++;

      // Process time if task completed
      if (app.actionAt) {
        stats.completedTasksCount++;
        const processTime = new Date(app.actionAt).getTime() - new Date(app.assignedAt).getTime();
        stats.totalProcessTimeMs += Math.max(0, processTime);
      }

      // Check if task is delayed
      if (app.deadlineAt) {
        const deadlineTime = new Date(app.deadlineAt).getTime();
        if (app.actionAt) {
          if (new Date(app.actionAt).getTime() > deadlineTime) {
            stats.delayedTasksCount++;
          }
        } else if (app.status === 'PENDING' || app.status === 'CONSULTING') {
          if (now.getTime() > deadlineTime) {
            stats.delayedTasksCount++;
          }
        }
      }
    }

    const userPerformance = Array.from(userStatsMap.values()).map(stats => {
      const avgProcessTimeHours = stats.completedTasksCount > 0
        ? parseFloat((stats.totalProcessTimeMs / stats.completedTasksCount / (1000 * 60 * 60)).toFixed(1))
        : 0;

      return {
        userId: stats.userId,
        userName: stats.userName,
        assignedTasks: stats.assignedTasks,
        averageProcessTimeHours: avgProcessTimeHours,
        delayedTasksCount: stats.delayedTasksCount,
      };
    });

    return {
      overallStats: {
        totalInstances,
        averageCompletionTimeHours,
        delayedPercentage,
      },
      userPerformance,
    };
  }
}
