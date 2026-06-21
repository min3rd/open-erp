import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
  constructor(
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
  ) {}

  async sendInviteEmail(
    email: string,
    firstName: string,
    lastName: string,
    activationLink: string,
    tenantName: string,
  ) {
    await this.emailQueue.add('send-invite', {
      email,
      firstName,
      lastName,
      activationLink,
      tenantName,
    });
  }

  async sendWorkflowNotificationEmail(
    email: string,
    firstName: string,
    lastName: string,
    wfName: string,
    link: string,
  ) {
    await this.emailQueue.add('send-workflow-notification', {
      email,
      firstName,
      lastName,
      wfName,
      link,
    });
  }
}
