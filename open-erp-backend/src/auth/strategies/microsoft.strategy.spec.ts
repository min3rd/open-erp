import { MicrosoftStrategy } from './microsoft.strategy';

describe('MicrosoftStrategy', () => {
  let strategy: MicrosoftStrategy;

  beforeEach(() => {
    strategy = new MicrosoftStrategy();
    jest.restoreAllMocks();
  });

  describe('buildAuthUrl', () => {
    it('returns a Microsoft auth URL containing required params', () => {
      const url = strategy.buildAuthUrl(
        'ms-client-id',
        'https://app.example.com/callback',
        'state-xyz',
      );

      expect(url).toContain('login.microsoftonline.com/common/oauth2/v2.0/authorize');
      expect(url).toContain('client_id=ms-client-id');
      expect(url).toContain('state=state-xyz');
      expect(url).toContain('response_type=code');
      expect(url).toContain('response_mode=query');
    });
  });

  describe('exchangeCode', () => {
    it('returns the access_token on a successful response', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ access_token: 'ms-access-token' }),
      } as unknown as Response);

      const token = await strategy.exchangeCode(
        'auth-code',
        'client-id',
        'client-secret',
        'https://redirect.example.com',
      );

      expect(token).toBe('ms-access-token');
    });

    it('throws when response is not ok', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: 'invalid_code',
          error_description: 'The authorization code has expired',
        }),
      } as unknown as Response);

      await expect(
        strategy.exchangeCode('bad-code', 'client-id', 'secret', 'https://redirect'),
      ).rejects.toThrow('Microsoft token exchange failed');
    });

    it('throws when access_token is missing in response', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response);

      await expect(
        strategy.exchangeCode('code', 'client-id', 'secret', 'https://redirect'),
      ).rejects.toThrow('Microsoft token exchange failed');
    });
  });

  describe('getProfile', () => {
    it('returns a populated OAuthProfile using mail field', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'ms-uid-123',
          mail: 'User@Outlook.com',
          displayName: 'Jane Smith',
        }),
      } as unknown as Response);

      const profile = await strategy.getProfile('access-token');

      expect(profile.providerId).toBe('ms-uid-123');
      expect(profile.email).toBe('user@outlook.com'); // lowercase
      expect(profile.fullName).toBe('Jane Smith');
      expect(profile.emailVerified).toBe(true);
    });

    it('uses userPrincipalName when mail is absent', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'ms-uid-456',
          userPrincipalName: 'alex@company.onmicrosoft.com',
          displayName: 'Alex',
        }),
      } as unknown as Response);

      const profile = await strategy.getProfile('access-token');

      expect(profile.email).toBe('alex@company.onmicrosoft.com');
      expect(profile.fullName).toBe('Alex');
    });

    it('falls back to email as fullName when displayName is absent', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'ms-uid-789',
          mail: 'noname@outlook.com',
        }),
      } as unknown as Response);

      const profile = await strategy.getProfile('access-token');

      expect(profile.fullName).toBe('noname@outlook.com');
    });

    it('emailVerified is false when email is empty', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'ms-uid-000',
        }),
      } as unknown as Response);

      const profile = await strategy.getProfile('access-token');

      expect(profile.email).toBe('');
      expect(profile.emailVerified).toBe(false);
    });

    it('throws when response is not ok', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: { message: 'Unauthorized' } }),
      } as unknown as Response);

      await expect(strategy.getProfile('bad-token')).rejects.toThrow(
        'Microsoft profile fetch failed',
      );
    });

    it('throws when response contains an error object', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Token revoked' },
        }),
      } as unknown as Response);

      await expect(strategy.getProfile('revoked-token')).rejects.toThrow(
        'Microsoft profile fetch failed',
      );
    });
  });
});
