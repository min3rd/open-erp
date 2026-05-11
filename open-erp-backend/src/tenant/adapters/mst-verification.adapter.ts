export interface TaxInfo {
  companyName: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISSOLVED';
  registeredEmail: string | null;
  registrationDate: Date;
}

export interface MSTVerificationAdapter {
  lookupByTaxCode(taxCode: string): Promise<TaxInfo | null>;
  verifyEmailMatch(taxCode: string, email: string): Promise<boolean>;
}

export const MST_VERIFICATION_ADAPTER = Symbol('MST_VERIFICATION_ADAPTER');
