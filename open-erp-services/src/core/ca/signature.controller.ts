import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { SignatureService } from './signature.service';
import { SignInstanceDto } from './dto/sign-instance.dto';
import { VerifyInstanceDto } from './dto/verify-instance.dto';

@Controller('signatures')
export class SignatureController {
  constructor(private readonly signatureService: SignatureService) {}

  @Post('sign-instance')
  @UseGuards(JwtAuthGuard)
  async signInstance(@Body() dto: SignInstanceDto, @Req() req: any) {
    const tenantId = req.tenantId;
    const userId = req.user.userId;
    const result = await this.signatureService.signInstance(userId, tenantId, dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('verify')
  async verifyInstance(@Body() dto: VerifyInstanceDto) {
    const result = await this.signatureService.verifyInstance(dto.instanceId);
    return {
      success: true,
      data: result,
    };
  }
}
