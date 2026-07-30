import { Inject, Injectable } from '@nestjs/common';
import { RESEND_CLIENT } from './mail.provider';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class MailService {
  private fromEmail: string;
  constructor(
    @Inject(RESEND_CLIENT) private readonly resend: Resend,
    private readonly configService: ConfigService,
  ) {
    this.fromEmail =
      this.configService.get<string>('EMAIL_FROM') ?? 'nest-auth@app.com';
  }

  async sendEmail(options: SendEmailOptions) {
    return this.resend.emails.send({
      from: this.fromEmail,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }
}
