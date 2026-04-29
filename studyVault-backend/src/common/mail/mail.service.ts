import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined || value === null || value.trim() === '') {
    return fallback;
  }

  return value.trim().toLowerCase() === 'true';
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendEmailVerificationEmail(
    recipientEmail: string,
    verificationUrl: string,
    expiresAt: Date,
  ) {
    const transporter = this.getTransporter();
    const from = this.getSmtpConfig().from;
    const safeVerificationUrl = escapeHtml(verificationUrl);
    const expiresAtLabel = expiresAt.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await transporter.sendMail({
      from,
      to: recipientEmail,
      subject: 'Verify your StudyVault email and set a password',
      text: [
        'Welcome to StudyVault.',
        '',
        `Open this link to verify your email and set a password: ${verificationUrl}`,
        '',
        `This link expires at ${expiresAtLabel}.`,
        'If you did not create a StudyVault account, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
          <h2 style="color:#9b3f36">Verify your StudyVault email</h2>
          <p>Welcome to StudyVault.</p>
          <p>
            <a href="${safeVerificationUrl}" style="display:inline-block;background:#9b3f36;color:#ffffff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700">
              Verify email and set password
            </a>
          </p>
          <p>Or copy this link into your browser:</p>
          <p style="word-break:break-all;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px">${safeVerificationUrl}</p>
          <p>This link expires at <strong>${escapeHtml(expiresAtLabel)}</strong>.</p>
          <p>If you did not create a StudyVault account, you can ignore this email.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(
    recipientEmail: string,
    resetUrl: string,
    expiresAt: Date,
  ) {
    const transporter = this.getTransporter();
    const from = this.getSmtpConfig().from;
    const safeResetUrl = escapeHtml(resetUrl);
    const expiresAtLabel = expiresAt.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await transporter.sendMail({
      from,
      to: recipientEmail,
      subject: 'Reset your StudyVault password',
      text: [
        'We received a request to reset your StudyVault password.',
        '',
        `Open this link to create a new password: ${resetUrl}`,
        '',
        `This link expires at ${expiresAtLabel}.`,
        'If you did not request a password reset, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
          <h2 style="color:#9b3f36">Reset your StudyVault password</h2>
          <p>We received a request to reset your StudyVault password.</p>
          <p>
            <a href="${safeResetUrl}" style="display:inline-block;background:#9b3f36;color:#ffffff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700">
              Create a new password
            </a>
          </p>
          <p>Or copy this link into your browser:</p>
          <p style="word-break:break-all;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px">${safeResetUrl}</p>
          <p>This link expires at <strong>${escapeHtml(expiresAtLabel)}</strong>.</p>
          <p>If you did not request a password reset, you can ignore this email.</p>
        </div>
      `,
    });
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const config = this.getSmtpConfig();
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    return this.transporter;
  }

  private getSmtpConfig(): SmtpConfig {
    const host = this.configService.get<string>('SMTP_HOST')?.trim() || '';
    const port = Number(this.configService.get<string>('SMTP_PORT') || '465');
    const secure = parseBoolean(
      this.configService.get<string>('SMTP_SECURE'),
      port === 465,
    );
    const user = this.configService.get<string>('SMTP_USER')?.trim() || '';
    const pass = this.configService.get<string>('SMTP_PASS') || '';
    const configuredFrom =
      this.configService.get<string>('MAIL_FROM')?.trim() || '';

    if (!host || !Number.isFinite(port) || !user || !pass) {
      this.logger.error('SMTP is not configured for password reset email.');
      throw new ServiceUnavailableException(
        'Password reset email service is not configured.',
      );
    }

    return {
      host,
      port,
      secure,
      user,
      pass,
      from: configuredFrom || `StudyVault <${user}>`,
    };
  }
}
