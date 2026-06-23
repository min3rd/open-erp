import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as forge from 'node-forge';
import * as crypto from 'crypto';
import { SystemCa } from './entities/system-ca.entity';
import { UserCertificate } from './entities/user-certificate.entity';
import { User } from '../user/user.entity';
import { WorkflowInstance } from '../workflow/entities/workflow-instance.entity';
import { WorkflowApprover, WorkflowApproverStatus } from '../workflow/entities/workflow-approver.entity';
import { WorkflowLog, WorkflowAction } from '../workflow/entities/workflow-log.entity';
import { WorkflowInstanceService } from '../workflow/workflow-instance.service';
import { SignInstanceDto } from './dto/sign-instance.dto';

@Injectable()
export class SignatureService {
  private masterKey: string;

  constructor(
    @InjectRepository(SystemCa)
    private readonly systemCaRepository: Repository<SystemCa>,
    @InjectRepository(UserCertificate)
    private readonly userCertRepository: Repository<UserCertificate>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WorkflowInstance)
    private readonly instanceRepository: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowApprover)
    private readonly approverRepository: Repository<WorkflowApprover>,
    @InjectRepository(WorkflowLog)
    private readonly logRepository: Repository<WorkflowLog>,
    private readonly workflowInstanceService: WorkflowInstanceService,
    private readonly configService: ConfigService,
  ) {
    this.masterKey = this.configService.get<string>('CA_MASTER_KEY', 'default-master-key-change-me');
  }

  // 1. Ký số quy trình phê duyệt
  async signInstance(
    userId: string,
    tenantId: string | null,
    dto: SignInstanceDto,
  ): Promise<{ logId: string; signature: string; signedAt: Date }> {
    const { instanceId, stepId, passphrase } = dto;

    // a. Kiểm tra xem người dùng có phải là approver PENDING của bước duyệt này không
    const approverTask = await this.approverRepository.findOne({
      where: {
        instanceId,
        stepId,
        userId,
        status: WorkflowApproverStatus.PENDING,
      },
    });

    if (!approverTask) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'UNASSIGNED_ACTOR',
          messageKey: 'workflow.unassigned_actor',
        },
      });
    }

    // b. Kiểm tra xem instance quy trình có tồn tại không
    const instance = await this.instanceRepository.findOne({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'WORKFLOW_INSTANCE_NOT_FOUND',
          messageKey: 'workflow.instance_not_found',
        },
      });
    }

    // c. Tải chứng thư số và giải mã khóa riêng tư
    const cert = await this.userCertRepository.findOne({
      where: { userId, tenantId: tenantId as any },
    });

    if (!cert || cert.validTo < new Date()) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'CERTIFICATE_NOT_FOUND_OR_EXPIRED',
          messageKey: 'ca.certificate_not_found_or_expired',
        },
      });
    }

    let privateKeyPem: string;
    try {
      const [ivHex, encrypted] = cert.encryptedPrivateKey.split(':');
      const userKey = crypto.pbkdf2Sync(passphrase, cert.passphraseSalt, 10000, 32, 'sha256');
      const decipher = crypto.createDecipheriv('aes-256-cbc', userKey, Buffer.from(ivHex, 'hex'));
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      privateKeyPem = decrypted;
    } catch (err) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_PASSPHRASE',
          messageKey: 'ca.invalid_passphrase',
        },
      });
    }

    // d. Tạo payload cần ký số
    const payloadToSign = `${instanceId}:${stepId}:${userId}:${tenantId || ''}:${JSON.stringify(instance.contextData || {})}`;

    // e. Tiến hành ký số
    const sign = crypto.createSign('SHA256');
    sign.update(payloadToSign);
    const signature = sign.sign(privateKeyPem, 'base64');

    // f. Gọi luồng executeAction của WorkflowEngine để lưu vết chữ ký số và phê duyệt
    await this.workflowInstanceService.executeAction(tenantId, instanceId, userId, {
      stepId,
      action: WorkflowAction.APPROVE,
      comment: 'Đã phê duyệt và ký số nội bộ thành công',
      signature,
      certificatePem: cert.certificatePem,
    });

    // g. Lấy log phê duyệt vừa ghi nhận chữ ký số
    const log = await this.logRepository.findOne({
      where: {
        instanceId,
        stepId,
        actorId: userId,
        action: WorkflowAction.APPROVE,
      },
      order: { timestamp: 'DESC' },
    });

    if (!log) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'LOG_NOT_FOUND',
          messageKey: 'workflow.log_not_found',
        },
      });
    }

    return {
      logId: log.id,
      signature,
      signedAt: log.timestamp,
    };
  }

  // 2. Xác thực chữ ký số của quy trình
  async verifyInstance(instanceId: string): Promise<{
    isValid: boolean;
    signedBy: string | null;
    commonName: string | null;
    verificationDetails: {
      certificateChainValid: boolean;
      contentIntact: boolean;
      certExpired: boolean;
    };
  }> {
    // a. Tải danh sách logs để tìm bản ghi có chứa chữ ký số
    const logs = await this.logRepository.find({
      where: { instanceId },
      order: { timestamp: 'DESC' },
    });

    // Tìm log mới nhất có chữ ký số
    const signedLog = logs.find((l) => l.payload?.signature && l.payload?.certificatePem);

    if (!signedLog) {
      return {
        isValid: false,
        signedBy: null,
        commonName: null,
        verificationDetails: {
          certificateChainValid: false,
          contentIntact: false,
          certExpired: true,
        },
      };
    }

    const { signature, certificatePem, contextData } = signedLog.payload;

    // b. Trích xuất X.509 Certificate
    let userCertForge: forge.pki.Certificate;
    let email = '';
    try {
      userCertForge = forge.pki.certificateFromPem(certificatePem);
      email = userCertForge.subject.getField('CN')?.value as string;
    } catch (e) {
      return {
        isValid: false,
        signedBy: null,
        commonName: null,
        verificationDetails: {
          certificateChainValid: false,
          contentIntact: false,
          certExpired: true,
        },
      };
    }

    // Tra cứu thông tin người dùng trong hệ thống qua email
    let commonName = email;
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      commonName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || email;
    }

    // c. Xác thực Certificate Chain với Root CA
    const rootCa = await this.systemCaRepository.findOne({ where: { id: 'root' } });
    let certificateChainValid = false;
    if (rootCa) {
      try {
        const rootCertForge = forge.pki.certificateFromPem(rootCa.certificatePem);
        certificateChainValid = rootCertForge.verify(userCertForge);
      } catch (e) {
        certificateChainValid = false;
      }
    }

    // d. Kiểm tra thời hạn hiệu lực tại thời điểm ký
    const signTime = new Date(signedLog.timestamp);
    const certExpired =
      signTime < userCertForge.validity.notBefore || signTime > userCertForge.validity.notAfter;

    // e. Xác thực tính toàn vẹn của nội dung (Verify Hash & Signature)
    let contentIntact = false;
    try {
      const payloadToVerify = `${instanceId}:${signedLog.stepId}:${signedLog.actorId}:${
        signedLog.tenantId || ''
      }:${JSON.stringify(contextData || {})}`;

      const verify = crypto.createVerify('SHA256');
      verify.update(payloadToVerify);

      const publicKeyPem = forge.pki.publicKeyToPem(userCertForge.publicKey);
      contentIntact = verify.verify(publicKeyPem, signature, 'base64');
    } catch (e) {
      contentIntact = false;
    }

    const isValid = certificateChainValid && contentIntact && !certExpired;

    return {
      isValid,
      signedBy: email,
      commonName,
      verificationDetails: {
        certificateChainValid,
        contentIntact,
        certExpired,
      },
    };
  }
}
