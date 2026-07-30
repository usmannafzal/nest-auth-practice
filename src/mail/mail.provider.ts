import { ConfigModule, ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export const RESEND_CLIENT = 'RESEND_CLIENT';

export const MailProvider = [
  {
    provide: RESEND_CLIENT,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      return new Resend(configService.get<string>('EMAIL_SERVICE_API_KEY'));
    },
  },
];
