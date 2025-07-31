import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { Transaction } from '../database/entities/transaction.entity';
import { AccountModule } from '../account/account.module';
import { CategoryModule } from '../category/category.module';
import { BalanceModule } from '../balance/balance.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    AuthModule,
    AccountModule,
    CategoryModule,
    BalanceModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
