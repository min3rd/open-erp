import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CaService } from '../../core/ca/ca.service';
import { CaController } from '../../core/ca/ca.controller';
import { SystemCa } from '../../core/ca/entities/system-ca.entity';
import { UserCertificate } from '../../core/ca/entities/user-certificate.entity';
import { User } from '../../core/user/user.entity';
import { Tenant } from '../../core/tenant/tenant.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as forge from 'node-forge';
import * as crypto from 'crypto';

describe('CA Module', () => {
  let service: CaService;
  let controller: CaController;
  let systemCaRepoMock: any;
  let userCertRepoMock: any;
  let userRepoMock: any;
  let tenantRepoMock: any;
  let configServiceMock: any;
  let jwtServiceMock: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const createMockRepo = () => ({
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'gen-uuid-111', ...entity })),
    });

    systemCaRepoMock = createMockRepo();
    userCertRepoMock = createMockRepo();
    userRepoMock = createMockRepo();
    tenantRepoMock = createMockRepo();
    jwtServiceMock = {
      verifyAsync: jest.fn(),
    };

    configServiceMock = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'CA_MASTER_KEY') return 'test-ca-master-key-1234567890123456';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaController],
      providers: [
        CaService,
        { provide: getRepositoryToken(SystemCa), useValue: systemCaRepoMock },
        { provide: getRepositoryToken(UserCertificate), useValue: userCertRepoMock },
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        { provide: getRepositoryToken(Tenant), useValue: tenantRepoMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<CaService>(CaService);
    controller = module.get<CaController>(CaController);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize Root CA if not exists', async () => {
      systemCaRepoMock.findOne.mockResolvedValue(null);

      await service.onModuleInit();

      expect(systemCaRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 'root' } });
      expect(systemCaRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'root',
          certificatePem: expect.stringContaining('-----BEGIN CERTIFICATE-----'),
          encryptedPrivateKey: expect.any(String),
        }),
      );
    }, 30000);

    it('should not initialize Root CA if it already exists', async () => {
      systemCaRepoMock.findOne.mockResolvedValue({ id: 'root', certificatePem: 'PEM' });

      await service.onModuleInit();

      expect(systemCaRepoMock.save).not.toHaveBeenCalled();
    });
  });

  describe('issueCertificate', () => {
    it('should issue a certificate for user successfully', async () => {
      const mockUser = { id: 'user-1', email: 'user1@example.com' };
      const mockTenant = { id: 'tenant-1', name: 'Gotech Co' };
      
      // Root CA exists in DB
      const rootKeys = forge.pki.rsa.generateKeyPair(2048);
      const rootCert = forge.pki.createCertificate();
      rootCert.publicKey = rootKeys.publicKey;
      rootCert.serialNumber = '01';
      rootCert.validity.notBefore = new Date();
      rootCert.validity.notAfter = new Date();
      rootCert.validity.notAfter.setFullYear(rootCert.validity.notBefore.getFullYear() + 10);
      const attrs = [{ name: 'commonName', value: 'OpenERP Root CA' }];
      rootCert.setSubject(attrs);
      rootCert.setIssuer(attrs);
      rootCert.sign(rootKeys.privateKey, forge.md.sha256.create());
      const rootCertPem = forge.pki.certificateToPem(rootCert);
      
      // Encrypt Root Private Key
      // encryptAes256 logic simulator
      const rootPrivateKeyPem = forge.pki.privateKeyToPem(rootKeys.privateKey);
      const iv = '12345678901234567890123456789012'; // 16 bytes hex iv
      // We mock decryption of rootCa in CaService, so let's mock encryptAes256 result format iv:encrypted
      // Instead, we can let CaService encrypt it then decrypt it.
      // So we will trigger initializeRootCaIfNeeded to save root cert properly first, OR mock it.
      // Since encrypt/decrypt methods are private, we can mock systemCaRepoMock.findOne to return a valid encrypted data.
      // To get valid encrypted data, we can call the service's private methods OR encrypt it using the same algorithm.
      const key = crypto.createHash('sha256').update('test-ca-master-key-1234567890123456').digest();
      const ivBytes = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, ivBytes);
      let encrypted = cipher.update(rootPrivateKeyPem, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const rootEncryptedPrivateKey = `${ivBytes.toString('hex')}:${encrypted}`;

      systemCaRepoMock.findOne.mockResolvedValue({
        id: 'root',
        certificatePem: rootCertPem,
        encryptedPrivateKey: rootEncryptedPrivateKey,
      });

      userCertRepoMock.findOne.mockResolvedValue(null); // No existing cert
      userRepoMock.findOne.mockResolvedValue(mockUser);
      tenantRepoMock.findOne.mockResolvedValue(mockTenant);

      const passphrase = 'my-secret-passphrase';
      const result = await service.issueCertificate('user-1', 'tenant-1', passphrase);

      expect(result).toBeDefined();
      expect(result.certificatePem).toContain('-----BEGIN CERTIFICATE-----');
      expect(result.encryptedPrivateKey).toContain(':');
      expect(result.subject).toBe('CN=user1@example.com, O=Gotech Co, C=VN');
      expect(result.serialNumber).toBeDefined();

      // Verify user's certificate X.509 using forge
      const userCertObj = forge.pki.certificateFromPem(result.certificatePem);
      expect(userCertObj.subject.getField('CN').value).toBe('user1@example.com');
      expect(userCertObj.issuer.getField('CN').value).toBe('OpenERP Root CA');

      // Verify user private key can be decrypted with passphrase
      const [userIv, userEnc] = result.encryptedPrivateKey.split(':');
      const userKey = crypto.pbkdf2Sync(passphrase, result.passphraseSalt, 10000, 32, 'sha256');
      const userDec = crypto.createDecipheriv('aes-256-cbc', userKey, Buffer.from(userIv, 'hex'));
      let decryptedUserPrivateKey = userDec.update(userEnc, 'hex', 'utf8');
      decryptedUserPrivateKey += userDec.final('utf8');
      expect(decryptedUserPrivateKey).toContain('-----BEGIN PRIVATE KEY-----');
    }, 30000);

    it('should throw BadRequestException if user already has a valid certificate', async () => {
      userCertRepoMock.findOne.mockResolvedValue({
        id: 'cert-123',
        validTo: new Date(Date.now() + 100000), // still valid
      });

      await expect(service.issueCertificate('user-1', 'tenant-1', 'password')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      userCertRepoMock.findOne.mockResolvedValue(null);
      userRepoMock.findOne.mockResolvedValue(null);

      await expect(service.issueCertificate('user-invalid', 'tenant-1', 'password')).rejects.toThrow(NotFoundException);
    });
  });

  describe('CaController', () => {
    it('POST /ca/certificates/issue should return certificate details', async () => {
      const mockCert: any = {
        id: 'cert-uuid',
        subject: 'CN=test@example.com, O=Tenant, C=VN',
        validFrom: new Date(),
        validTo: new Date(),
        serialNumber: '12345',
      };
      jest.spyOn(service, 'issueCertificate').mockResolvedValue(mockCert);

      const req = { tenantId: 'tenant-1', user: { userId: 'user-1' } };
      const res = await controller.issueCertificate({ passphrase: 'password123' }, req);

      expect(res).toEqual({
        success: true,
        data: {
          certificateId: 'cert-uuid',
          subject: 'CN=test@example.com, O=Tenant, C=VN',
          validFrom: mockCert.validFrom,
          validTo: mockCert.validTo,
          serialNumber: '12345',
        },
      });
    });

    it('GET /ca/certificates/my should return PEM certificate', async () => {
      const mockCert: any = {
        certificatePem: 'PEM_DATA',
      };
      jest.spyOn(service, 'getUserCertificate').mockResolvedValue(mockCert);

      const req = { tenantId: 'tenant-1', user: { userId: 'user-1' } };
      const res = await controller.getMyCertificate(req);

      expect(res).toEqual({
        success: true,
        data: {
          certificatePem: 'PEM_DATA',
        },
      });
    });
  });
});
