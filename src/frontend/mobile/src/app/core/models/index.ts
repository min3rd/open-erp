export interface VerifyEmailResult {
  status: string;
  personal_workspace?: {
    tenant_id: string;
    slug: string;
  };
}

export interface SlugAvailability {
  available: boolean;
}
