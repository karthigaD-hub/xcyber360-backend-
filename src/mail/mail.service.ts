import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    const host = this.config.get('SMTP_HOST', '');
    const port = this.config.get('SMTP_PORT', '587');
    const user = this.config.get('SMTP_USER', '');
    const pass = this.config.get('SMTP_PASS', '');

    if (host && user) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: { user, pass },
      });
      this.logger.log('SMTP configured successfully');
    } else {
      this.logger.warn('SMTP not configured — emails will be logged to console only');
    }
  }

  async sendLoginCredentials(to: string, name: string, role: string, tempPassword: string) {
    const subject = `X-Cyber360 — Your ${role} Account Has Been Created`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0066cc;">Welcome to X-Cyber360</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your ${role} account has been created. Use the following credentials to login:</p>
        <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 4px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>
        <p style="color: #cc0000;"><strong>⚠️ Please change your password on first login.</strong></p>
        <p>Regards,<br/>X-Cyber360 Security Platform</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.config.get('SMTP_FROM', 'noreply@xcyber360.com'),
          to,
          subject,
          html,
        });
        this.logger.log(`Email sent to ${to}`);
      } catch (err: any) {
        this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      }
    } else {
      this.logger.log(`[EMAIL LOG] To: ${to} | Subject: ${subject} | Password: ${tempPassword}`);
    }
  }

  async sendAssessmentLink(to: string, customerName: string, assessmentName: string, linkUrl: string) {
    const subject = `X-Cyber360 — Cyber Security Assessment: ${assessmentName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0066cc;">Cyber Security Assessment</h2>
        <p>Hello <strong>${customerName}</strong>,</p>
        <p>You have been invited to complete a cyber security risk assessment.</p>
        <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Assessment:</strong> ${assessmentName}</p>
          <p style="margin: 4px 0;"><strong>Link:</strong> <a href="${linkUrl}">${linkUrl}</a></p>
        </div>
        <p>This link is unique to you. Do not share it with others.</p>
        <p>Regards,<br/>X-Cyber360 Security Platform</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.config.get('SMTP_FROM', 'noreply@xcyber360.com'),
          to,
          subject,
          html,
        });
        this.logger.log(`Assessment link email sent to ${to}`);
      } catch (err: any) {
        this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      }
    } else {
      this.logger.log(`[EMAIL LOG] To: ${to} | Subject: ${subject} | Link: ${linkUrl}`);
    }
  }
}
