export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  roles: string[];
  jti: string;
  iat: number;
  exp: number;
}
