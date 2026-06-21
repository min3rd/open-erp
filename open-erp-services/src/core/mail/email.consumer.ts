import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

@Processor('email-queue')
@Injectable()
export class EmailConsumer extends WorkerHost {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    super();
    // Configure NodeMailer transporter
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.ethereal.email');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER', '');
    const pass = this.configService.get<string>('SMTP_PASS', '');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'send-invite') {
      const { email, firstName, lastName, activationLink, tenantName } = job.data;
      const from = this.configService.get<string>('SMTP_FROM', 'OpenERP <noreply@open-erp.9ms.io.vn>');

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #b78a62; text-align: center;">Chào mừng đến với ${tenantName}</h2>
          <p>Xin chào <strong>${firstName} ${lastName}</strong>,</p>
          <p>Bạn đã được mời tham gia vào hệ thống quản lý <strong>OpenERP</strong> của công ty <strong>${tenantName}</strong>.</p>
          <p>Vui lòng click vào nút bên dưới để thiết lập mật khẩu và kích hoạt tài khoản của bạn:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationLink}" style="background-color: #b78a62; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Kích hoạt tài khoản</a>
          </div>
          <p style="font-size: 12px; color: #718096; text-align: center; border-top: 1px solid #edf2f7; padding-top: 20px; margin-top: 30px;">
            Liên kết này sẽ hết hạn sau 24 giờ.<br>
            Nếu bạn không yêu cầu lời mời này, vui lòng bỏ qua email.<br>
            © OpenERP Platform. All rights reserved.
          </p>
        </div>
      `;

      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject: `[OpenERP] Lời mời tham gia ${tenantName}`,
          html,
        });
        console.log(`[BullMQ Worker] Invitation email sent successfully to ${email}`);
      } catch (e) {
        console.error(`[BullMQ Worker] Failed to send invitation email to ${email}`, e);
        throw e;
      }
    } else if (job.name === 'send-workflow-notification') {
      const { email, firstName, lastName, wfName, link } = job.data;
      const from = this.configService.get<string>('SMTP_FROM', 'OpenERP <noreply@open-erp.9ms.io.vn>');

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #b76e79; text-align: center;">Yêu Cầu Phê Duyệt Đơn Từ</h2>
          <p>Xin chào <strong>${firstName} ${lastName}</strong>,</p>
          <p>Bạn có một yêu cầu phê duyệt mới cho quy trình: <strong>${wfName}</strong>.</p>
          <p>Vui lòng click vào nút bên dưới để xem chi tiết và phê duyệt đơn:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #b76e79; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Xem đơn phê duyệt</a>
          </div>
          <p style="font-size: 12px; color: #718096; text-align: center; border-top: 1px solid #edf2f7; padding-top: 20px; margin-top: 30px;">
            © OpenERP Platform. All rights reserved.
          </p>
        </div>
      `;

      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject: `[OpenERP] Yêu cầu phê duyệt mới: ${wfName}`,
          html,
        });
        console.log(`[BullMQ Worker] Workflow notification email sent successfully to ${email}`);
      } catch (e) {
        console.error(`[BullMQ Worker] Failed to send workflow notification email to ${email}`, e);
        throw e;
      }
    }
  }
}
