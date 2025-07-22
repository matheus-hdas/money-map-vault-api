import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from '../database/entities/account.entity';
import {
  CreateAccountRequest,
  UpdateAccountRequest,
  AccountSummaryResponse,
} from './account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly repository: Repository<Account>,
  ) {}

  async findAll(userId: string, page: number, limit: number) {
    const [accounts, total] = await this.repository.findAndCount({
      where: { userId, isActive: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { accounts, total };
  }

  async findById(id: string, userId?: string): Promise<Account> {
    const whereCondition: any = { id, isActive: true };

    if (userId) {
      whereCondition.userId = userId;
    }

    const account = await this.repository.findOne({
      where: whereCondition,
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async create(
    userId: string,
    accountData: CreateAccountRequest,
  ): Promise<Account> {
    await this.validateUniqueAccountName(accountData.name, userId);

    const newAccount = this.repository.create({
      ...accountData,
      userId,
      balance: accountData.balance ?? accountData.initialBalance ?? 0,
      initialBalance: accountData.initialBalance ?? accountData.balance ?? 0,
      currency: accountData.currency ?? 'BRL',
      color: accountData.color ?? '#1976d2',
      includeInTotals: accountData.includeInTotals ?? true,
    });

    return await this.repository.save(newAccount);
  }

  async update(
    id: string,
    userId: string,
    accountData: UpdateAccountRequest,
  ): Promise<Account> {
    const existingAccount = await this.findById(id, userId);

    // Validar nome único se está sendo alterado
    if (accountData.name && accountData.name !== existingAccount.name) {
      await this.validateUniqueAccountName(accountData.name, userId);
    }

    const updatedAccount = await this.repository.save({
      ...existingAccount,
      ...accountData,
    });

    return updatedAccount;
  }

  async delete(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const account = await this.findById(id, userId);

    // Verificar se a conta tem transações
    const hasTransactions = await this.hasTransactions(id);

    if (hasTransactions) {
      // Soft delete - apenas desativa a conta
      await this.repository.save({
        ...account,
        isActive: false,
      });

      return {
        success: true,
        message:
          'Account deactivated successfully (has associated transactions)',
      };
    } else {
      // Hard delete - remove completamente se não tem transações
      await this.repository.delete(id);

      return {
        success: true,
        message: 'Account deleted successfully',
      };
    }
  }

  async getSummary(userId: string): Promise<AccountSummaryResponse> {
    const accounts = await this.repository.find({
      where: { userId, isActive: true },
    });

    const totalBalance = accounts
      .filter((account) => account.includeInTotals)
      .reduce((sum, account) => sum + Number(account.balance), 0);

    const accountsByType = accounts.reduce(
      (acc, account) => {
        acc[account.type] = (acc[account.type] || 0) + 1;
        return acc;
      },
      {} as { [key in AccountType]: number },
    );

    // Garantir que todos os tipos estejam presentes
    Object.values(AccountType).forEach((type) => {
      if (!accountsByType[type]) {
        accountsByType[type] = 0;
      }
    });

    return {
      totalAccounts: accounts.length,
      totalBalance,
      activeAccounts: accounts.filter((acc) => acc.isActive).length,
      accountsByType,
    };
  }

  async updateBalance(
    id: string,
    userId: string,
    newBalance: number,
  ): Promise<Account> {
    const account = await this.findById(id, userId);

    account.balance = newBalance;
    return await this.repository.save(account);
  }

  private async validateUniqueAccountName(
    name: string,
    userId: string,
  ): Promise<void> {
    if (!name) {
      throw new BadRequestException('Account name is required');
    }

    const existingAccount = await this.repository.findOne({
      where: { name, userId, isActive: true },
    });

    if (existingAccount) {
      throw new BadRequestException('Account name already exists');
    }
  }

  private async hasTransactions(accountId: string): Promise<boolean> {
    // Query direta para verificar se existem transações
    const transactionCount = await this.repository.query(
      `
      SELECT COUNT(*) as count
      FROM transactions
      WHERE from_account_id = $1 OR to_account_id = $1
    `,
      [accountId],
    );

    return parseInt(String(transactionCount[0]?.count || '0')) > 0;
  }
}
