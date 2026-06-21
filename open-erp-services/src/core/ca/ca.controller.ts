import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CaService } from './ca.service';
import { IssueCertificateDto } from './dto/issue-certificate.dto';

@Controller('ca/certificates')
@UseGuards(JwtAuthGuard)
export class CaController {
  constructor(private readonly caService: CaService) {}

  @Post('issue')
  async issueCertificate(@Body() dto: IssueCertificateDto, @Req() req: any) {
    const tenantId = req.tenantId;
    const userId = req.user.userId;
    const cert = await this.caService.issueCertificate(userId, tenantId, dto.passphrase);
    return {
      success: true,
      data: {
        certificateId: cert.id,
        subject: cert.subject,
        validFrom: cert.validFrom,
        validTo: cert.validTo,
        serialNumber: cert.serialNumber,
      },
    };
  }

  @Get('my')
  async getMyCertificate(@Req() req: any) {
    const tenantId = req.tenantId;
    const userId = req.user.userId;
    const cert = await this.caService.getUserCertificate(userId, tenantId);
    return {
      success: true,
      data: {
        certificatePem: cert.certificatePem,
      },
    };
  }
}
