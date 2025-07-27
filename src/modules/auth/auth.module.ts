import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { TokenModule } from '../../services/token/token.module';
import { PasswordModule } from '../../services/password/password.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { MailModule } from '../../services/mail/mail.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../database/entities/account.entity';
import { Category } from '../database/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Category]),
    UserModule,
    TokenModule,
    PasswordModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard, AuthService],
})
export class AuthModule {}
