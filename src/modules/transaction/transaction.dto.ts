import {
  TransactionType,
  TransactionStatus,
} from '../database/entities/transaction.entity';
import { ApiMeta } from 'src/app.dto';
import { AccountResponse } from '../account/account.dto';
import { CategoryResponse } from '../category/category.dto';

export type CreateTransactionRequest = {
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  fromAccountId: string;
  toAccountId?: string;
  notes?: string;
  tags?: string[];
  location?: string;
  currency?: string;
  reference?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  recurringEndDate?: string;
};

export type UpdateTransactionRequest = {
  type?: TransactionType;
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  notes?: string;
  tags?: string[];
  location?: string;
  currency?: string;
  reference?: string;
  status?: TransactionStatus;
  isRecurring?: boolean;
  recurringPattern?: string;
  recurringEndDate?: string;
};

export type TransactionResponse = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string;
  date: Date;
  status: TransactionStatus;
  currency: string;
  reference?: string;
  attachments?: string[];
  tags?: string[];
  location?: string;
  isRecurring: boolean;
  recurringPattern?: string;
  recurringEndDate?: Date;
  recurringGroupId?: string;
  createdAt: Date;
  updatedAt: Date;
  category?: CategoryResponse;
  fromAccount?: AccountResponse;
  toAccount?: AccountResponse;
  userId: string;
};

export type TransactionListRequest = {
  type?: TransactionType;
  status?: TransactionStatus;
  categoryId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  description?: string;
  tags?: string[];
  isRecurring?: boolean;
  includeCategory?: boolean;
  includeAccounts?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'amount' | 'description' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
};

export type TransactionPagedResponse = {
  success: true;
  data: TransactionResponse[];
  meta: ApiMeta;
};

export type TransactionSummaryResponse = {
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;
  transactionsByType: {
    [key in TransactionType]: number;
  };
  transactionsByStatus: {
    [key in TransactionStatus]: number;
  };
};
