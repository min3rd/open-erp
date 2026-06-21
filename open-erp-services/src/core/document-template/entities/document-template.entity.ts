import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';
import { SysFile } from '../../storage/file.entity';

@Entity('document_templates')
export class DocumentTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant | null;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'file_id', type: 'uuid' })
  fileId: string;

  @ManyToOne(() => SysFile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_id' })
  file: SysFile;

  @Column({ name: 'mapping', type: 'jsonb' })
  mapping: Array<{
    placeholder: string;
    source: string;
    transform?: 'uppercase' | 'lowercase' | 'currency_text';
  }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
