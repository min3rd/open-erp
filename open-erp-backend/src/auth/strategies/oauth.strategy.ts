import { Injectable } from '@nestjs/common';

export interface OAuthProfile {
  providerId: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  avatarUrl?: string;
}

@Injectable()
export class OAuthStrategy {
  buildAuthUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<string> {
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errText}`);
    }
    const data = await response.json();
    return data.access_token;
  }

  async getUserInfo(accessToken: string): Promise<OAuthProfile> {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'Error from Google API');
    }
    return {
      providerId: data.id || data.sub,
      email: data.email,
      emailVerified: data.verified_email ?? data.email_verified ?? false,
      fullName: data.name || 'Unknown',
      avatarUrl: data.picture || undefined,
    };
  }
}

@Injectable()
export class GoogleStrategy extends OAuthStrategy {}

@Injectable()
export class MicrosoftStrategy {
  buildAuthUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      response_type: 'code',
      scope: 'openid email profile User.Read',
      response_mode: 'query',
    });
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<string> {
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    const response = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      },
    );
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errText}`);
    }
    const data = await response.json();
    return data.access_token;
  }

  async getUserInfo(accessToken: string): Promise<OAuthProfile> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user info from Microsoft');
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'Error from Microsoft API');
    }
    const email = data.mail || data.userPrincipalName;
    if (!email) {
      throw new Error('Could not retrieve email from Microsoft account');
    }
    return {
      providerId: data.id,
      email,
      emailVerified: true,
      fullName: data.displayName || 'Unknown',
      avatarUrl: undefined,
    };
  }
}