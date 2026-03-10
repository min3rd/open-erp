import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { fetched, ok, updated } from '@shared/response';
import { AuthenticatedRequest } from '@shared/interfaces';
import {
  ChangePasswordDto,
  UpdateMeDto,
  UpdateSettingsDto,
  DeleteAccountDto,
  RevokeOtherSessionsDto,
  TwoFAEnableDto,
  TwoFADisableDto,
} from './dto/me.dto';

@ApiTags('me')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          nullable: true,
          example: 'User profile retrieved successfully',
        },
        error: { type: 'null' },
        data: {
          type: 'object',
          properties: {
            mode: { type: 'string', example: 'get' },
            item: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                email: { type: 'string', example: 'user@example.com' },
                username: { type: 'string', example: 'johndoe' },
                fullName: { type: 'string', example: 'John Doe' },
                avatarUrl: {
                  type: 'string',
                  nullable: true,
                  example: 'https://example.com/avatar.jpg',
                },
                status: { type: 'string', example: 'active' },
                verifiedAt: { type: 'string', format: 'date-time' },
                createdAt: { type: 'string', format: 'date-time' },
                roles: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        example: '507f1f77bcf86cd799439012',
                      },
                      code: { type: 'string', example: 'SYSTEM_ADMIN' },
                      name: { type: 'string', example: 'System Administrator' },
                      description: {
                        type: 'string',
                        example: 'Full system access',
                      },
                    },
                    required: ['id', 'code', 'name'],
                  },
                  description: 'Global roles assigned to the user',
                },
                permissions: {
                  type: 'array',
                  items: { type: 'string' },
                  example: [
                    'users.create',
                    'users.read',
                    'users.update',
                    'users.delete',
                  ],
                  description: 'Global permissions derived from roles',
                },
              },
            },
          },
        },
        meta: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User account is not active',
  })
  async getMe(@Request() req: AuthenticatedRequest) {
    const result = await this.authService.getMe(req.user.userId);
    return fetched(result, 'User profile retrieved successfully');
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async updateMe(
    @Request() req: AuthenticatedRequest,
    @Body() updateMeDto: UpdateMeDto,
  ) {
    const result = await this.authService.updateMe(
      req.user.userId,
      updateMeDto,
    );
    return updated(result, 'Profile updated successfully');
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const result = await this.authService.changePassword(
      req.user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return ok(result, 'Password changed successfully');
  }

  @Get('me/sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get active sessions for current user' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getSessions(@Request() req: AuthenticatedRequest) {
    const sessions = await this.authService.getSessions(req.user.userId);
    return ok(sessions, 'Sessions retrieved successfully');
  }

  @Delete('me/sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiParam({ name: 'sessionId', description: 'Session / refresh token ID' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async revokeSession(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
  ) {
    const result = await this.authService.revokeSession(
      req.user.userId,
      sessionId,
    );
    return ok(result, 'Session revoked successfully');
  }

  @Delete('me/sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all sessions except the current one' })
  @ApiResponse({
    status: 200,
    description: 'Other sessions revoked successfully',
  })
  async revokeOtherSessions(
    @Request() req: AuthenticatedRequest,
    @Body() dto: RevokeOtherSessionsDto,
  ) {
    const result = await this.authService.revokeOtherSessions(
      req.user.userId,
      dto.currentSessionId,
    );
    return ok(result, 'Other sessions revoked successfully');
  }

  @Get('me/settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user settings/preferences' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getSettings(@Request() req: AuthenticatedRequest) {
    const settings = await this.authService.getSettings(req.user.userId);
    return ok(settings, 'Settings retrieved successfully');
  }

  @Patch('me/settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user settings/preferences' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(
    @Request() req: AuthenticatedRequest,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    const result = await this.authService.updateSettings(
      req.user.userId,
      updateSettingsDto,
    );
    return ok(result, 'Settings updated successfully');
  }

  @Post('me/delete-account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate (soft-delete) the current user account',
  })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password' })
  async deleteAccount(
    @Request() req: AuthenticatedRequest,
    @Body() deleteAccountDto: DeleteAccountDto,
  ) {
    const result = await this.authService.deleteAccount(
      req.user.userId,
      deleteAccountDto.password,
    );
    return ok(result, 'Account deactivated successfully');
  }

  // ─── 2FA Endpoints ───────────────────────────────────────────────────────────

  @Get('me/2fa/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get 2FA status for current user' })
  @ApiResponse({
    status: 200,
    description: '2FA status retrieved successfully',
  })
  async get2FAStatus(@Request() req: AuthenticatedRequest) {
    const result = await this.authService.get2FAStatus(req.user.userId);
    return ok(result, '2FA status retrieved successfully');
  }

  @Post('me/2fa/prepare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Prepare 2FA setup — generate temp secret + QR code',
  })
  @ApiResponse({
    status: 200,
    description: 'Temp secret and QR code generated',
  })
  async prepare2FA(@Request() req: AuthenticatedRequest) {
    const result = await this.authService.prepare2FA(req.user.userId);
    return ok(result, 'Temp secret generated');
  }

  @Post('me/2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable 2FA after verifying OTP' })
  @ApiResponse({
    status: 200,
    description: '2FA enabled successfully, returns recovery codes',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async enable2FA(
    @Request() req: AuthenticatedRequest,
    @Body() dto: TwoFAEnableDto,
  ) {
    const result = await this.authService.enable2FA(req.user.userId, dto.otp);
    return ok(result, '2FA enabled successfully');
  }

  @Post('me/2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable 2FA after verifying OTP' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async disable2FA(
    @Request() req: AuthenticatedRequest,
    @Body() dto: TwoFADisableDto,
  ) {
    const result = await this.authService.disable2FA(req.user.userId, dto.otp);
    return ok(result, '2FA disabled successfully');
  }
}
