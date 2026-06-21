import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('system_ca')
export class SystemCa {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string; // Mặc định là 'root'

  @Column({ type: 'text', name: 'certificate_pem' })
  certificatePem: string;

  @Column({ type: 'text', name: 'encrypted_private_key' })
  encryptedPrivateKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
