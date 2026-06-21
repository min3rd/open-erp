import { Injectable, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as forge from 'node-forge';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { SystemCa } from './entities/system-ca.entity';
import { UserCertificate } from './entities/user-certificate.entity';
import { User } from '../user/user.entity';
import { Tenant } from '../tenant/tenant.entity';

const generateKeyPairAsync = promisify(crypto.generateKeyPair);

@Injectable()
export class CaService implements OnModuleInit {
  private masterKey: string;

  constructor(
    @InjectRepository(SystemCa)
    private readonly systemCaRepository: Repository<SystemCa>,
    @InjectRepository(UserCertificate)
    private readonly userCertRepository: Repository<UserCertificate>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly configService: ConfigService,
  ) {
    this.masterKey = this.configService.get<string>('CA_MASTER_KEY', 'default-master-key-change-me');
  }

  async onModuleInit() {
    await this.initializeRootCaIfNeeded();
  }

  // 1. Khởi tạo Root CA nếu chưa tồn tại
  private async initializeRootCaIfNeeded() {
    const existing = await this.systemCaRepository.findOne({ where: { id: 'root' } });
    if (existing) {
      console.log('[PKI CA] Root CA already initialized.');
      return;
    }

    console.log('[PKI CA] Initializing Root CA...');
    try {
      // Sinh khóa RSA 2048-bit cho Root CA
      const keys = forge.pki.rsa.generateKeyPair(2048);

      const cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = '01';
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10); // Hạn 10 năm

      const attrs = [
        { name: 'commonName', value: 'OpenERP Root CA' },
        { name: 'countryName', value: 'VN' },
        { name: 'organizationName', value: 'OpenERP Platform' },
      ];
      cert.setSubject(attrs);
      cert.setIssuer(attrs);

      // Thêm extensions cho Root CA
      cert.setExtensions([
        {
          name: 'basicConstraints',
          cA: true,
        },
        {
          name: 'keyUsage',
          keyCertSign: true,
          digitalSignature: true,
          nonRepudiation: true,
          keyEncipherment: true,
          dataEncipherment: true,
        },
      ]);

      // Tự ký nhận chứng thư gốc bằng private key của nó
      cert.sign(keys.privateKey, forge.md.sha256.create());

      const certPem = forge.pki.certificateToPem(cert);
      const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);

      // Mã hóa Root Private Key
      const encryptedPrivateKey = this.encryptAes256(privateKeyPem, this.masterKey);

      const systemCa = new SystemCa();
      systemCa.id = 'root';
      systemCa.certificatePem = certPem;
      systemCa.encryptedPrivateKey = encryptedPrivateKey;

      await this.systemCaRepository.save(systemCa);
      console.log('[PKI CA] Root CA initialized and saved successfully.');
    } catch (err) {
      console.error('[PKI CA] Failed to initialize Root CA:', err);
    }
  }

  // 2. Cấp phát chứng thư số cho người dùng
  async issueCertificate(
    userId: string,
    tenantId: string | null,
    passphrase: string,
  ): Promise<UserCertificate> {
    // a. Kiểm tra xem người dùng đã có chứng thư số hợp lệ chưa
    const existingCert = await this.userCertRepository.findOne({
      where: { userId, tenantId: tenantId as any },
    });

    if (existingCert && existingCert.validTo > new Date()) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'CERTIFICATE_ALREADY_EXISTS',
          messageKey: 'ca.certificate_already_exists',
        },
      });
    }

    // b. Load thông tin người dùng và doanh nghiệp
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          messageKey: 'auth.user_not_found',
        },
      });
    }

    let tenantName = 'OpenERP Client';
    if (tenantId) {
      const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
      if (tenant) {
        tenantName = tenant.name;
      }
    }

    // c. Load Root CA để ký
    const rootCa = await this.systemCaRepository.findOne({ where: { id: 'root' } });
    if (!rootCa) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'ROOT_CA_NOT_FOUND',
          messageKey: 'ca.root_ca_not_found',
        },
      });
    }

    // Giải mã Root Private Key
    let rootPrivateKeyPem: string;
    try {
      rootPrivateKeyPem = this.decryptAes256(rootCa.encryptedPrivateKey, this.masterKey);
    } catch (err) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'ROOT_CA_DECRYPTION_FAILED',
          messageKey: 'ca.root_ca_decryption_failed',
        },
      });
    }

    // d. Sinh cặp khóa RSA 2048-bit bất đồng bộ qua crypto (Libuv Thread Pool)
    console.log(`[PKI CA] Generating RSA keypair asynchronously for user ${user.email}...`);
    const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    // e. Tạo chứng thư số X.509
    const forgePublicKey = forge.pki.publicKeyFromPem(publicKey);
    const forgeRootPrivateKey = forge.pki.privateKeyFromPem(rootPrivateKeyPem);
    const forgeRootCert = forge.pki.certificateFromPem(rootCa.certificatePem);

    const userCert = forge.pki.createCertificate();
    userCert.publicKey = forgePublicKey;
    userCert.serialNumber = new Date().getTime().toString();
    userCert.validity.notBefore = new Date();
    userCert.validity.notAfter = new Date();
    userCert.validity.notAfter.setFullYear(userCert.validity.notBefore.getFullYear() + 1); // 1 năm

    const subject = `CN=${user.email}, O=${tenantName}, C=VN`;
    const attrs = [
      { name: 'commonName', value: user.email },
      { name: 'countryName', value: 'VN' },
      { name: 'organizationName', value: tenantName },
    ];
    userCert.setSubject(attrs);
    userCert.setIssuer(forgeRootCert.subject.attributes);

    userCert.setExtensions([
      {
        name: 'basicConstraints',
        cA: false,
      },
      {
        name: 'keyUsage',
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true,
      },
    ]);

    // Ký bằng Root CA Private Key
    userCert.sign(forgeRootPrivateKey, forge.md.sha256.create());

    const userCertPem = forge.pki.certificateToPem(userCert);

    // f. Mã hóa User Private Key bằng passphrase
    const salt = crypto.randomBytes(16).toString('hex');
    const userEncryptionKey = crypto.pbkdf2Sync(passphrase, salt, 10000, 32, 'sha256');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', userEncryptionKey, iv);
    let encryptedPrivateKey = cipher.update(privateKey, 'utf8', 'hex');
    encryptedPrivateKey += cipher.final('hex');
    const finalEncryptedPrivateKey = `${iv.toString('hex')}:${encryptedPrivateKey}`;

    // g. Lưu hoặc cập nhật DB
    const newCert = existingCert ? existingCert : new UserCertificate();
    newCert.tenantId = tenantId;
    newCert.userId = userId;
    newCert.certificatePem = userCertPem;
    newCert.encryptedPrivateKey = finalEncryptedPrivateKey;
    newCert.passphraseSalt = salt;
    newCert.serialNumber = userCert.serialNumber;
    newCert.subject = subject;
    newCert.validFrom = userCert.validity.notBefore;
    newCert.validTo = userCert.validity.notAfter;

    return this.userCertRepository.save(newCert);
  }

  // 3. Lấy chứng thư số hiện tại của user đang đăng nhập
  async getUserCertificate(userId: string, tenantId: string | null): Promise<UserCertificate> {
    const cert = await this.userCertRepository.findOne({
      where: { userId, tenantId: tenantId as any },
    });

    if (!cert) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'CERTIFICATE_NOT_FOUND',
          messageKey: 'ca.certificate_not_found',
        },
      });
    }

    return cert;
  }

  // ── Helpers mã hóa ──────────────────────────────────────────────────────────

  private encryptAes256(text: string, secret: string): string {
    const key = crypto.createHash('sha256').update(secret).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decryptAes256(encryptedData: string, secret: string): string {
    const [ivHex, encrypted] = encryptedData.split(':');
    const key = crypto.createHash('sha256').update(secret).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
