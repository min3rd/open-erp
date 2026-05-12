import { GoogleStrategy } from './google.strategy';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(() => {
    strategy = new GoogleStrategy();
    jest.restoreAllMocks();
  });

  describe('buildAuthUrl', () => {
    it('returns a Google auth URL containing required params', () => {
      const url = strategy.buildAuthUrl(
        'my-client-id',
        'https://app.example.com/callback',
        'state-abc',
      );

      expect(url).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=my-client-id');
      expect(url).toContain('state=state-abc');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=');
    });
  });

  describe('exchangeCode', () => {
    it('returns the access_token on a successful response', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ access_token: 'google-access-token' }),
      } as unknown as Response);

      const token = await strategy.exchangeCode(
        'auth-code',
        'client-id',
        'client-secret',
        'https://redirect.example.com',
      );

      expect(token).toBe('google-access-token');
    });

    it('throws when response is not ok', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'invalid_grant' }),
      } as unknown as Response);

      await expect(
        strategy.exchangeCode('bad-code', 'client-id', 'secret', 'https://redirect'),
      ).rejects.toThrow('Google token exchange failed');
    });

    it('throws when access_token is missing in response', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response);

      await expect(
        strategy.exchangeCode('code', 'client-id', 'secret', 'https://redirect'),
      ).rejects.toThrow('Google token exchange failed');
    });
  });

  describe('getProfile', () => {
    it('returns a populated OAuthProfile on success', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'google-uid-123',
          email: 'user@gmail.com',
          verified_email: true,
          name: 'John Doe',
          picture: 'https://lh3.googleusercontent.com/photo.jpg',
        }),
      } as unknown as Response);

      const profile = await strategy.getProfile('access-token');

      expect(profile.providerId).toBe('google-uid-123');
      expect(profile.email).toBe('user@gmail.com');
      expect(profile.emailVerified).toBe(true);
      expect(profile.fullName).toBe('John Doe');
      expect(profile.avatarUrl).toBe('https://lh3.googleusercontent.com/photo.jpg');
    });

    it('returns profile without avatarUrl when picture is absent', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'google-uid-456',
          email: 'nopic@gmail.com',
          verified_email: false,
          name: 'No Pic',
        }),
      } as unknown as Response);

      const profile = await strategy.getProfile('access-token');

      expect(profile.avatarUrl).toBeUndefined();
      expect(profile.emailVerified).toBe(false);
    });

    it('throws when response is not ok', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: { message: 'Token expired' } }),
      } as unknown as Response);

      await expect(strategy.getProfile('bad-token')).rejects.toThrow(
        'Google profile fetch failed',
      );
    });

    it('throws when response contains an error object', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Invalid credentials' },
        }),
      } as unknown as Response);

      await expect(strategy.getProfile('invalid-token')).rejects.toThrow(
        'Google profile fetch failed',
      );
    });
  });
});
