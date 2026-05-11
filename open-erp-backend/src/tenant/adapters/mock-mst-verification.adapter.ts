import { Injectable } from '@nestjs/common';
import { MSTVerificationAdapter, TaxInfo } from './mst-verification.adapter';
import { TAX_CODE_REGEX } from '../tenant.constants';

@Injectable()
export class MockMstVerificationAdapter implements MSTVerificationAdapter {
  async lookupByTaxCode(taxCode: string): Promise<TaxInfo | null> {
    if (!TAX_CODE_REGEX.test(taxCode)) {
      return null;
    }

    return {
      companyName: `Cong ty MST ${taxCode}`,
      address: '1 Nguyen Hue, Quan 1, TP.HCM',
      status: 'ACTIVE',
      registeredEmail: `tax-${taxCode.slice(-4)}@example.vn`,
      registrationDate: new Date('2020-01-01T00:00:00.000Z'),
    };
  }

  async verifyEmailMatch(taxCode: string, email: string): Promise<boolean> {
    if (!TAX_CODE_REGEX.test(taxCode)) {
      return false;
    }

    const normalizedEmail = email.trim().toLowerCase();
    return normalizedEmail === `tax-${taxCode.slice(-4)}@example.vn`;
  }
}
