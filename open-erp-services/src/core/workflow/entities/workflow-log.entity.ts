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

@Entity('workflow_logs')
export class WorkflowLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant | null;

  @Column({ name: 'instance_id', type: 'uuid' })
  instanceId: string;

  @ManyToOne(() => WorkflowInstance, (instance) => instance.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instance_id' })
  instance: WorkflowInstance;

  @Column({ name: 'step_id', type: 'uuid', nullable: true })
  stepId: string | null;

  @ManyToOne(() => WorkflowStep, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'step_id' })
  step: WorkflowStep | null;

  @Column({ name: 'action', type: 'varchar', length: 50 })
  action: string; // 'SUBMIT' | 'APPROVE' | 'REJECT' | 'CONSULT' | 'SIGN' | 'FORWARD'

  @Column({ name: 'actor_id', type: 'uuid' })
  actorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column({ name: 'payload', type: 'jsonb', nullable: true })
  payload: any;

  @Column({ name: 'prev_hash', type: 'varchar', length: 64 })
  prevHash: string;

  @Column({ name: 'hash', type: 'varchar', length: 64 })
  hash: string;

  @CreateDateColumn({ name: 'timestamp', type: 'timestamptz' })
  timestamp: Date;
}
