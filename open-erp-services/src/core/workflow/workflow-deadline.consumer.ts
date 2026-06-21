import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { WorkflowApprover } from './entities/workflow-approver.entity';

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
          cron: '0 * * * *', // every hour
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
        relations: ['user', 'instance', 'instance.workflow'],
      });

      if (approver && (approver.status === 'PENDING' || approver.status === 'CONSULTING')) {
        await this.sendReminderEmail(approver, false);
      }
    } else if (job.name === 'scan-overdue-approvals') {
      const overdueApprovers = await this.approverRepository.find({
        where: {
          status: 'PENDING', // or CONSULTING
          deadlineAt: LessThanOrEqual(new Date()),
        },
        relations: ['user', 'instance', 'instance.workflow'],
      });

      // Also include CONSULTING status
      const consultingOverdue = await this.approverRepository.find({
        where: {
          status: 'CONSULTING',
          deadlineAt: LessThanOrEqual(new Date()),
        },
        relations: ['user', 'instance', 'instance.workflow'],
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

    const email = approver.user.email;
    const wfName = approver.instance.workflow.name;
    const deadlineStr = approver.deadlineAt ? approver.deadlineAt.toLocaleString('vi-VN') : 'N/A';
    const from = this.configService.get<string>('SMTP_FROM', 'OpenERP <noreply@open-erp.9ms.io.vn>');

    const subject = isOverdue
      ? `Trễ hạn: [${wfName}] đã quá hạn phê duyệt từ ngày ${deadlineStr}`
      : `Khẩn: [${wfName}] cần phê duyệt gấp trước ngày ${deadlineStr}`;

    const textHeader = isOverdue
      ? `Đơn của bạn đã trễ hạn xử lý.`
      : `Đơn của bạn đang sắp hết hạn xử lý.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #b76e79; text-align: center;">${isOverdue ? 'Cảnh Báo Quá Hạn Phê Duyệt' : 'Đốc Thúc Phê Duyệt Đơn'}</h2>
        <p>Xin chào <strong>${approver.user.firstName || ''} ${approver.user.lastName || ''}</strong>,</p>
        <p>${textHeader}</p>
        <p><strong>Tên quy trình:</strong> ${wfName}</p>
        <p><strong>Thời hạn chót:</strong> ${deadlineStr}</p>
        <p>Vui lòng đăng nhập hệ thống để thực hiện phê duyệt kịp thời.</p>
        <p style="font-size: 12px; color: #718096; text-align: center; border-top: 1px solid #edf2f7; padding-top: 20px; margin-top: 30px;">
          © OpenERP Platform. All rights reserved.
        </p>
      </div>
    `;

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
