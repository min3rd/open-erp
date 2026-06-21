import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_certificates')
export class UserCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId: string | null;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'text', name: 'certificate_pem' })
  certificatePem: string;

  @Column({ type: 'text', name: 'encrypted_private_key' })
  encryptedPrivateKey: string;

  @Column({ type: 'varchar', name: 'passphrase_salt', length: 100 })
  passphraseSalt: string;

  @Column({ type: 'varchar', name: 'serial_number', length: 100 })
  serialNumber: string;

  @Column({ type: 'varchar', name: 'subject', length: 255 })
  subject: string;

  @Column({ type: 'timestamp', name: 'valid_from' })
  validFrom: Date;

  @Column({ type: 'timestamp', name: 'valid_to' })
  validTo: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
