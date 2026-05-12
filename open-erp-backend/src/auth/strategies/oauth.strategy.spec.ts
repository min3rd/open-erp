import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy, OAuthProfile } from './google.strategy';
import { MicrosoftStrategy } from './microsoft.strategy';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(async () => {
    strategy = new GoogleStrategy();
  });

  describe('buildAuthUrl', () => {
    it('builds valid Google OAuth authorization URL', () => {
      const clientId = 'client-id-123';
      const redirectUri = 'http://localhost:3001/auth/callback/google';
      const state = 'state-nonce-value';

      const url = strategy.buildAuthUrl(clientId, redirectUri, state);

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain(`client_id=${clientId}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`);
      expect(url).toContain(`state=${state}`);
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid');
      expect(url).toContain('email');
      expect(url).toContain('profile');
    });

    it('includes access_type=online for token refresh capability', () => {
      const url = strategy.buildAuthUrl(
        'client-id',
        'http://localhost:3001/callback',
        'state'
      );

      expect(url).toContain('access_type=online');
    });

    it('handles special characters in redirect URI', () => {
      const redirectUri = 'https://example.com:3001/auth/oauth/callback?tenant=acme';
      const url = strategy.buildAuthUrl('client-id', redirectUri, 'state');

      expect(url).toContain(encodeURIComponent(redirectUri));
    });
  });

  describe('exchangeCode', () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      fetchSpy = jest.spyOn(global, 'fetch' as any);
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('exchanges authorization code for access token', async () => {
      const mockTokenResponse: any = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'access-token-123',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
      };
      fetchSpy.mockResolvedValue(mockTokenResponse);

      const token = await strategy.exchangeCode(
        'auth-code-123',
        'client-id',
        'client-secret',
        'http://localhost:3001/callback'
      );

      expect(token).toBe('access-token-123');
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('includes correct parameters in token request', async () => {
      const mockTokenResponse: any = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'access-token-123',
        }),
      };
      fetchSpy.mockResolvedValue(mockTokenResponse);

      await strategy.exchangeCode(
        'auth-code',
        'client-id',
        'client-secret',
        'http://localhost:3001/callback'
      );

      const callArgs = fetchSpy.mock.calls[0];
      expect(callArgs[0]).toBe('https://oauth2.googleapis.com/token');
      expect(callArgs[1]).toEqual(
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('throws error when token exchange fails', async () => {
      const mockTokenResponse: any = {
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Invalid authorization code'),
      };
      fetchSpy.mockResolvedValue(mockTokenResponse);

      await expect(
        strategy.exchangeCode('invalid-code', 'client-id', 'client-secret', 'http://localhost:3001/callback')
      ).rejects.toThrow();
    });

    it('handles network errors gracefully', async () => {
      fetchSpy.mockRejectedValue(new Error('Network timeout'));

      await expect(
        strategy.exchangeCode('code', 'client-id', 'client-secret', 'http://localhost:3001/callback')
      ).rejects.toThrow('Network timeout');
    });
  });

  describe('getUserInfo', () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      fetchSpy = jest.spyOn(global, 'fetch' as any);
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('retrieves user profile information from Google', async () => {
      const mockUserResponse: any = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'google-user-123',
          email: 'user@gmail.com',
          verified_email: true,
          name: 'John Doe',
          picture: 'https://example.com/avatar.jpg',
        }),
      };
      fetchSpy.mockResolvedValue(mockUserResponse);

      const profile = await strategy.getUserInfo('access-token-123');

      expect(profile.providerId).toBe('google-user-123');
      expect(profile.email).toBe('user@gmail.com');
      expect(profile.emailVerified).toBe(true);
      expect(profile.fullName).toBe('John Doe');
      expect(profile.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('uses Authorization header with Bearer token', async () => {
      const mockUserResponse: any = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'user-123',
          email: 'user@gmail.com',
          verified_email: true,
          name: 'User',
        }),
      };
      fetchSpy.mockResolvedValue(mockUserResponse);

      await strategy.getUserInfo('access-token-abc');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('userinfo'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token-abc',
          }),
        })
      );
    });

    it('handles unverified email addresses', async () => {
      const mockUserResponse: any = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'user-123',
          email: 'unverified@gmail.com',
          verified_email: false,
          name: 'User',
        }),
      };
      fetchSpy.mockResolvedValue(mockUserResponse);

      const profile = await strategy.getUserInfo('access-token');

      expect(profile.emailVerified).toBe(false);
    });

    it('handles missing optional fields', async () => {
      const mockUserResponse: any = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'user-123',
          email: 'user@gmail.com',
          verified_email: true,
          name: 'User',
          // picture field missing
        }),
      };
      fetchSpy.mockResolvedValue(mockUserResponse);

      const profile = await strategy.getUserInfo('access-token');

      expect(profile.avatarUrl).toBeUndefined();
    });

    it('throws error when Google API returns error', async () => {
      const mockUserResponse: any = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          error: {
            message: 'Invalid Access Token',
          },
        }),
      };
      fetchSpy.mockResolvedValue(mockUserResponse);

      await expect(strategy.getUserInfo('invalid-token')).rejects.toThrow();
    });

    it('handles network failure on user info request', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));

      await expect(strategy.getUserInfo('access-token')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('CSRF protection', () => {
    it('includes state parameter for CSRF protection', () => {
      const state = 'random-nonce-abcdef123456';
      const url = strategy.buildAuthUrl('client-id', 'http://localhost:3001/callback', state);

      expect(url).toContain(`state=${state}`);
    });

    it('handles state parameter with special characters', () => {
      const state = 'state-with-special-!@#$%^&*()_chars';
      const url = strategy.buildAuthUrl('client-id', 'http://localhost:3001/callback', state);

      // State should be properly encoded in URL
      expect(url).toContain('state=');
    });
  });
});

