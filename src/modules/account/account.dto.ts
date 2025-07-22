import { AccountType } from '../database/entities/account.entity';
import { ApiMeta } from 'src/app.dto';

export type CreateAccountRequest = {
  name: string;
  type: AccountType;
  bank?: string;
  accountNumber?: string;
  balance?: number;
  initialBalance?: number;
  currency?: string;
  color?: string;
  icon?: string;
  description?: string;
  includeInTotals?: boolean;
};

export type UpdateAccountRequest = {
  name?: string;
  type?: AccountType;
  bank?: string;
  accountNumber?: string;
  color?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
  includeInTotals?: boolean;
};

export type AccountResponse = {
  id: string;
  name: string;
  type: AccountType;
  bank?: string;
  accountNumber?: string;
  balance: number;
  initialBalance: number;
  currency: string;
  color: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  includeInTotals: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AccountPagedResponse = {
  success: true;
  data: AccountResponse[];
  meta: ApiMeta;
};

export type AccountSummaryResponse = {
  totalAccounts: number;
  totalBalance: number;
  activeAccounts: number;
  accountsByType: {
    [key in AccountType]: number;
  };
};
