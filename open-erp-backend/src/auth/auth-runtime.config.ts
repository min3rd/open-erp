import { ConfigService } from '@nestjs/config';

export const DEFAULT_JWT_SECRET = 'dev-secret-change-me';
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

export type JwtRuntimeConfig = {
  algorithm: 'HS256' | 'RS256';
  signKey: string;
  verifyKey: string;
  usedFallback: boolean;
  warning?: string;
};

export function resolveJwtRuntimeConfig(
  configService: ConfigService,
): JwtRuntimeConfig {
  const privateKey = normalizePemKey(
    configService.get<string>('JWT_PRIVATE_KEY'),
  );
  const publicKey = normalizePemKey(
    configService.get<string>('JWT_PUBLIC_KEY'),
  );
  const secret = configService.get<string>('JWT_SECRET') ?? DEFAULT_JWT_SECRET;

  if (privateKey && publicKey) {
    return {
      algorithm: 'RS256',
      signKey: privateKey,
      verifyKey: publicKey,
      usedFallback: false,
    };
  }

  return {
    algorithm: 'HS256',
    signKey: secret,
    verifyKey: secret,
    usedFallback: true,
    warning:
      privateKey || publicKey
        ? 'JWT RSA key configuration is incomplete. Falling back to HS256.'
        : 'JWT RSA keys are not configured. Falling back to HS256 for local/dev compatibility.',
  };
}

function normalizePemKey(value?: string): string | undefined {
  const normalized = value?.replace(/\\n/g, '\n').trim();
  return normalized ? normalized : undefined;
}
