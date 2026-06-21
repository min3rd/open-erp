import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';

@Entity('dynamic_forms')
export class DynamicForm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant | null;

  /**
   * Mã khóa cố định xác định duy nhất form không đổi theo version
   * Ví dụ: 'leave_request_form', 'purchase_proposal_form'
   */
  @Column({ name: 'form_key', type: 'varchar', length: 255 })
  formKey: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  /**
   * Số hiệu phiên bản (1, 2, 3, ...)
   * Tăng tự động mỗi khi tạo bản cập nhật mới cho cùng formKey
   */
  @Column({ name: 'version', type: 'integer', default: 1 })
  version: number;

  /**
   * Đánh dấu đây có phải phiên bản mới nhất đang được áp dụng hay không
   * Chỉ một bản ghi có (tenant_id, form_key) có thể có is_latest = true
   */
  @Column({ name: 'is_latest', type: 'boolean', default: true })
  isLatest: boolean;

  /**
   * Mảng cấu hình định nghĩa các trường trong form (JSON schema)
   * Mỗi phần tử mô tả: id, name, label, type, required, validation rules, options
   */
  @Column({ name: 'fields', type: 'jsonb', default: [] })
  fields: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
