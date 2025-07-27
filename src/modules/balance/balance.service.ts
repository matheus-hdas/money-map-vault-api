import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../database/entities/account.entity';
import {
  Transaction,
  TransactionStatus,
} from '../database/entities/transaction.entity';
import {
  BalanceHistoryRequest,
  CurrentBalanceResponse,
  BalanceHistoryResponse,
  BalanceEvolutionResponse,
  BalanceSummaryResponse,
  BalanceCalculationResult,
  DailyTransactionSummary,
  BalanceHistoryItem,
  BalanceEvolutionItem,
  AccountBalanceSummary,
} from './balance.dto';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async calculateCurrentBalance(
    accountId: string,
    userId?: string,
  ): Promise<BalanceCalculationResult> {
    const whereCondition: any = { id: accountId };

    if (userId) {
      whereCondition.userId = userId;
      whereCondition.isActive = true;
    }

    const account = await this.accountRepository.findOne({
      where: whereCondition,
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const result = await this.transactionRepository
      .createQueryBuilder('t')
      .select([
        'COALESCE(SUM(CASE WHEN t.toAccountId = :accountId THEN t.amount ELSE 0 END), 0) as income',
        'COALESCE(SUM(CASE WHEN t.fromAccountId = :accountId THEN t.amount ELSE 0 END), 0) as expense',
        'COUNT(CASE WHEN t.toAccountId = :accountId OR t.fromAccountId = :accountId THEN 1 END) as count',
      ])
      .where('(t.fromAccountId = :accountId OR t.toAccountId = :accountId)')
      .andWhere('t.status = :status')
      .setParameters({
        accountId,
        status: TransactionStatus.COMPLETED,
      })
      .getRawOne();

    const totalIncome = Number(result.income) || 0;
    const totalExpense = Number(result.expense) || 0;
    const transactionCount = Number(result.count) || 0;
    const finalBalance =
      Number(account.initialBalance) + totalIncome - totalExpense;

    return {
      accountId,
      initialBalance: Number(account.initialBalance),
      totalIncome,
      totalExpense,
      finalBalance,
      transactionCount,
    };
  }

  async syncAccountBalance(accountId: string, userId: string): Promise<void> {
    const calculationResult = await this.calculateCurrentBalance(
      accountId,
      userId,
    );

    await this.accountRepository.update(accountId, {
      balance: calculationResult.finalBalance,
    });
  }

  async getBalanceHistory(
    accountId: string,
    request: BalanceHistoryRequest,
    userId: string,
  ): Promise<BalanceHistoryResponse> {
    // Verificar ownership primeiro
    const account = await this.accountRepository.findOne({
      where: { id: accountId, userId, isActive: true },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const { startDate, endDate } = this.convertPeriodToDates(
      request.period,
      request.startDate,
      request.endDate,
    );

    const dailySummaries = await this.getTransactionsSummaryByDate(
      accountId,
      startDate,
      endDate,
    );

    const initialBalance = await this.calculateBalanceAtDate(
      accountId,
      startDate,
    );

    const data: BalanceHistoryItem[] = [];
    let runningBalance = initialBalance;

    const currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    while (currentDate <= finalDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const daySummary = dailySummaries.find((s) => s.date === dateStr);

      const dailyIncome = daySummary?.income || 0;
      const dailyExpense = daySummary?.expense || 0;
      const dailyChange = dailyIncome - dailyExpense;
      const transactionCount = daySummary?.transactionCount || 0;

      runningBalance += dailyChange;

      data.push({
        date: dateStr,
        balance: runningBalance,
        dailyIncome,
        dailyExpense,
        dailyChange,
        transactionCount,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      accountId,
      period: request.period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      data,
    };
  }

  async getBalanceEvolution(
    accountId: string,
    days: number,
    userId: string,
  ): Promise<BalanceEvolutionResponse> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const historyRequest: BalanceHistoryRequest = {
      period: 'custom',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };

    const history = await this.getBalanceHistory(
      accountId,
      historyRequest,
      userId,
    );

    const evolutionData: BalanceEvolutionItem[] = history.data.map(
      (item, index) => {
        const previousBalance =
          index > 0
            ? history.data[index - 1].balance
            : item.balance - item.dailyChange;
        const change = item.balance - previousBalance;
        const changePercent =
          previousBalance !== 0
            ? (change / Math.abs(previousBalance)) * 100
            : 0;

        return {
          date: item.date,
          balance: item.balance,
          change,
          changePercent: Number(changePercent.toFixed(2)),
        };
      },
    );

    return {
      accountId,
      period: `${days} days`,
      data: evolutionData,
    };
  }

  async recalculateUserBalances(userId: string): Promise<void> {
    const accounts = await this.accountRepository.find({
      where: { userId, isActive: true },
    });

    for (const account of accounts) {
      await this.syncAccountBalance(account.id, userId);
    }
  }

  async getBalanceSummary(userId: string): Promise<BalanceSummaryResponse> {
    const accounts = await this.accountRepository.find({
      where: { userId, isActive: true },
    });

    const accountSummaries: AccountBalanceSummary[] = [];
    let totalBalance = 0;

    for (const account of accounts) {
      const calculationResult = await this.calculateCurrentBalance(
        account.id,
        userId,
      );

      const summary: AccountBalanceSummary = {
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        balance: calculationResult.finalBalance,
        includeInTotals: account.includeInTotals,
      };

      accountSummaries.push(summary);

      if (account.includeInTotals) {
        totalBalance += calculationResult.finalBalance;
      }
    }

    return {
      userId,
      totalBalance,
      accounts: accountSummaries,
      lastUpdatedAt: new Date(),
    };
  }

  async getCurrentBalanceResponse(
    accountId: string,
    userId: string,
  ): Promise<CurrentBalanceResponse> {
    const calculationResult = await this.calculateCurrentBalance(
      accountId,
      userId,
    );

    return {
      accountId: calculationResult.accountId,
      balance: calculationResult.finalBalance,
      lastCalculatedAt: new Date(),
      transactionCount: calculationResult.transactionCount,
    };
  }

  private async getTransactionsSummaryByDate(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyTransactionSummary[]> {
    const results = await this.transactionRepository
      .createQueryBuilder('t')
      .select([
        'DATE(t.date) as date',
        'COALESCE(SUM(CASE WHEN t.toAccountId = :accountId THEN t.amount ELSE 0 END), 0) as income',
        'COALESCE(SUM(CASE WHEN t.fromAccountId = :accountId THEN t.amount ELSE 0 END), 0) as expense',
        'COUNT(*) as transactionCount',
      ])
      .where('(t.fromAccountId = :accountId OR t.toAccountId = :accountId)')
      .andWhere('t.status = :status')
      .andWhere('t.date BETWEEN :startDate AND :endDate')
      .groupBy('DATE(t.date)')
      .orderBy('DATE(t.date)', 'ASC')
      .setParameters({
        accountId,
        status: TransactionStatus.COMPLETED,
        startDate,
        endDate,
      })
      .getRawMany();

    return results.map((result) => ({
      date: result.date,
      income: Number(result.income) || 0,
      expense: Number(result.expense) || 0,
      transactionCount: Number(result.transactionCount) || 0,
    }));
  }

  private async calculateBalanceAtDate(
    accountId: string,
    date: Date,
  ): Promise<number> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const result = await this.transactionRepository
      .createQueryBuilder('t')
      .select([
        'COALESCE(SUM(CASE WHEN t.toAccountId = :accountId THEN t.amount ELSE 0 END), 0) as income',
        'COALESCE(SUM(CASE WHEN t.fromAccountId = :accountId THEN t.amount ELSE 0 END), 0) as expense',
      ])
      .where('(t.fromAccountId = :accountId OR t.toAccountId = :accountId)')
      .andWhere('t.status = :status')
      .andWhere('t.date < :date')
      .setParameters({
        accountId,
        status: TransactionStatus.COMPLETED,
        date,
      })
      .getRawOne();

    const totalIncome = Number(result.income) || 0;
    const totalExpense = Number(result.expense) || 0;

    return Number(account.initialBalance) + totalIncome - totalExpense;
  }

  private convertPeriodToDates(
    period: string,
    customStartDate?: string,
    customEndDate?: string,
  ): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate = new Date();

    if (period === 'custom') {
      if (customStartDate) {
        startDate = new Date(customStartDate);
      }
      if (customEndDate) {
        endDate.setTime(new Date(customEndDate).getTime());
      }
    } else {
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }
    }

    return { startDate, endDate };
  }
}
