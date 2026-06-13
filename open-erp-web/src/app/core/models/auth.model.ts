export interface RegisterPayload {
  companyName: string;
  email: string;
  password?: string;
  subdomain: string;
  phone?: string;
}

export interface RegisterResponse {
  success: boolean;
  messageKey?: string;
  error?: {
    messageKey?: string;
  };
}
