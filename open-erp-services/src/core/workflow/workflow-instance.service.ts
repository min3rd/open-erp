import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { WorkflowApprover } from './entities/workflow-approver.entity';
import { Workflow } from './entities/workflow.entity';
import { WorkflowStepAssignee } from './entities/workflow-step-assignee.entity';
import { WorkflowConsultation } from './entities/workflow-consultation.entity';
import { WorkflowLogService } from './workflow-log.service';
import { User } from '../user/user.entity';
import { Employee } from '../../features/org/entities/employee.entity';
import { DocumentTemplateService } from '../document-template/document-template.service';

@Injectable()
export class WorkflowInstanceService {
  constructor(
    @InjectRepository(WorkflowInstance)
    private readonly instanceRepository: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStep)
    private readonly stepRepository: Repository<WorkflowStep>,
    @InjectRepository(WorkflowApprover)
    private readonly approverRepository: Repository<WorkflowApprover>,
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowConsultation)
    private readonly consultationRepository: Repository<WorkflowConsultation>,
    private readonly logService: WorkflowLogService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => DocumentTemplateService))
    private readonly templateService: DocumentTemplateService,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  async startInstance(
    tenantId: string | null,
    workflowId: string,
    creatorId: string,
    contextData: any = {},
  ): Promise<WorkflowInstance> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId, tenantId: tenantId as any },
      relations: ['steps'],
    });

    if (!workflow) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'WORKFLOW_NOT_FOUND',
          messageKey: 'workflow.not_found',
        },
      });
    }

    const startStep = workflow.steps.find((s) => s.stepType === 'START');
    if (!startStep || !startStep.nextStepIds || startStep.nextStepIds.length === 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_WORKFLOW_START',
          messageKey: 'workflow.invalid_start_step',
        },
      });
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Create WorkflowInstance
      const instance = new WorkflowInstance();
      instance.workflowId = workflowId;
      instance.tenantId = tenantId;
      instance.creatorId = creatorId;
      instance.status = 'IN_PROGRESS';
      instance.contextData = contextData;

      // Find direct steps after START
      const firstStepIds = startStep.nextStepIds || [];
      instance.currentStepIds = firstStepIds;

      const savedInstance = await manager.save(WorkflowInstance, instance);

      // 2. Write start log
      await this.logService.writeLog(
        tenantId,
        savedInstance.id,
        startStep.id,
        'SUBMIT',
        creatorId,
        contextData,
      );

      // 3. Activate first steps
      for (const stepId of firstStepIds) {
        const step = workflow.steps.find((s) => s.id === stepId);
        if (step) {
          await this.activateStepInTransaction(manager, savedInstance.id, step, tenantId);
        }
      }

      return manager.findOne(WorkflowInstance, {
        where: { id: savedInstance.id },
        relations: ['approvers'],
      }) as Promise<WorkflowInstance>;
    });
  }

  async executeAction(
    tenantId: string | null,
    instanceId: string,
    actorId: string,
    payload: {
      stepId: string;
      action: string; // 'APPROVE' | 'REJECT' | 'CONSULT' | 'PROVIDE_FEEDBACK' | 'SPAWN_SUBPROCESS'
      comment?: string;
      consultantId?: string;
      formData?: any;
      subWorkflowId?: string;
    },
  ): Promise<WorkflowInstance> {
    const instance = await this.instanceRepository.findOne({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'WORKFLOW_INSTANCE_NOT_FOUND',
          messageKey: 'workflow.instance_not_found',
        },
      });
    }

    if (instance.tenantId && instance.tenantId !== tenantId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'TENANT_MISMATCH',
          messageKey: 'storage.access_denied',
        },
      });
    }

    const { stepId, action, comment, consultantId, formData, subWorkflowId } = payload;

    // Handle PROVIDE_FEEDBACK (Consultant responds)
    if (action === 'PROVIDE_FEEDBACK') {
      const consultation = await this.consultationRepository.findOne({
        where: {
          instanceId,
          stepId,
          consultantId: actorId,
          status: 'PENDING',
        },
      });

      if (!consultation) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'CONSULTATION_NOT_FOUND',
            messageKey: 'workflow.consultation_not_found',
          },
        });
      }

      return this.dataSource.transaction(async (manager) => {
        // Update Consultation
        consultation.status = 'RESPONDED';
        consultation.feedback = comment || null;
        await manager.save(WorkflowConsultation, consultation);

        // Update consultant's approver task
        const consultantApprover = await manager.findOne(WorkflowApprover, {
          where: {
            instanceId,
            stepId,
            userId: actorId,
            status: 'CONSULTING',
          },
        });
        if (consultantApprover) {
          consultantApprover.status = 'APPROVED';
          consultantApprover.comment = comment || null;
          consultantApprover.actionAt = new Date();
          await manager.save(WorkflowApprover, consultantApprover);
        }

        // Log feedback action
        await this.logService.writeLog(
          tenantId,
          instanceId,
          stepId,
          'PROVIDE_FEEDBACK',
          actorId,
          { feedback: comment },
        );

        // Check if there are any other pending consultations for this step
        const otherPending = await manager.findOne(WorkflowConsultation, {
          where: { instanceId, stepId, status: 'PENDING' },
        });

        if (!otherPending) {
          // Unfreeze step & resume instance to IN_PROGRESS
          instance.status = 'IN_PROGRESS';
          await manager.save(WorkflowInstance, instance);
        }

        return manager.findOne(WorkflowInstance, {
          where: { id: instanceId },
          relations: ['approvers'],
        }) as Promise<WorkflowInstance>;
      });
    }

    // Freeze Check: If instance is frozen for consultation, block regular actions
    if (instance.status === 'AWAITING_CONSULTATION') {
      const pendingConsult = await this.consultationRepository.findOne({
        where: { instanceId, stepId, status: 'PENDING' },
      });
      if (pendingConsult) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'AWAITING_CONSULTATION',
            messageKey: 'workflow.awaiting_consultation',
          },
        });
      }
    }

    // Verify actor is assigned to the current step
    const approverTask = await this.approverRepository.findOne({
      where: {
        instanceId,
        stepId,
        userId: actorId,
        status: 'PENDING',
      },
    });

    if (!approverTask) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'UNASSIGNED_ACTOR',
          messageKey: 'workflow.unassigned_actor',
        },
      });
    }

    // Action execution
    if (action === 'CONSULT') {
      if (!consultantId) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'CONSULTANT_REQUIRED',
            messageKey: 'workflow.consultant_required',
          },
        });
      }

      return this.dataSource.transaction(async (manager) => {
        // Create consultation record
        const consult = new WorkflowConsultation();
        consult.tenantId = tenantId;
        consult.instanceId = instanceId;
        consult.stepId = stepId;
        consult.requesterId = actorId;
        consult.consultantId = consultantId;
        consult.status = 'PENDING';
        consult.comment = comment || null;
        await manager.save(WorkflowConsultation, consult);

        // Add consultant to workflow_approvers as CONSULTING task
        const consultantApprover = new WorkflowApprover();
        consultantApprover.tenantId = tenantId;
        consultantApprover.instanceId = instanceId;
        consultantApprover.stepId = stepId;
        consultantApprover.userId = consultantId;
        consultantApprover.status = 'CONSULTING';
        await manager.save(WorkflowApprover, consultantApprover);

        // Freeze instance
        instance.status = 'AWAITING_CONSULTATION';
        await manager.save(WorkflowInstance, instance);

        // Log consultation
        await this.logService.writeLog(
          tenantId,
          instanceId,
          stepId,
          'CONSULT',
          actorId,
          { consultantId, comment },
        );

        return manager.findOne(WorkflowInstance, {
          where: { id: instanceId },
          relations: ['approvers'],
        }) as Promise<WorkflowInstance>;
      });
    }

    if (action === 'REJECT') {
      return this.dataSource.transaction(async (manager) => {
        approverTask.status = 'REJECTED';
        approverTask.comment = comment || null;
        approverTask.actionAt = new Date();
        await manager.save(WorkflowApprover, approverTask);

        instance.status = 'REJECTED';
        await manager.save(WorkflowInstance, instance);

        await this.logService.writeLog(
          tenantId,
          instanceId,
          stepId,
          'REJECT',
          actorId,
          { comment },
        );

        return manager.findOne(WorkflowInstance, {
          where: { id: instanceId },
          relations: ['approvers'],
        }) as Promise<WorkflowInstance>;
      });
    }

    if (action === 'SPAWN_SUBPROCESS') {
      if (!subWorkflowId) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'SUB_WORKFLOW_REQUIRED',
            messageKey: 'workflow.sub_workflow_required',
          },
        });
      }

      return this.dataSource.transaction(async (manager) => {
        // Spawn Child Sub-process
        const childInstance = new WorkflowInstance();
        childInstance.workflowId = subWorkflowId;
        childInstance.tenantId = tenantId;
        childInstance.creatorId = actorId;
        childInstance.status = 'IN_PROGRESS';
        childInstance.parentInstanceId = instanceId;
        childInstance.contextData = instance.contextData;

        // Fetch sub-workflow steps to find START and activate next steps
        const subWf = await manager.findOne(Workflow, {
          where: { id: subWorkflowId },
          relations: ['steps'],
        });

        if (!subWf) {
          throw new NotFoundException({
            success: false,
            error: {
              code: 'SUB_WORKFLOW_NOT_FOUND',
              messageKey: 'workflow.sub_workflow_not_found',
            },
          });
        }

        const subStart = subWf.steps.find((s) => s.stepType === 'START');
        if (subStart && subStart.nextStepIds) {
          childInstance.currentStepIds = subStart.nextStepIds;
        }

        const savedChild = await manager.save(WorkflowInstance, childInstance);

        // Write spawn logs
        await this.logService.writeLog(
          tenantId,
          savedChild.id,
          subStart?.id || null,
          'SUBMIT',
          actorId,
          instance.contextData,
        );

        // Activate child steps
        if (subStart && subStart.nextStepIds) {
          for (const sId of subStart.nextStepIds) {
            const childStep = subWf.steps.find((s) => s.id === sId);
            if (childStep) {
              await this.activateStepInTransaction(manager, savedChild.id, childStep, tenantId);
            }
          }
        }

        // Freeze parent
        instance.status = 'WAITING_SUBPROCESS';
        await manager.save(WorkflowInstance, instance);

        // Log parent action
        await this.logService.writeLog(
          tenantId,
          instanceId,
          stepId,
          'SPAWN_SUBPROCESS',
          actorId,
          { childInstanceId: savedChild.id, subWorkflowId },
        );

        return manager.findOne(WorkflowInstance, {
          where: { id: instanceId },
          relations: ['approvers'],
        }) as Promise<WorkflowInstance>;
      });
    }

    if (action === 'APPROVE') {
      return this.dataSource.transaction(async (manager) => {
        // Update user task to APPROVED
        approverTask.status = 'APPROVED';
        approverTask.comment = comment || null;
        approverTask.actionAt = new Date();

        // If form injection data was sent, merge it into contextData
        if (formData) {
          instance.contextData = {
            ...(instance.contextData || {}),
            ...formData,
          };
          await manager.save(WorkflowInstance, instance);
        }

        await manager.save(WorkflowApprover, approverTask);

        // Log approval
        await this.logService.writeLog(
          tenantId,
          instanceId,
          stepId,
          'APPROVE',
          actorId,
          { comment, formData },
        );

        // Evaluate step consensus
        const step = await manager.findOne(WorkflowStep, { where: { id: stepId } });
        if (!step) {
          throw new NotFoundException({
            success: false,
            error: { code: 'STEP_NOT_FOUND', messageKey: 'workflow.step_not_found' },
          });
        }

        const isCompleted = await this.checkConsensusInTransaction(manager, instanceId, stepId, step.config);

        if (isCompleted) {
          // Log step completion
          await this.logService.writeLog(
            tenantId,
            instanceId,
            stepId,
            'STEP_COMPLETED',
            actorId,
            null,
          );

          // If step config has templateId, trigger document generation automatically
          if (step.templateId) {
            try {
              await this.templateService.generateDocument(
                step.templateId,
                instanceId,
                'PDF',
                tenantId,
              );
            } catch (err) {
              console.error('Failed to auto-generate document on step completion:', err);
            }
          }

          // Transition to next steps
          await this.transitionNextInTransaction(manager, instance, stepId, tenantId);
        }

        return manager.findOne(WorkflowInstance, {
          where: { id: instanceId },
          relations: ['approvers'],
        }) as Promise<WorkflowInstance>;
      });
    }

    throw new BadRequestException({
      success: false,
      error: {
        code: 'INVALID_ACTION',
        messageKey: 'workflow.invalid_action',
      },
    });
  }

  async getInstanceById(id: string, tenantId: string | null): Promise<WorkflowInstance> {
    const instance = await this.instanceRepository.findOne({
      where: { id },
      relations: ['approvers', 'workflow', 'logs'],
    });

    if (!instance) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'WORKFLOW_INSTANCE_NOT_FOUND',
          messageKey: 'workflow.instance_not_found',
        },
      });
    }

    if (instance.tenantId && instance.tenantId !== tenantId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'TENANT_MISMATCH',
          messageKey: 'storage.access_denied',
        },
      });
    }

    return instance;
  }

  // ── Runtime Helpers (Transacted) ───────────────────────────────────────────

  private async activateStepInTransaction(
    manager: any,
    instanceId: string,
    step: WorkflowStep,
    tenantId: string | null,
  ) {
    // Resolve assignees for step
    const assignees = await this.resolveStepAssignees(manager, step, tenantId);

    // Create workflow_approver records
    const approvers: WorkflowApprover[] = [];
    
    let deadlineAt: Date | null = null;
    if (step.config) {
      const now = new Date();
      if (step.config.durationHours) {
        deadlineAt = new Date(now.getTime() + step.config.durationHours * 60 * 60 * 1000);
      } else if (step.config.durationDays) {
        deadlineAt = new Date(now.getTime() + step.config.durationDays * 24 * 60 * 60 * 1000);
      }
    }

    for (const user of assignees) {
      const app = new WorkflowApprover();
      app.tenantId = tenantId;
      app.instanceId = instanceId;
      app.stepId = step.id;
      app.userId = user.id;
      app.status = 'PENDING';
      app.deadlineAt = deadlineAt;
      approvers.push(app);
    }

    if (approvers.length > 0) {
      const savedApprovers = await manager.save(WorkflowApprover, approvers);
      
      // Register delayed job for each saved approver if deadline is set
      if (deadlineAt) {
        const now = Date.now();
        const delay = deadlineAt.getTime() - now;
        if (delay > 0) {
          for (const app of savedApprovers) {
            this.notificationClient.emit('schedule_deadline_reminder', {
              approverId: app.id,
              delay,
            });
          }
        }
      }

      // Fetch workflow name to build rich notifications
      const workflow = await manager.findOne(Workflow, { where: { id: step.workflowId } });
      const wfName = workflow ? workflow.name : 'Quy trình';

      // Send in-app and email notifications asynchronously for each assignee
      for (const user of assignees) {
        this.notificationClient.emit('send_notification', {
          tenantId,
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          wfName,
          instanceId,
        });
      }
    }
  }

  private async resolveStepAssignees(manager: any, step: WorkflowStep, tenantId: string | null): Promise<User[]> {
    const assignees = await manager.find(WorkflowStepAssignee, {
      where: { stepId: step.id },
    });

    let resolvedUsers: User[] = [];
    for (const assignee of assignees) {
      if (assignee.assigneeType === 'USER') {
        const user = await manager.findOne(User, {
          where: { id: assignee.assigneeId, tenantId: tenantId as any },
        });
        if (user) resolvedUsers.push(user);
      } else if (assignee.assigneeType === 'ROLE') {
        const users = await manager.getRepository(User)
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.roles', 'role')
          .where('user.tenantId = :tenantId', { tenantId })
          .andWhere('(LOWER(role.name) = :val OR LOWER(role.code) = :val)', { val: assignee.assigneeId.toLowerCase() })
          .getMany();
        resolvedUsers.push(...users);
      } else if (assignee.assigneeType === 'DEPARTMENT') {
        const employees = await manager.find(Employee, {
          where: { tenantId: tenantId as any, departmentId: assignee.assigneeId },
        });
        const emails = employees.map((emp: any) => emp.email).filter(Boolean);
        if (emails.length > 0) {
          const users = await manager.find(User, {
            where: { tenantId: tenantId as any, email: In(emails) },
          });
          resolvedUsers.push(...users);
        }
      }
    }

    // Deduplicate users
    const userMap = new Map<string, User>();
    for (const u of resolvedUsers) {
      userMap.set(u.id, u);
    }
    return Array.from(userMap.values());
  }

  private async checkConsensusInTransaction(
    manager: any,
    instanceId: string,
    stepId: string,
    config: any,
  ): Promise<boolean> {
    const approvers = await manager.find(WorkflowApprover, {
      where: { instanceId, stepId },
    });

    if (approvers.length === 0) return true;

    const total = approvers.filter(a => a.status !== 'CONSULTING').length;
    const approved = approvers.filter((a: any) => a.status === 'APPROVED').length;

    const rule = config?.consensusRule || 'ALL';

    if (rule === 'ANY') {
      return approved >= 1;
    }

    if (rule === 'PERCENTAGE') {
      const threshold = config?.percentageThreshold ? Number(config.percentageThreshold) : 60;
      const pct = (approved / total) * 100;
      return pct >= threshold;
    }

    // Default to ALL
    return approved === total;
  }

  private async transitionNextInTransaction(
    manager: any,
    instance: WorkflowInstance,
    completedStepId: string,
    tenantId: string | null,
  ) {
    const step = await manager.findOne(WorkflowStep, {
      where: { id: completedStepId },
    });

    if (!step) return;

    // Remove completed step from current steps
    instance.currentStepIds = (instance.currentStepIds || []).filter((id) => id !== completedStepId);

    const nextIds = step.nextStepIds || [];

    if (nextIds.length === 0) {
      // No next steps, check if this branch was the last active path
      if (instance.currentStepIds.length === 0) {
        instance.status = 'APPROVED';
        await manager.save(WorkflowInstance, instance);

        // Resume Parent Sub-process if exists
        await this.resumeParentInTransaction(manager, instance.id, tenantId);
      } else {
        await manager.save(WorkflowInstance, instance);
      }
      return;
    }

    for (const nextId of nextIds) {
      const nextStep = await manager.findOne(WorkflowStep, {
        where: { id: nextId },
      });

      if (!nextStep) continue;

      if (nextStep.stepType === 'JOIN') {
        // Parallel Join Barrier Synchronizer
        const incomingSteps = await manager.find(WorkflowStep, {
          where: { workflowId: nextStep.workflowId },
        });

        // Find all step IDs that transition into this JOIN step
        const incomingStepIds = incomingSteps
          .filter((s: any) => s.nextStepIds && s.nextStepIds.includes(nextStep.id))
          .map((s: any) => s.id);

        // Find approver status for all incoming steps in this instance
        const approvers = await manager.find(WorkflowApprover, {
          where: { instanceId: instance.id, stepId: In(incomingStepIds) },
        });

        // If there are still active / pending approver tasks, JOIN blocks
        const hasPending = approvers.some(
          (app: any) => app.status === 'PENDING' || app.status === 'CONSULTING',
        );

        if (!hasPending) {
          // Join barrier satisfied, transition past the JOIN step
          await this.transitionNextInTransaction(manager, instance, nextStep.id, tenantId);
        }
      } else if (nextStep.stepType === 'FORK') {
        // Parallel Fork branches
        await this.transitionNextInTransaction(manager, instance, nextStep.id, tenantId);
      } else if (nextStep.stepType === 'END') {
        // Reached end step
        instance.status = 'APPROVED';
        await manager.save(WorkflowInstance, instance);

        // Resume Parent Sub-process if exists
        await this.resumeParentInTransaction(manager, instance.id, tenantId);
      } else {
        // Standard Approval step
        // Evaluate conditions if specified
        let isConditionMet = true;
        if (nextStep.config?.condition) {
          isConditionMet = this.evaluateCondition(nextStep.config.condition, instance.contextData || {});
        }

        if (isConditionMet) {
          if (!instance.currentStepIds.includes(nextStep.id)) {
            instance.currentStepIds.push(nextStep.id);
          }
          await manager.save(WorkflowInstance, instance);
          await this.activateStepInTransaction(manager, instance.id, nextStep, tenantId);
        }
      }
    }
  }

  private async resumeParentInTransaction(manager: any, childInstanceId: string, tenantId: string | null) {
    const child = await manager.findOne(WorkflowInstance, {
      where: { id: childInstanceId },
    });

    if (child && child.parentInstanceId) {
      const parent = await manager.findOne(WorkflowInstance, {
        where: { id: child.parentInstanceId },
      });

      if (parent && parent.status === 'WAITING_SUBPROCESS') {
        // Resume parent instance
        parent.status = 'IN_PROGRESS';
        await manager.save(WorkflowInstance, parent);

        // Complete the parent step that spawned the child subprocess
        if (parent.currentStepIds && parent.currentStepIds.length > 0) {
          for (const pStepId of parent.currentStepIds) {
            const pStep = await manager.findOne(WorkflowStep, { where: { id: pStepId } });
            if (pStep && pStep.config?.subWorkflowId === child.workflowId) {
              await this.transitionNextInTransaction(manager, parent, pStepId, tenantId);
            }
          }
        }
      }
    }
  }

  private evaluateCondition(expression: string, contextData: any): boolean {
    try {
      // Expression replacement: context.totalAmount -> this.totalAmount
      const sanitized = expression.replace(/context\./g, 'this.');
      const fn = new Function(`return ${sanitized};`);
      return !!fn.call(contextData);
    } catch (e) {
      console.error('Failed to evaluate condition expression:', expression, e);
      return false;
    }
  }
}
