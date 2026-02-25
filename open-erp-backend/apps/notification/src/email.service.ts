import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private bypassEmail: boolean;

  constructor() {
    this.bypassEmail = process.env.VERIFICATION_EMAIL_BYPASS === 'true';

    if (!this.bypassEmail) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      this.logger.warn(
        'Email sending is BYPASSED - emails will be logged but not sent',
      );
    }
  }

  /**
   * Send verification email with code
   * @param to - Recipient email address
   * @param fullName - Recipient full name
   * @param verificationCode - 6-digit verification code
   */
  async sendVerificationEmail(
    to: string,
    fullName: string,
    verificationCode: string,
  ): Promise<void> {
    try {
      const { subject, body } = await this.loadVerificationEmailTemplate(
        fullName,
        verificationCode,
      );

      if (this.bypassEmail) {
        this.logger.log(`[BYPASS] Verification email for ${to}:`);
        this.logger.log(`Subject: ${subject}`);
        this.logger.log(`Code: ${verificationCode}`);
        return;
      }

      const info = await this.transporter.sendMail({
        from:
          process.env.AUTH_EMAIL_FROM || '"Open ERP" <noreply@open-erp.com>',
        to,
        subject,
        text: body,
        html: this.convertToHtml(body),
      });

      this.logger.log(
        `Verification email sent successfully to ${to}. Message ID: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${to}: ${error.message}`,
        error.stack,
      );
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset email with link
   * @param to - Recipient email address
   * @param fullName - Recipient full name
   * @param resetLink - Password reset link
   */
  async sendPasswordResetEmail(
    to: string,
    fullName: string,
    resetLink: string,
  ): Promise<void> {
    try {
      const { subject, body } = await this.loadPasswordResetTemplate(
        fullName,
        resetLink,
      );

      if (this.bypassEmail) {
        this.logger.log(`[BYPASS] Password reset email for ${to}:`);
        this.logger.log(`Subject: ${subject}`);
        this.logger.log(`Reset Link: ${resetLink}`);
        return;
      }

      const info = await this.transporter.sendMail({
        from:
          process.env.AUTH_EMAIL_FROM || '"Open ERP" <noreply@open-erp.com>',
        to,
        subject,
        text: body,
        html: this.convertToHtml(body),
      });

      this.logger.log(
        `Password reset email sent successfully to ${to}. Message ID: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${to}: ${error.message}`,
        error.stack,
      );
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send password changed notification email
   * @param to - Recipient email address
   * @param fullName - Recipient full name
   * @param timestamp - Timestamp when password was changed
   */
  async sendPasswordChangedEmail(
    to: string,
    fullName: string,
    timestamp: string,
  ): Promise<void> {
    try {
      const { subject, body } = await this.loadPasswordChangedTemplate(
        fullName,
        to,
        timestamp,
      );

      if (this.bypassEmail) {
        this.logger.log(`[BYPASS] Password changed email for ${to}:`);
        this.logger.log(`Subject: ${subject}`);
        return;
      }

      const info = await this.transporter.sendMail({
        from:
          process.env.AUTH_EMAIL_FROM || '"Open ERP" <noreply@open-erp.com>',
        to,
        subject,
        text: body,
        html: this.convertToHtml(body),
      });

      this.logger.log(
        `Password changed email sent successfully to ${to}. Message ID: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password changed email to ${to}: ${error.message}`,
        error.stack,
      );
      throw new Error('Failed to send password changed email');
    }
  }

  /**
   * Send organization invitation email
   * @param to - Recipient email address
   * @param fullName - Recipient full name (or email if unknown)
   * @param inviterName - Name of person sending invitation
   * @param orgName - Organization name
   * @param acceptLink - Invitation accept link with token
   * @param expiryDate - Expiry date string
   * @param message - Optional custom message from inviter
   */
  async sendInvitationEmail(
    to: string,
    fullName: string,
    inviterName: string,
    orgName: string,
    acceptLink: string,
    expiryDate: string,
    message?: string,
  ): Promise<void> {
    try {
      const { subject, body } = await this.loadInvitationEmailTemplate(
        fullName,
        inviterName,
        orgName,
        acceptLink,
        expiryDate,
        message,
      );

      if (this.bypassEmail) {
        this.logger.log(`[BYPASS] Invitation email for ${to}:`);
        this.logger.log(`Subject: ${subject}`);
        this.logger.log(`Accept Link: ${acceptLink}`);
        return;
      }

      const info = await this.transporter.sendMail({
        from:
          process.env.AUTH_EMAIL_FROM || '"Open ERP" <noreply@open-erp.com>',
        to,
        subject,
        text: body,
        html: this.convertToHtml(body),
      });

      this.logger.log(
        `Invitation email sent successfully to ${to}. Message ID: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send invitation email to ${to}: ${error.message}`,
        error.stack,
      );
      throw new Error('Failed to send invitation email');
    }
  }

  /**
   * Load invitation email template
   */
  private async loadInvitationEmailTemplate(
    fullName: string,
    inviterName: string,
    orgName: string,
    acceptLink: string,
    expiryDate: string,
    message?: string,
  ): Promise<{ subject: string; body: string }> {
    try {
      const templatePath = path.join(
        __dirname,
        '../../templates/INVITE_EMAIL.md',
      );
      const template = await fs.readFile(templatePath, 'utf-8');

      // Extract subject (first line starting with #)
      const lines = template.split('\n');
      const subjectLine = lines.find((line) => line.startsWith('#'));
      const subject = subjectLine
        ? subjectLine.replace(/^#+\s*/, '').trim()
        : `You're invited to join ${orgName} on Open ERP`;

      // Handle optional message block
      let processedTemplate = template;
      if (message) {
        processedTemplate = processedTemplate
          .replace(/\{\{#if message\}\}/g, '')
          .replace(/\{\{\/if\}\}/g, '')
          .replace(/\{\{message\}\}/g, message);
      } else {
        // Remove optional message block
        processedTemplate = processedTemplate.replace(
          /\{\{#if message\}\}[\s\S]*?\{\{\/if\}\}/g,
          '',
        );
      }

      const body = processedTemplate
        .replace(/\{\{fullName\}\}/g, fullName)
        .replace(/\{\{inviterName\}\}/g, inviterName)
        .replace(/\{\{orgName\}\}/g, orgName)
        .replace(/\{\{acceptLink\}\}/g, acceptLink)
        .replace(/\{\{expiryDate\}\}/g, expiryDate);

      return { subject, body };
    } catch (error) {
      this.logger.error(
        `Failed to load invitation email template: ${error.message}`,
      );
      // Fallback to default template
      const subject = `You're invited to join ${orgName} on Open ERP`;
      const body =
        `Hello ${fullName},\n\n` +
        `${inviterName} has invited you to join ${orgName} on Open ERP.\n\n` +
        (message ? `Message: ${message}\n\n` : '') +
        `Accept your invitation here: ${acceptLink}\n\n` +
        `This invitation expires on ${expiryDate}.\n\n` +
        `Best regards,\nOpen ERP Team`;
      return { subject, body };
    }
  }

  /**
   */
  private async loadVerificationEmailTemplate(
    fullName: string,
    verificationCode: string,
  ): Promise<{ subject: string; body: string }> {
    try {
      const templatePath = path.join(
        __dirname,
        '../../templates/VERIFY_EMAIL.md',
      );
      const template = await fs.readFile(templatePath, 'utf-8');

      // Extract subject (first line starting with #)
      const lines = template.split('\n');
      const subjectLine = lines.find((line) => line.startsWith('#'));
      const subject = subjectLine
        ? subjectLine.replace(/^#+\s*/, '').trim()
        : 'Email Verification';

      // Replace placeholders
      const body = template
        .replace(/{{fullName}}/g, fullName)
        .replace(/{{verificationCode}}/g, verificationCode)
        .replace(
          /{{expiryMinutes}}/g,
          process.env.VERIFICATION_TOKEN_TTL || '15',
        );

      return { subject, body };
    } catch (error) {
      this.logger.error(`Failed to load email template: ${error.message}`);
      // Fallback to default template
      return {
        subject: 'Email Verification',
        body: `Hello ${fullName},\n\nYour verification code is: ${verificationCode}\n\nThis code will expire in ${process.env.VERIFICATION_TOKEN_TTL || '15'} minutes.\n\nBest regards,\nOpen ERP Team`,
      };
    }
  }

  /**
   * Load password reset email template
   */
  private async loadPasswordResetTemplate(
    fullName: string,
    resetLink: string,
  ): Promise<{ subject: string; body: string }> {
    try {
      const templatePath = path.join(
        __dirname,
        '../../auth/templates/forgot-password.md',
      );
      const template = await fs.readFile(templatePath, 'utf-8');

      // Extract subject (first line starting with #)
      const lines = template.split('\n');
      const subjectLine = lines.find((line) => line.startsWith('#'));
      const subject = subjectLine
        ? subjectLine.replace(/^#+\s*/, '').trim()
        : 'Password Reset Request';

      // Replace placeholders
      const body = template
        .replace(/{{fullName}}/g, fullName)
        .replace(/{{resetLink}}/g, resetLink);

      return { subject, body };
    } catch (error) {
      this.logger.error(
        `Failed to load password reset template: ${error.message}`,
      );
      // Fallback to default template
      return {
        subject: 'Password Reset Request',
        body: `Hello ${fullName},\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link will expire in 15 minutes.\n\nBest regards,\nOpen ERP Team`,
      };
    }
  }

  /**
   * Load password changed email template
   */
  private async loadPasswordChangedTemplate(
    fullName: string,
    email: string,
    timestamp: string,
  ): Promise<{ subject: string; body: string }> {
    try {
      const templatePath = path.join(
        __dirname,
        '../../auth/templates/password-changed.md',
      );
      const template = await fs.readFile(templatePath, 'utf-8');

      // Extract subject (first line starting with #)
      const lines = template.split('\n');
      const subjectLine = lines.find((line) => line.startsWith('#'));
      const subject = subjectLine
        ? subjectLine.replace(/^#+\s*/, '').trim()
        : 'Password Changed Successfully';

      // Format timestamp
      const formattedTimestamp = new Date(timestamp).toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Replace placeholders
      const body = template
        .replace(/{{fullName}}/g, fullName)
        .replace(/{{email}}/g, email)
        .replace(/{{timestamp}}/g, formattedTimestamp);

      return { subject, body };
    } catch (error) {
      this.logger.error(
        `Failed to load password changed template: ${error.message}`,
      );
      // Fallback to default template
      return {
        subject: 'Password Changed Successfully',
        body: `Hello ${fullName},\n\nYour password has been changed successfully.\n\nIf you did not make this change, please contact support immediately.\n\nBest regards,\nOpen ERP Team`,
      };
    }
  }

  /**
   * Convert markdown-style text to basic HTML
   */
  private convertToHtml(text: string): string {
    const lines = text.split('\n');
    const htmlLines = lines.map((line) => {
      // Headers
      if (line.startsWith('## ')) {
        return `<h2>${line.substring(3)}</h2>`;
      } else if (line.startsWith('# ')) {
        return `<h1>${line.substring(2)}</h1>`;
      }

      // Bold and italic
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      line = line.replace(/\*(.+?)\*/g, '<em>$1</em>');

      // Empty lines become paragraph breaks
      if (line.trim() === '') {
        return '</p><p>';
      }

      return line + '<br>';
    });

    return '<p>' + htmlLines.join('\n') + '</p>';
  }
}
