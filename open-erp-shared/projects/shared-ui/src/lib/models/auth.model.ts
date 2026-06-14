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

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    tenant?: {
      id: string;
      name?: string;
      subdomain?: string;
    };
  };
  messageKey?: string;
  error?: {
    messageKey?: string;
  };
}
