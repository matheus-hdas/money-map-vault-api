export type BalanceHistoryRequest = {
  period: 'week' | 'month' | '3months' | '6months' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
};

export type CurrentBalanceResponse = {
  accountId: string;
  balance: number;
  lastCalculatedAt: Date;
  transactionCount: number;
};

export type BalanceHistoryResponse = {
  accountId: string;
  period: string;
  startDate: string;
  endDate: string;
  data: BalanceHistoryItem[];
};

export type BalanceHistoryItem = {
  date: string;
  balance: number;
  dailyIncome: number;
  dailyExpense: number;
  dailyChange: number;
  transactionCount: number;
};

export type BalanceEvolutionResponse = {
  accountId: string;
  period: string;
  data: BalanceEvolutionItem[];
};

export type BalanceEvolutionItem = {
  date: string;
  balance: number;
  change: number;
  changePercent: number;
};

export type BalanceSummaryResponse = {
  userId: string;
  totalBalance: number;
  accounts: AccountBalanceSummary[];
  lastUpdatedAt: Date;
};

export type AccountBalanceSummary = {
  accountId: string;
  accountName: string;
  accountType: string;
  balance: number;
  includeInTotals: boolean;
};

export type BalanceCalculationResult = {
  accountId: string;
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  finalBalance: number;
  transactionCount: number;
};

export type DailyTransactionSummary = {
  date: string;
  income: number;
  expense: number;
  transactionCount: number;
};
