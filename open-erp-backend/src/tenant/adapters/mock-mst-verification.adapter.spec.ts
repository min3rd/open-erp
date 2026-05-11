import { Test, TestingModule } from '@nestjs/testing';
import { MockMstVerificationAdapter } from './mock-mst-verification.adapter';

describe('MockMstVerificationAdapter', () => {
  let adapter: MockMstVerificationAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockMstVerificationAdapter],
    }).compile();

    adapter = module.get<MockMstVerificationAdapter>(MockMstVerificationAdapter);
  });

  describe('lookupByTaxCode', () => {
    it('should return tax info for valid tax code', async () => {
      const taxCode = '0123456789012';
      const result = await adapter.lookupByTaxCode(taxCode);

      expect(result).toBeDefined();
      expect(result?.companyName).toBe(`Cong ty MST ${taxCode}`);
      expect(result?.address).toBe('1 Nguyen Hue, Quan 1, TP.HCM');
      expect(result?.status).toBe('ACTIVE');
      expect(result?.registeredEmail).toBe(`tax-9012@example.vn`);
      expect(result?.registrationDate).toEqual(new Date('2020-01-01T00:00:00.000Z'));
    });

    it('should return null for invalid tax code format', async () => {
      const invalidTaxCode = 'invalid-code';
      const result = await adapter.lookupByTaxCode(invalidTaxCode);

      expect(result).toBeNull();
    });

    it('should return null for empty tax code', async () => {
      const result = await adapter.lookupByTaxCode('');

      expect(result).toBeNull();
    });

    it('should return null for tax code with letters', async () => {
      const result = await adapter.lookupByTaxCode('ABC123DEF456');

      expect(result).toBeNull();
    });

    it('should return null for tax code with special characters', async () => {
      const result = await adapter.lookupByTaxCode('0123-456-789-012');

      expect(result).toBeNull();
    });

    it('should generate correct registered email based on last 4 digits', async () => {
      const testCases = [
        { taxCode: '0000000000001', expectedSuffix: 'ax-0001' },
        { taxCode: '0000000000099', expectedSuffix: 'ax-0099' },
        { taxCode: '0123456789999', expectedSuffix: 'ax-9999' },
      ];

      for (const testCase of testCases) {
        const result = await adapter.lookupByTaxCode(testCase.taxCode);
        expect(result?.registeredEmail).toContain(testCase.expectedSuffix);
      }
    });
  });

  describe('verifyEmailMatch', () => {
    it('should return true when email matches', async () => {
      const taxCode = '0123456789012';
      const email = 'tax-9012@example.vn';

      const result = await adapter.verifyEmailMatch(taxCode, email);

      expect(result).toBe(true);
    });

    it('should return true when email has different casing', async () => {
      const taxCode = '0123456789012';
      const email = 'TAX-9012@EXAMPLE.VN';

      const result = await adapter.verifyEmailMatch(taxCode, email);

      expect(result).toBe(true);
    });

    it('should return true when email has leading/trailing spaces', async () => {
      const taxCode = '0123456789012';
      const email = '  tax-9012@example.vn  ';

      const result = await adapter.verifyEmailMatch(taxCode, email);

      expect(result).toBe(true);
    });

    it('should return false when email does not match', async () => {
      const taxCode = '0123456789012';
      const email = 'wrong-email@example.vn';

      const result = await adapter.verifyEmailMatch(taxCode, email);

      expect(result).toBe(false);
    });

    it('should return false for invalid tax code', async () => {
      const result = await adapter.verifyEmailMatch('invalid-code', 'any-email@example.vn');

      expect(result).toBe(false);
    });

    it('should return false for empty tax code', async () => {
      const result = await adapter.verifyEmailMatch('', 'any-email@example.vn');

      expect(result).toBe(false);
    });

    it('should return false for empty email', async () => {
      const taxCode = '0123456789012';
      const result = await adapter.verifyEmailMatch(taxCode, '');

      expect(result).toBe(false);
    });
  });
});
