import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Ip,
  Logger,
  Param,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { RequestUser } from '../auth/interfaces/request-user.interface';
import { OAuthService } from './oauth.service';

@Controller({ path: 'auth', version: '1' })
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(private readonly oauthService: OAuthService) {}

  /**
   * Initiates OAuth2 login flow.
   * Redirects the browser to the provider's consent screen.
   *
   * GET /api/v1/auth/oauth/:provider?tenantId=<id>
   */
  @Public()
  @Get('oauth/:provider')
  async initiateOAuth(
    @Param('provider') provider: string,
    @Query('tenantId') tenantId: string,
    @Res() res: Response,
  ) {
    if (!tenantId) {
      throw new BadRequestException({
        code: 'MISSING_TENANT',
        message: 'tenantId is required',
      });
    }

    const authUrl = await this.oauthService.initiateLogin(provider, tenantId);
    return res.redirect(302, authUrl);
  }

  /**
   * OAuth2 callback — called by the provider after user consent.
   * Exchanges the code, finds/creates the user, issues JWT, and redirects to the frontend.
   *
   * GET /api/v1/auth/oauth/:provider/callback?code=...&state=...
   */
  @Public()
  @Get('oauth/:provider/callback')
  async handleOAuthCallback(
    @Param('provider') provider: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') errorParam: string | undefined,
    @Ip() ip: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const failureRedirect =
      this.getConfig('OAUTH_FAILURE_REDIRECT') ??
      '/auth/login?error=oauth_failed';

    if (errorParam || !code || !state) {
      this.logger.warn(
        `OAuth callback error for provider=${provider}: ${errorParam ?? 'missing code/state'}`,
      );
      return res.redirect(302, failureRedirect);
    }

    const userAgent = (req.headers['user-agent'] ?? 'unknown') as string;

    try {
      const tokens = await this.oauthService.handleCallback(
        provider,
        code,
        state,
        {
          ip,
          userAgent,
        },
      );

      const successRedirect =
        this.getConfig('OAUTH_SUCCESS_REDIRECT') ?? '/auth/oauth-callback';

      const params = new URLSearchParams({
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: String(tokens.expiresIn),
      });

      return res.redirect(302, `${successRedirect}?${params.toString()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'unknown';
      this.logger.error(`OAuth callback failed provider=${provider}: ${msg}`);
      return res.redirect(302, failureRedirect);
    }
  }

  /**
   * Initiates the OAuth2 account-link flow for an already-authenticated user.
   * Returns the provider auth URL — the frontend should redirect to it.
   *
   * GET /api/v1/auth/oauth/:provider/link-init
   */
  @Get('oauth/:provider/link-init')
  async initiateLinkFlow(
    @Param('provider') provider: string,
    @Req() req: Request,
  ) {
    const user = req.user as RequestUser | undefined;
    if (!user) throw new UnauthorizedException();

    const authUrl = await this.oauthService.initiateLinkFlow(
      user.sub,
      user.tenantId,
      provider,
    );
    return { success: true, data: { authUrl } };
  }

  /**
   * Unlinks an OAuth provider account from the current user.
   *
   * DELETE /api/v1/auth/oauth/:provider/unlink
   */
  @Delete('oauth/:provider/unlink')
  async unlinkOAuth(@Param('provider') provider: string, @Req() req: Request) {
    const user = req.user as RequestUser | undefined;
    if (!user) throw new UnauthorizedException();

    return this.oauthService.unlinkAccount(user.sub, user.tenantId, provider);
  }

  private getConfig(key: string): string | undefined {
    // Injected via the service's ConfigService. Controller accesses it via a
    // thin wrapper to keep test mocking straightforward.
    return process.env[key];
  }
}
