import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerifyEmail(to: string, username: string, verificationUrl: string) {
    return await this.sendMailWithTemplate(
      to,
      'Verificação de Email',
      'verify-email',
      {
        username,
        verificationUrl,
      },
    );
  }

  async sendWelcomeEmail(to: string, username: string) {
    return await this.sendMailWithTemplate(
      to,
      'Bem-vindo ao nosso sistema',
      'welcome',
      {
        username,
      },
    );
  }

  private async sendMailWithTemplate(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
  ) {
    return await this.mailerService.sendMail({
      to,
      subject,
      template,
      context,
    });
  }
}
