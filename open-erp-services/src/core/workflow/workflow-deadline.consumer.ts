import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { WorkflowApprover, WorkflowApproverStatus } from './entities/workflow-approver.entity';
import { renderEmailTemplate } from '../mail/mail-template.helper';

@Processor('workflow-deadline-queue')
@Injectable()
export class WorkflowDeadlineConsumer extends WorkerHost implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(WorkflowApprover)
    private readonly approverRepository: Repository<WorkflowApprover>,
    @InjectQueue('workflow-deadline-queue')
    private readonly workflowDeadlineQueue: Queue,
  ) {
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

  async onModuleInit() {
    // Add repeatable job to scan for overdue approvals every hour
    await this.workflowDeadlineQueue.add(
      'scan-overdue-approvals',
      {},
      {
        repeat: {
          every: 3600000, // every hour
        },
        jobId: 'scan-overdue-approvals-job',
      },
    );
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'check-step-deadline') {
      const { approverId } = job.data;
      const approver = await this.approverRepository.findOne({
        where: { id: approverId },
        relations: {
          user: true,

          instance: {
            workflow: true
          }
        },
      });

      if (approver && (approver.status === WorkflowApproverStatus.PENDING || approver.status === WorkflowApproverStatus.CONSULTING)) {
        await this.sendReminderEmail(approver, false);
      }
    } else if (job.name === 'scan-overdue-approvals') {
      const overdueApprovers = await this.approverRepository.find({
        where: {
          status: WorkflowApproverStatus.PENDING,
          deadlineAt: LessThanOrEqual(new Date()),
        },
        relations: {
          user: true,

          instance: {
            workflow: true
          }
        },
      });

      // Also include CONSULTING status
      const consultingOverdue = await this.approverRepository.find({
        where: {
          status: WorkflowApproverStatus.CONSULTING,
          deadlineAt: LessThanOrEqual(new Date()),
        },
        relations: {
          user: true,

          instance: {
            workflow: true
          }
        },
      });

      const allOverdue = [...overdueApprovers, ...consultingOverdue];

      for (const approver of allOverdue) {
        await this.sendReminderEmail(approver, true);
      }
      console.log(`[BullMQ Worker] Completed scan-overdue-approvals. Processed ${allOverdue.length} overdue tasks.`);
    }
  }

  private async sendReminderEmail(approver: WorkflowApprover, isOverdue: boolean) {
    if (!approver.user || !approver.instance || !approver.instance.workflow) {
      return;
    }

    const locale = (approver.user as any).locale === 'en' ? 'en' : 'vi';
    const email = approver.user.email;
    const wfName = approver.instance.workflow.name;
    const deadlineStr = approver.deadlineAt ? approver.deadlineAt.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN') : 'N/A';
    const from = this.configService.get<string>('SMTP_FROM', 'OpenERP <noreply@open-erp.9ms.io.vn>');

    const templateName = isOverdue ? 'deadline-overdue' : 'deadline-urgent';
    const { subject, html } = renderEmailTemplate(templateName, locale, {
      firstName: approver.user.firstName || '',
      lastName: approver.user.lastName || '',
      wfName,
      deadlineStr,
    });

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject,
        html,
      });
      console.log(`[BullMQ Worker] Email reminder sent successfully to ${email}. Overdue: ${isOverdue}`);

      // In-app notification simulation logging
      console.log(
        `[In-App Notification] Created notification for user ${approver.userId}: ${subject}`,
      );
    } catch (e) {
      console.error(`[BullMQ Worker] Failed to send reminder email to ${email}`, e);
    }
  }
}
