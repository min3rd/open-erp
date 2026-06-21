import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';
import { User } from '../../user/user.entity';
import { Workflow } from './workflow.entity';
import { WorkflowApprover } from './workflow-approver.entity';
import { WorkflowLog } from './workflow-log.entity';

@Entity('workflow_instances')
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_id', type: 'uuid' })
  workflowId: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.instances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant | null;

  @Column({ name: 'creator_id', type: 'uuid' })
  creatorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'PENDING' })
  status: string; // 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS'

  @Column({ name: 'current_step_ids', type: 'uuid', array: true, nullable: true })
  currentStepIds: string[] | null;

  @Column({ name: 'context_data', type: 'jsonb', nullable: true })
  contextData: any;

  @OneToMany(() => WorkflowApprover, (approver) => approver.instance)
  approvers: WorkflowApprover[];

  @OneToMany(() => WorkflowLog, (log) => log.instance)
  logs: WorkflowLog[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
