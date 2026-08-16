export interface UserProfile {
  userId: number;
  tenantId: string;
  username: string;
  email: string;
  departmentId?: number;
  roles: string[];
  permissions: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
  tenantId?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserProfile;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  tenantId?: string;
}
