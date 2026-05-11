export interface OAuthProfile {
  providerId: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  avatarUrl?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  error?: string;
}

interface GoogleUserInfoResponse {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  picture?: string;
  error?: { message: string };
}

/**
 * Google OAuth2 helper — plain class (no Passport), uses Node 24 global fetch.
 * Handles authorization URL construction and code exchange.
 */
export class GoogleStrategy {
  private static readonly AUTH_ENDPOINT =
    'https://accounts.google.com/o/oauth2/v2/auth';
  private static readonly TOKEN_ENDPOINT =
    'https://oauth2.googleapis.com/token';
  private static readonly USERINFO_ENDPOINT =
    'https://www.googleapis.com/oauth2/v2/userinfo';

  buildAuthUrl(
    clientId: string,
    redirectUri: string,
    state: string,
  ): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
    });
    return `${GoogleStrategy.AUTH_ENDPOINT}?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<string> {
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(GoogleStrategy.TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = (await response.json()) as GoogleTokenResponse;

    if (!response.ok || !data.access_token) {
      throw new Error(
        `Google token exchange failed: ${response.status} ${data.error ?? ''}`.trim(),
      );
    }

    return data.access_token;
  }

  async getProfile(accessToken: string): Promise<OAuthProfile> {
    const response = await fetch(GoogleStrategy.USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = (await response.json()) as GoogleUserInfoResponse;

    if (!response.ok || data.error) {
      throw new Error(
        `Google profile fetch failed: ${response.status} ${data.error?.message ?? ''}`.trim(),
      );
    }

    return {
      providerId: data.id,
      email: data.email,
      emailVerified: data.verified_email,
      fullName: data.name,
      avatarUrl: data.picture,
    };
  }
}
