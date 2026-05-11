import type { OAuthProfile } from './google.strategy';

interface MicrosoftTokenResponse {
  access_token: string;
  error?: string;
  error_description?: string;
}

interface MicrosoftUserInfoResponse {
  id: string;
  mail?: string;
  userPrincipalName?: string;
  displayName?: string;
  error?: { message: string };
}

/**
 * Microsoft OAuth2 helper — plain class (no Passport), uses Node 24 global fetch.
 * Supports both personal Microsoft accounts and Azure AD work/school accounts
 * via the /common tenant endpoint.
 */
export class MicrosoftStrategy {
  private static readonly AUTH_ENDPOINT =
    'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
  private static readonly TOKEN_ENDPOINT =
    'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  private static readonly USERINFO_ENDPOINT =
    'https://graph.microsoft.com/v1.0/me';

  buildAuthUrl(
    clientId: string,
    redirectUri: string,
    state: string,
  ): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile User.Read',
      state,
      response_mode: 'query',
    });
    return `${MicrosoftStrategy.AUTH_ENDPOINT}?${params.toString()}`;
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
      scope: 'openid email profile User.Read',
    });

    const response = await fetch(MicrosoftStrategy.TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = (await response.json()) as MicrosoftTokenResponse;

    if (!response.ok || !data.access_token) {
      throw new Error(
        `Microsoft token exchange failed: ${response.status} ${data.error ?? ''} ${data.error_description ?? ''}`.trim(),
      );
    }

    return data.access_token;
  }

  async getProfile(accessToken: string): Promise<OAuthProfile> {
    const response = await fetch(MicrosoftStrategy.USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = (await response.json()) as MicrosoftUserInfoResponse;

    if (!response.ok || data.error) {
      throw new Error(
        `Microsoft profile fetch failed: ${response.status} ${data.error?.message ?? ''}`.trim(),
      );
    }

    const email = (data.mail ?? data.userPrincipalName ?? '').toLowerCase();

    return {
      providerId: data.id,
      email,
      // Microsoft accounts with verified email are always considered verified.
      emailVerified: email.length > 0,
      fullName: data.displayName ?? email,
    };
  }
}
