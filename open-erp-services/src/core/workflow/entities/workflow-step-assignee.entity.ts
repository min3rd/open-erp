import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';
import { WorkflowStep } from './workflow-step.entity';

@Entity('workflow_step_assignees')
export class WorkflowStepAssignee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'step_id', type: 'uuid' })
  stepId: string;

  @ManyToOne(() => WorkflowStep, (step) => step.assignees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'step_id' })
  step: WorkflowStep;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant | null;

  @Column({ name: 'assignee_type', type: 'varchar', length: 50 })
  assigneeType: AssigneeType; // 'USER' | 'DEPARTMENT' | 'ROLE' | 'DYNAMIC'
  
  @Column({ name: 'assignee_id', type: 'varchar', length: 255 })
  assigneeId: string;
}

export enum AssigneeType {
  USER = 'USER',
  DEPARTMENT = 'DEPARTMENT',
  ROLE = 'ROLE',
  DYNAMIC = 'DYNAMIC',
}
