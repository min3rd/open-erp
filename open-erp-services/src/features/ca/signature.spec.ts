import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SignatureService } from '../../core/ca/signature.service';
import { SignatureController } from '../../core/ca/signature.controller';
import { SystemCa } from '../../core/ca/entities/system-ca.entity';
import { UserCertificate } from '../../core/ca/entities/user-certificate.entity';
import { User } from '../../core/user/user.entity';
import { WorkflowInstance } from '../../core/workflow/entities/workflow-instance.entity';
import { WorkflowApprover } from '../../core/workflow/entities/workflow-approver.entity';
import { WorkflowLog } from '../../core/workflow/entities/workflow-log.entity';
import { WorkflowInstanceService } from '../../core/workflow/workflow-instance.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as forge from 'node-forge';
import * as crypto from 'crypto';

describe('Signature Module', () => {
  let service: SignatureService;
  let controller: SignatureController;
  let systemCaRepoMock: any;
  let userCertRepoMock: any;
  let userRepoMock: any;
  let instanceRepoMock: any;
  let approverRepoMock: any;
  let logRepositoryMock: any;
  let workflowInstanceServiceMock: any;
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
    instanceRepoMock = createMockRepo();
    approverRepoMock = createMockRepo();
    logRepositoryMock = createMockRepo();

    jwtServiceMock = {
      verifyAsync: jest.fn(),
    };

    configServiceMock = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'CA_MASTER_KEY') return 'test-ca-master-key-1234567890123456';
        return defaultValue;
      }),
    };

    workflowInstanceServiceMock = {
      executeAction: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignatureController],
      providers: [
        SignatureService,
        { provide: getRepositoryToken(SystemCa), useValue: systemCaRepoMock },
        { provide: getRepositoryToken(UserCertificate), useValue: userCertRepoMock },
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        { provide: getRepositoryToken(WorkflowInstance), useValue: instanceRepoMock },
        { provide: getRepositoryToken(WorkflowApprover), useValue: approverRepoMock },
        { provide: getRepositoryToken(WorkflowLog), useValue: logRepositoryMock },
        { provide: WorkflowInstanceService, useValue: workflowInstanceServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<SignatureService>(SignatureService);
    controller = module.get<SignatureController>(SignatureController);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  describe('signInstance & verifyInstance', () => {
    it('should sign instance and then verify it successfully', async () => {
      // 1. Prepare Root CA keys and cert
      const rootKeys = forge.pki.rsa.generateKeyPair(2048);
      const rootCert = forge.pki.createCertificate();
      rootCert.publicKey = rootKeys.publicKey;
      rootCert.serialNumber = '01';
      rootCert.validity.notBefore = new Date();
      rootCert.validity.notAfter = new Date();
      rootCert.validity.notAfter.setFullYear(rootCert.validity.notBefore.getFullYear() + 10);
      const rootAttrs = [{ name: 'commonName', value: 'OpenERP Root CA' }];
      rootCert.setSubject(rootAttrs);
      rootCert.setIssuer(rootAttrs);
      rootCert.sign(rootKeys.privateKey, forge.md.sha256.create());
      const rootCertPem = forge.pki.certificateToPem(rootCert);

      // Encrypt Root CA private key
      const rootPrivateKeyPem = forge.pki.privateKeyToPem(rootKeys.privateKey);
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

      // 2. Prepare User certificate keys and cert
      const userKeys = forge.pki.rsa.generateKeyPair(2048);
      const userCert = forge.pki.createCertificate();
      userCert.publicKey = userKeys.publicKey;
      userCert.serialNumber = '02';
      userCert.validity.notBefore = new Date();
      userCert.validity.notAfter = new Date();
      userCert.validity.notAfter.setFullYear(userCert.validity.notBefore.getFullYear() + 1);
      const userAttrs = [
        { name: 'commonName', value: 'user@example.com' },
        { name: 'countryName', value: 'VN' },
        { name: 'organizationName', value: 'Gotech' },
      ];
      userCert.setSubject(userAttrs);
      userCert.setIssuer(rootCert.subject.attributes);
      userCert.sign(rootKeys.privateKey, forge.md.sha256.create());
      const userCertPem = forge.pki.certificateToPem(userCert);

      // Encrypt User private key using passphrase
      const passphrase = 'user-passphrase';
      const userPrivateKeyPem = forge.pki.privateKeyToPem(userKeys.privateKey);
      const salt = crypto.randomBytes(16).toString('hex');
      const userEncryptionKey = crypto.pbkdf2Sync(passphrase, salt, 10000, 32, 'sha256');
      const userIv = crypto.randomBytes(16);
      const userCipher = crypto.createCipheriv('aes-256-cbc', userEncryptionKey, userIv);
      let userEncrypted = userCipher.update(userPrivateKeyPem, 'utf8', 'hex');
      userEncrypted += userCipher.final('hex');
      const userEncryptedPrivateKey = `${userIv.toString('hex')}:${userEncrypted}`;

      const mockCert = {
        id: 'cert-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        certificatePem: userCertPem,
        encryptedPrivateKey: userEncryptedPrivateKey,
        passphraseSalt: salt,
        validTo: userCert.validity.notAfter,
      };

      userCertRepoMock.findOne.mockResolvedValue(mockCert);

      // 3. Mock Workflow entities
      const mockApprover = { id: 'app-1', userId: 'user-1', stepId: 'step-1', status: 'PENDING' };
      const mockInstance = { id: 'inst-1', contextData: { amount: 500 } };
      const mockUser = { id: 'user-1', email: 'user@example.com', firstName: 'John', lastName: 'Doe' };

      approverRepoMock.findOne.mockResolvedValue(mockApprover);
      instanceRepoMock.findOne.mockResolvedValue(mockInstance);
      userRepoMock.findOne.mockResolvedValue(mockUser);

      // 4. Test signInstance
      const signDto = {
        instanceId: 'inst-1',
        stepId: 'step-1',
        passphrase,
      };

      const expectedPayload = `inst-1:step-1:user-1:tenant-1:${JSON.stringify({ amount: 500 })}`;
      const expectedSign = crypto.createSign('SHA256');
      expectedSign.update(expectedPayload);
      const expectedSignatureBase64 = expectedSign.sign(userPrivateKeyPem, 'base64');

      const mockLog = {
        id: 'log-123',
        instanceId: 'inst-1',
        stepId: 'step-1',
        actorId: 'user-1',
        action: 'APPROVE',
        tenantId: 'tenant-1',
        timestamp: new Date(),
        payload: {
          signature: expectedSignatureBase64,
          certificatePem: userCertPem,
          contextData: { amount: 500 },
        },
      };

      logRepositoryMock.findOne.mockResolvedValue(mockLog);

      const signResult = await service.signInstance('user-1', 'tenant-1', signDto);

      expect(signResult).toBeDefined();
      expect(signResult.signature).toBe(expectedSignatureBase64);
      expect(workflowInstanceServiceMock.executeAction).toHaveBeenCalledWith(
        'tenant-1',
        'inst-1',
        'user-1',
        expect.objectContaining({
          stepId: 'step-1',
          action: 'APPROVE',
          signature: expectedSignatureBase64,
          certificatePem: userCertPem,
        }),
      );

      // 5. Test verifyInstance with the signed log
      logRepositoryMock.find.mockResolvedValue([mockLog]);

      const verifyResult = await service.verifyInstance('inst-1');
      expect(verifyResult.isValid).toBe(true);
      expect(verifyResult.signedBy).toBe('user@example.com');
      expect(verifyResult.commonName).toBe('John Doe');
      expect(verifyResult.verificationDetails.certificateChainValid).toBe(true);
      expect(verifyResult.verificationDetails.contentIntact).toBe(true);
      expect(verifyResult.verificationDetails.certExpired).toBe(false);
    }, 30000);

    it('should verify as invalid if content has been tampered with', async () => {
      // Setup similar mock logs but with tampered contextData
      const rootKeys = forge.pki.rsa.generateKeyPair(2048);
      const rootCert = forge.pki.createCertificate();
      rootCert.publicKey = rootKeys.publicKey;
      rootCert.serialNumber = '01';
      rootCert.validity.notBefore = new Date();
      rootCert.validity.notAfter = new Date();
      rootCert.validity.notAfter.setFullYear(rootCert.validity.notBefore.getFullYear() + 10);
      const rootAttrs = [{ name: 'commonName', value: 'OpenERP Root CA' }];
      rootCert.setSubject(rootAttrs);
      rootCert.setIssuer(rootAttrs);
      rootCert.sign(rootKeys.privateKey, forge.md.sha256.create());
      const rootCertPem = forge.pki.certificateToPem(rootCert);

      const userKeys = forge.pki.rsa.generateKeyPair(2048);
      const userCert = forge.pki.createCertificate();
      userCert.publicKey = userKeys.publicKey;
      userCert.serialNumber = '02';
      userCert.validity.notBefore = new Date();
      userCert.validity.notAfter = new Date();
      userCert.validity.notAfter.setFullYear(userCert.validity.notBefore.getFullYear() + 1);
      userCert.setSubject([{ name: 'commonName', value: 'hacker@example.com' }]);
      userCert.setIssuer(rootCert.subject.attributes);
      userCert.sign(rootKeys.privateKey, forge.md.sha256.create());
      const userCertPem = forge.pki.certificateToPem(userCert);

      const payload = `inst-1:step-1:user-1:tenant-1:${JSON.stringify({ amount: 500 })}`;
      const sign = crypto.createSign('SHA256');
      sign.update(payload);
      const signature = sign.sign(forge.pki.privateKeyToPem(userKeys.privateKey), 'base64');

      const tamperedLog = {
        id: 'log-222',
        instanceId: 'inst-1',
        stepId: 'step-1',
        actorId: 'user-1',
        action: 'APPROVE',
        tenantId: 'tenant-1',
        timestamp: new Date(),
        payload: {
          signature,
          certificatePem: userCertPem,
          contextData: { amount: 999999 }, // Tampered: 500 -> 999999!
        },
      };

      logRepositoryMock.find.mockResolvedValue([tamperedLog]);
      systemCaRepoMock.findOne.mockResolvedValue({ id: 'root', certificatePem: rootCertPem });

      const verifyResult = await service.verifyInstance('inst-1');
      expect(verifyResult.isValid).toBe(false);
      expect(verifyResult.verificationDetails.contentIntact).toBe(false); // Tampered content
    }, 30000);

    it('should throw BadRequestException on signInstance with invalid passphrase', async () => {
      // Mock User Cert
      const mockCert = {
        id: 'cert-1',
        encryptedPrivateKey: 'iv:encrypted',
        passphraseSalt: 'salt',
        validTo: new Date(Date.now() + 100000),
      };
      userCertRepoMock.findOne.mockResolvedValue(mockCert);
      approverRepoMock.findOne.mockResolvedValue({ status: 'PENDING' });
      instanceRepoMock.findOne.mockResolvedValue({ id: 'inst-1' });

      const signDto = {
        instanceId: 'inst-1',
        stepId: 'step-1',
        passphrase: 'wrong-passphrase',
      };

      await expect(service.signInstance('user-1', 'tenant-1', signDto)).rejects.toThrow(BadRequestException);
    });
  });
});
