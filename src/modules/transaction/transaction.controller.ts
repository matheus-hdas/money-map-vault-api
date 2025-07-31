import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';

import { TransactionService } from './transaction.service';
import {
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionResponse,
  TransactionListRequest,
  TransactionPagedResponse,
  TransactionSummaryResponse,
} from './transaction.dto';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../../common/types/request.type';
import { Transaction } from '../database/entities/transaction.entity';

@Controller('api/v1/transactions')
@UseGuards(AuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createTransactionRequest: CreateTransactionRequest,
  ): Promise<TransactionResponse> {
    const userId = req.user.sub;
    const transaction = await this.transactionService.create(
      userId,
      createTransactionRequest,
    );
    return this.toResponse(transaction);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: TransactionListRequest,
  ): Promise<TransactionPagedResponse> {
    const userId = req.user.sub;
    const { transactions, total } = await this.transactionService.findAll(
      userId,
      query,
    );
    return this.toPagedResponse(
      transactions,
      total,
      query.page || 1,
      query.limit || 10,
    );
  }

  @Get('summary')
  async getSummary(
    @Req() req: AuthenticatedRequest,
  ): Promise<TransactionSummaryResponse> {
    const userId = req.user.sub;
    return this.transactionService.getSummary(userId);
  }

  @Get(':id')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<TransactionResponse> {
    const userId = req.user.sub;
    const transaction = await this.transactionService.findOne(userId, id);
    return this.toResponse(transaction);
  }

  @Put(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateTransactionRequest: UpdateTransactionRequest,
  ): Promise<TransactionResponse> {
    const userId = req.user.sub;
    const transaction = await this.transactionService.update(
      userId,
      id,
      updateTransactionRequest,
    );
    return this.toResponse(transaction);
  }

  @Delete(':id')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = req.user.sub;
    return this.transactionService.remove(userId, id);
  }

  private toResponse(transaction: Transaction): TransactionResponse {
    return {
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      description: transaction.description,
      notes: transaction.notes,
      date: transaction.date,
      status: transaction.status,
      currency: transaction.currency,
      reference: transaction.reference,
      attachments: transaction.attachments,
      tags: transaction.tags,
      location: transaction.location,
      isRecurring: transaction.isRecurring,
      recurringPattern: transaction.recurringPattern,
      recurringEndDate: transaction.recurringEndDate,
      recurringGroupId: transaction.recurringGroupId,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      userId: transaction.userId,
      category: transaction.category,
      fromAccount: transaction.fromAccount,
      toAccount: transaction.toAccount,
    };
  }

  private toPagedResponse(
    transactions: Transaction[],
    total: number,
    page: number,
    limit: number,
  ): TransactionPagedResponse {
    return {
      success: true,
      data: transactions.map((transaction) => this.toResponse(transaction)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }
}