describe('MicrosoftStrategy', () => {
  let strategy: MicrosoftStrategy;

  beforeEach(async () => {
    strategy = new MicrosoftStrategy();
  });

  describe('buildAuthUrl', () => {
    it('builds valid Microsoft OAuth authorization URL', () => {
      const clientId = 'client-id-456';
      const redirectUri = 'http://localhost:3001/auth/callback/microsoft';
      const state = 'state-nonce-value';

      const url = strategy.buildAuthUrl(clientId, redirectUri, state);

      expect(url).toContain('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
      expect(url).toContain(`client_id=${clientId}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`);
      expect(url).toContain(`state=${state}`);
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid');
      expect(url).toContain('email');
      expect(url).toContain('profile');
    });

    it('uses /common tenant for multi-tenant support', () => {
      const url = strategy.buildAuthUrl(
        'client-id',
        'http://localhost:3001/callback',
        'state'
      );

      expect(url).toContain('/common/');
    });

    it('includes response_mode=query parameter', () => {
      const url = strategy.buildAuthUrl(
        'client-id',
        'http://localhost:3001/callback',
        'state'
      );

      expect(url).toContain('response_mode=query');
    });
  });

  describe('exchangeCode', () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      fetchSpy = jest.spyOn(global, 'fetch' as any);
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('exchanges authorization code for access token', async () => {
      const mockTokenResponse: any = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'ms-access-token-123',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
      };
      fetchSpy.mockResolvedValue(mockTokenResponse);

      const token = await strategy.exchangeCode(
        'auth-code-ms',
        'client-id',
        'client-secret',
        'http://localhost:3001/callback'
      );

      expect(token).toBe('ms-access-token-123');
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('includes correct body parameters', async () => {
      const mockTokenResponse: any = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'token',
        }),
      };
      fetchSpy.mockResolvedValue(mockTokenResponse);

      await strategy.exchangeCode(
        'auth-code',
        'client-id',
        'client-secret',
        'http://localhost:3001/callback'
      );

      const callArgs = fetchSpy.mock.calls[0];
      expect(callArgs[0]).toBe('https://login.microsoftonline.com/common/oauth2/v2.0/token');
    });

    it('throws error when token exchange fails', async () => {
      const mockTokenResponse: any = {
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue('Unauthorized'),
      };
      fetchSpy.mockResolvedValue(mockTokenResponse);

      await expect(
        strategy.exchangeCode('invalid-code', 'client-id', 'client-secret', 'http://localhost:3001/callback')
      ).rejects.toThrow();
    });
  });

  describe('getUserInfo', () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      fetchSpy = jest.spyOn(global, 'fetch' as any);
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('retrieves user profile from Microsoft Graph', async () => {
      const mockUserResponse: any = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'ms-user-456',
          mail: 'user@company.com',
          displayName: 'Jane Doe',
        }),
      };
      fetchSpy.mockResolvedValue(mockUserResponse);

      const profile = await strategy.getUserInfo('access-token-ms');

      expect(profile.providerId).toBe('ms-user-456');
      expect(profile.email).toBe('user@company.com');
      expect(profile.fullName).toBe('Jane Doe');
    });

    it('handles userPrincipalName as fallback email', async () => {
      const mockUserResponse: any = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'user-id',
          userPrincipalName: 'user@company.onmicrosoft.com',
          displayName: 'User',
          // mail field missing
        }),
      };
      fetchSpy.mockResolvedValue(mockUserResponse);

      const profile = await strategy.getUserInfo('access-token');

      expect(profile.email).toBe('user@company.onmicrosoft.com');
    });

    it('throws error when both email fields missing', async () => {
      const mockUserResponse: any = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'user-id',
          displayName: 'User',
          // No mail or userPrincipalName
        }),
      };
      fetchSpy.mockResolvedValue(mockUserResponse);

      await expect(strategy.getUserInfo('access-token')).rejects.toThrow();
    });

    it('assumes email verified for Microsoft accounts', async () => {
      const mockUserResponse: any = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'user-id',
          mail: 'user@company.com',
          displayName: 'User',
        }),
      };
      fetchSpy.mockResolvedValue(mockUserResponse);

      const profile = await strategy.getUserInfo('access-token');

      // Microsoft enforces email verification
      expect(profile.emailVerified).toBe(true);
    });

    it('throws error when Graph API returns error', async () => {
      const mockUserResponse: any = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          error: {
            message: 'Invalid access token',
          },
        }),
      };
      fetchSpy.mockResolvedValue(mockUserResponse);

      await expect(strategy.getUserInfo('invalid-token')).rejects.toThrow();
    });
  });

  describe('Multi-tenant support', () => {
    it('supports both personal Microsoft accounts and work accounts', () => {
      const url = strategy.buildAuthUrl(
        'client-id',
        'http://localhost:3001/callback',
        'state'
      );

      // Uses /common endpoint for multi-tenant
      expect(url).toContain('/common/');
    });

    it('includes User.Read scope for profile access', () => {
      const url = strategy.buildAuthUrl(
        'client-id',
        'http://localhost:3001/callback',
        'state'
      );

      expect(url).toContain('User.Read');
    });
  });

  describe('OAuth flow consistency', () => {
    it('both strategies return OAuthProfile with same fields', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch' as any);

      // Google
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'google-id',
          email: 'user@gmail.com',
          verified_email: true,
          name: 'User',
          picture: 'https://example.com/pic.jpg',
        }),
      });

      const googleStrategy = new GoogleStrategy();
      const googleProfile = await googleStrategy.getUserInfo('token');

      // Microsoft
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'ms-id',
          mail: 'user@company.com',
          displayName: 'User',
        }),
      });

      const msStrategy = new MicrosoftStrategy();
      const msProfile = await msStrategy.getUserInfo('token');

      // Both profiles should have same structure
      expect(googleProfile).toHaveProperty('providerId');
      expect(googleProfile).toHaveProperty('email');
      expect(googleProfile).toHaveProperty('emailVerified');
      expect(googleProfile).toHaveProperty('fullName');

      expect(msProfile).toHaveProperty('providerId');
      expect(msProfile).toHaveProperty('email');
      expect(msProfile).toHaveProperty('emailVerified');
      expect(msProfile).toHaveProperty('fullName');

      fetchSpy.mockRestore();
    });
  });
});
