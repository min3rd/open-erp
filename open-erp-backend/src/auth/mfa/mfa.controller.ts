import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { SetupMfaDto } from './dto/setup-mfa.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';

@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('setup')
  async setupMfa(@Body() setupMfaDto: SetupMfaDto) {
    return this.mfaService.setupMfa(setupMfaDto);
  }

  @Post('verify')
  async verifyMfa(@Body() verifyMfaDto: VerifyMfaDto) {
    return this.mfaService.verifyMfa(verifyMfaDto);
  }
}