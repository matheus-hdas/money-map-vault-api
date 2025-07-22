import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { Account } from '../database/entities/account.entity';
import { ResourceOwnerGuard } from '../../common/guards/resource-owner.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), AuthModule],
  controllers: [AccountController],
  providers: [AccountService, ResourceOwnerGuard],
  exports: [AccountService],
})
export class AccountModule {}
