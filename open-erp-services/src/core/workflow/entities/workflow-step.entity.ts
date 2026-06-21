import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';
import { Workflow } from './workflow.entity';
import { WorkflowStepAssignee } from './workflow-step-assignee.entity';

@Entity('workflow_steps')
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_id', type: 'uuid' })
  workflowId: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant | null;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'step_order', type: 'integer' })
  stepOrder: number;

  @Column({ name: 'step_type', type: 'varchar', length: 50, default: 'APPROVAL' })
  stepType: string; // 'START' | 'APPROVAL' | 'FORK' | 'JOIN' | 'END'

  @Column({ name: 'next_step_ids', type: 'uuid', array: true, nullable: true })
  nextStepIds: string[] | null;

  @Column({ name: 'config', type: 'jsonb', nullable: true })
  config: any;

  @Column({ name: 'form_id', type: 'uuid', nullable: true })
  formId: string | null;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string | null;

  @OneToMany(() => WorkflowStepAssignee, (assignee) => assignee.step)
  assignees: WorkflowStepAssignee[];
}
