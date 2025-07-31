import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../database/entities/transaction.entity';
import {
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionListRequest,
  TransactionSummaryResponse,
} from './transaction.dto';
import { AccountService } from '../account/account.service';
import { CategoryService } from '../category/category.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly accountService: AccountService,
    private readonly categoryService: CategoryService,
  ) {}

  async create(
    userId: string,
    request: CreateTransactionRequest,
  ): Promise<Transaction> {
    await this.validateCreateTransaction(userId, request);

    const transaction = this.transactionRepository.create({
      ...request,
      userId,
      date: new Date(request.date),
      recurringEndDate: request.recurringEndDate
        ? new Date(request.recurringEndDate)
        : undefined,
      status: TransactionStatus.COMPLETED,
      currency: request.currency || 'BRL',
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    await this.updateAccountBalances(savedTransaction);

    return this.findOne(userId, savedTransaction.id);
  }

  async findAll(userId: string, query: TransactionListRequest) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'DESC',
      includeCategory = false,
      includeAccounts = false,
      ...filters
    } = query;

    const skip = (page - 1) * limit;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .orderBy(`transaction.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    if (includeCategory) {
      queryBuilder.leftJoinAndSelect('transaction.category', 'category');
    }
    if (includeAccounts) {
      queryBuilder.leftJoinAndSelect('transaction.fromAccount', 'fromAccount');
      queryBuilder.leftJoinAndSelect('transaction.toAccount', 'toAccount');
    }

    this.applyFilters(queryBuilder, filters);

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return { transactions, total };
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, userId },
      relations: ['category', 'fromAccount', 'toAccount'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(
    userId: string,
    id: string,
    request: UpdateTransactionRequest,
  ): Promise<Transaction> {
    const existingTransaction = await this.transactionRepository.findOne({
      where: { id, userId },
    });

    if (!existingTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.validateUpdateTransaction(userId, request, existingTransaction);

    const oldFromAccountId = existingTransaction.fromAccountId;
    const oldToAccountId = existingTransaction.toAccountId;

    const updatedData = {
      ...request,
      date: request.date ? new Date(request.date) : existingTransaction.date,
      recurringEndDate: request.recurringEndDate
        ? new Date(request.recurringEndDate)
        : existingTransaction.recurringEndDate,
    };

    const updatedTransaction = await this.transactionRepository.save({
      ...existingTransaction,
      ...updatedData,
    });

    if (this.shouldRecalculateBalances(request)) {
      await this.revertAccountBalances(oldFromAccountId, oldToAccountId);
      await this.updateAccountBalances(updatedTransaction);
    }

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.revertAccountBalances(
      transaction.fromAccountId,
      transaction.toAccountId,
    );

    await this.transactionRepository.remove(transaction);
  }

  async getSummary(userId: string): Promise<TransactionSummaryResponse> {
    const transactions = await this.transactionRepository.find({
      where: { userId },
    });

    const summary: TransactionSummaryResponse = {
      totalTransactions: transactions.length,
      totalIncome: 0,
      totalExpenses: 0,
      totalTransfers: 0,
      transactionsByType: {
        [TransactionType.INCOME]: 0,
        [TransactionType.EXPENSE]: 0,
        [TransactionType.TRANSFER]: 0,
      },
      transactionsByStatus: {
        [TransactionStatus.PENDING]: 0,
        [TransactionStatus.COMPLETED]: 0,
        [TransactionStatus.CANCELLED]: 0,
      },
    };

    transactions.forEach((transaction) => {
      summary.transactionsByType[transaction.type]++;

      summary.transactionsByStatus[transaction.status]++;

      if (transaction.status === TransactionStatus.COMPLETED) {
        switch (transaction.type) {
          case TransactionType.INCOME:
            summary.totalIncome += Number(transaction.amount);
            break;
          case TransactionType.EXPENSE:
            summary.totalExpenses += Number(transaction.amount);
            break;
          case TransactionType.TRANSFER:
            summary.totalTransfers += Number(transaction.amount);
            break;
        }
      }
    });

    return summary;
  }

  private async validateCreateTransaction(
    userId: string,
    request: CreateTransactionRequest,
  ): Promise<void> {
    if (request.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    await this.validateAccountOwnership(userId, request.fromAccountId);

    if (request.toAccountId) {
      await this.validateAccountOwnership(userId, request.toAccountId);
    }

    if (request.categoryId) {
      await this.validateCategoryOwnership(userId, request.categoryId);
    }

    this.validateTransactionTypeRules(request);
  }

  private async validateUpdateTransaction(
    userId: string,
    request: UpdateTransactionRequest,
    existingTransaction: Transaction,
  ): Promise<void> {
    if (request.amount !== undefined && request.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    if (request.fromAccountId) {
      await this.validateAccountOwnership(userId, request.fromAccountId);
    }

    if (request.toAccountId) {
      await this.validateAccountOwnership(userId, request.toAccountId);
    }

    if (request.categoryId) {
      await this.validateCategoryOwnership(userId, request.categoryId);
    }

    const mergedTransaction: CreateTransactionRequest = {
      type: request.type || existingTransaction.type,
      amount: request.amount || existingTransaction.amount,
      description: request.description || existingTransaction.description,
      date:
        request.date || existingTransaction.date.toISOString().split('T')[0],
      categoryId: request.categoryId || existingTransaction.categoryId,
      fromAccountId: request.fromAccountId || existingTransaction.fromAccountId,
      toAccountId: request.toAccountId || existingTransaction.toAccountId,
      notes: request.notes || existingTransaction.notes,
      tags: request.tags || existingTransaction.tags,
      location: request.location || existingTransaction.location,
      currency: request.currency || existingTransaction.currency,
      reference: request.reference || existingTransaction.reference,
      isRecurring: request.isRecurring || existingTransaction.isRecurring,
      recurringPattern:
        request.recurringPattern || existingTransaction.recurringPattern,
      recurringEndDate:
        request.recurringEndDate ||
        (existingTransaction.recurringEndDate
          ? existingTransaction.recurringEndDate.toISOString().split('T')[0]
          : undefined),
    };

    this.validateTransactionTypeRules(mergedTransaction);
  }

  private validateTransactionTypeRules(
    request: CreateTransactionRequest,
  ): void {
    switch (request.type) {
      case TransactionType.TRANSFER:
        if (!request.toAccountId) {
          throw new BadRequestException(
            'Transfer transactions require toAccountId',
          );
        }
        if (request.fromAccountId === request.toAccountId) {
          throw new BadRequestException('Cannot transfer to the same account');
        }
        break;

      case TransactionType.INCOME:
      case TransactionType.EXPENSE:
        if (request.toAccountId) {
          throw new BadRequestException(
            'Income and expense transactions should not have toAccountId',
          );
        }
        break;
    }
  }

  private async validateAccountOwnership(
    userId: string,
    accountId: string,
  ): Promise<void> {
    try {
      await this.accountService.findById(accountId, userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException('Invalid account');
      }
      throw error;
    }
  }

  private async validateCategoryOwnership(
    userId: string,
    categoryId: string,
  ): Promise<void> {
    try {
      await this.categoryService.findOne(userId, categoryId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException('Invalid category');
      }
      throw error;
    }
  }

  private async updateAccountBalances(transaction: Transaction): Promise<void> {
    switch (transaction.type) {
      case TransactionType.INCOME:
        await this.accountService.updateBalanceFromCalculation(
          transaction.fromAccountId,
          transaction.userId,
        );
        break;

      case TransactionType.EXPENSE:
        await this.accountService.updateBalanceFromCalculation(
          transaction.fromAccountId,
          transaction.userId,
        );
        break;

      case TransactionType.TRANSFER:
        await this.accountService.updateBalanceFromCalculation(
          transaction.fromAccountId,
          transaction.userId,
        );
        if (transaction.toAccountId) {
          await this.accountService.updateBalanceFromCalculation(
            transaction.toAccountId,
            transaction.userId,
          );
        }
        break;
    }
  }

  private async revertAccountBalances(
    fromAccountId: string,
    toAccountId: string | null,
  ): Promise<void> {
    const transactions = await this.transactionRepository.find({
      where: [{ fromAccountId }, { toAccountId: fromAccountId }],
      take: 1,
    });

    if (transactions.length > 0) {
      const userId = transactions[0].userId;
      await this.accountService.updateBalanceFromCalculation(
        fromAccountId,
        userId,
      );

      if (toAccountId) {
        await this.accountService.updateBalanceFromCalculation(
          toAccountId,
          userId,
        );
      }
    }
  }

  private shouldRecalculateBalances(
    request: UpdateTransactionRequest,
  ): boolean {
    return !!(
      request.amount !== undefined ||
      request.type !== undefined ||
      request.fromAccountId !== undefined ||
      request.toAccountId !== undefined
    );
  }

  private applyFilters(
    queryBuilder: any,
    filters: Partial<TransactionListRequest>,
  ): void {
    if (filters.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: filters.type });
    }

    if (filters.status) {
      queryBuilder.andWhere('transaction.status = :status', {
        status: filters.status,
      });
    }

    if (filters.categoryId) {
      queryBuilder.andWhere('transaction.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters.fromAccountId) {
      queryBuilder.andWhere('transaction.fromAccountId = :fromAccountId', {
        fromAccountId: filters.fromAccountId,
      });
    }

    if (filters.toAccountId) {
      queryBuilder.andWhere('transaction.toAccountId = :toAccountId', {
        toAccountId: filters.toAccountId,
      });
    }

    if (filters.accountId) {
      queryBuilder.andWhere(
        '(transaction.fromAccountId = :accountId OR transaction.toAccountId = :accountId)',
        { accountId: filters.accountId },
      );
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('transaction.date >= :dateFrom', {
        dateFrom: new Date(filters.dateFrom),
      });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('transaction.date <= :dateTo', {
        dateTo: new Date(filters.dateTo),
      });
    }

    if (filters.amountMin !== undefined) {
      queryBuilder.andWhere('transaction.amount >= :amountMin', {
        amountMin: filters.amountMin,
      });
    }

    if (filters.amountMax !== undefined) {
      queryBuilder.andWhere('transaction.amount <= :amountMax', {
        amountMax: filters.amountMax,
      });
    }

    if (filters.description) {
      queryBuilder.andWhere('transaction.description ILIKE :description', {
        description: `%${filters.description}%`,
      });
    }

    if (filters.isRecurring !== undefined) {
      queryBuilder.andWhere('transaction.isRecurring = :isRecurring', {
        isRecurring: filters.isRecurring,
      });
    }
  }
}
