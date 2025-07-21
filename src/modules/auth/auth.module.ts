import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { TokenModule } from '../../services/token/token.module';
import { PasswordModule } from 'src/services/password/password.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { MailModule } from 'src/services/mail/mail.module';

@Module({
  imports: [UserModule, TokenModule, PasswordModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
