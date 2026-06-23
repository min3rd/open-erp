import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';
import { User } from '../../user/user.entity';
import { WorkflowInstance } from './workflow-instance.entity';
import { WorkflowStep } from './workflow-step.entity';
import { Department } from '../../../features/org/entities/department.entity';

@Entity('workflow_approvers')
export class WorkflowApprover {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant | null;

  @Column({ name: 'instance_id', type: 'uuid' })
  instanceId: string;

  @ManyToOne(() => WorkflowInstance, (instance) => instance.approvers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instance_id' })
  instance: WorkflowInstance;

  @Column({ name: 'step_id', type: 'uuid' })
  stepId: string;

  @ManyToOne(() => WorkflowStep, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'step_id' })
  step: WorkflowStep;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @ManyToOne(() => Department, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department | null;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'PENDING' })
  status: WorkflowApproverStatus; // PENDING | APPROVED | REJECTED | CONSULTING

  @Column({ name: 'comment', type: 'text', nullable: true })
  comment: string | null;

  @Column({ name: 'signature_id', type: 'uuid', nullable: true })
  signatureId: string | null;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;

  @Column({ name: 'action_at', type: 'timestamptz', nullable: true })
  actionAt: Date | null;

  @Column({ name: 'deadline_at', type: 'timestamptz', nullable: true })
  deadlineAt: Date | null;
}

export enum WorkflowApproverStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONSULTING = 'CONSULTING',
}

