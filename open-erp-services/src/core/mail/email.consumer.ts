import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';
import { renderEmailTemplate } from './mail-template.helper';

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
    const locale = job.data.locale === 'en' ? 'en' : 'vi';
    const from = this.configService.get<string>('SMTP_FROM', 'OpenERP <noreply@open-erp.9ms.io.vn>');

    if (job.name === 'send-invite') {
      const { email, firstName, lastName, activationLink, tenantName } = job.data;
      const { subject, html } = renderEmailTemplate('invite', locale, {
        firstName: firstName || '',
        lastName: lastName || '',
        tenantName: tenantName || '',
        activationLink: activationLink || '',
      });

      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject,
          html,
        });
        console.log(`[BullMQ Worker] Invitation email sent successfully to ${email}`);
      } catch (e) {
        console.error(`[BullMQ Worker] Failed to send invitation email to ${email}`, e);
        throw e;
      }
    } else if (job.name === 'send-workflow-notification') {
      const { email, firstName, lastName, wfName, link } = job.data;
      const { subject, html } = renderEmailTemplate('workflow-notification', locale, {
        firstName: firstName || '',
        lastName: lastName || '',
        wfName: wfName || '',
        link: link || '',
      });

      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject,
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
