import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { WorkflowStepAssignee } from './entities/workflow-step-assignee.entity';
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
      throw new BadRequestException('Tên quy trình không được để trống (name is required)');
    }

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      throw new BadRequestException('Danh sách các bước không hợp lệ (steps must be a non-empty array)');
    }

    // 1. Validation: check that there is at least one START and one END step
    const hasStart = steps.some((s) => s.stepType === 'START');
    const hasEnd = steps.some((s) => s.stepType === 'END');
    if (!hasStart) {
      throw new BadRequestException('Quy trình phải có ít nhất một bước START (START step is required)');
    }
    if (!hasEnd) {
      throw new BadRequestException('Quy trình phải có ít nhất một bước END (END step is required)');
    }

    // 2. Validation: ensure all step IDs referenced in nextStepIds exist in the steps array
    const stepIds = new Set(steps.map((s) => s.id));
    for (const step of steps) {
      if (step.nextStepIds && Array.isArray(step.nextStepIds)) {
        for (const nextId of step.nextStepIds) {
          if (!stepIds.has(nextId)) {
            throw new BadRequestException(
              `Bước tiếp theo "${nextId}" của bước "${step.id}" không tồn tại (nextStepId not found)`,
            );
          }
        }
      }
    }

    // 3. Validation: cycle detection using DFS
    if (this.hasCycle(steps)) {
      throw new BadRequestException('Phát hiện vòng lặp vô hạn trong cấu trúc quy trình (Cycle detected)');
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
      throw new NotFoundException(`Quy trình với ID ${id} không tồn tại (workflow not found)`);
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
}
