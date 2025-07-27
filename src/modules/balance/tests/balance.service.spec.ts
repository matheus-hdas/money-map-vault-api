/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BalanceService } from '../balance.service';
import { Account, AccountType } from '../../database/entities/account.entity';
import { Transaction } from '../../database/entities/transaction.entity';

const mockAccount = {
  id: 'account-1',
  name: 'Test Account',
  type: AccountType.CHECKING,
  initialBalance: 1000,
  balance: 1500,
  userId: 'user-1',
  includeInTotals: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('BalanceService', () => {
  let service: BalanceService;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let transactionRepository: jest.Mocked<Repository<Transaction>>;

  const createMockQueryBuilder = (
    rawResult: unknown,
  ): jest.Mocked<SelectQueryBuilder<Transaction>> =>
    ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(rawResult),
      getRawMany: jest.fn().mockResolvedValue([]),
    }) as unknown as jest.Mocked<SelectQueryBuilder<Transaction>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: getRepositoryToken(Account),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BalanceService>(BalanceService);
    accountRepository = module.get(getRepositoryToken(Account));
    transactionRepository = module.get(getRepositoryToken(Transaction));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCurrentBalance', () => {
    it('should calculate balance correctly with income and expense', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount as Account);

      const mockQueryBuilder = createMockQueryBuilder({
        income: '500',
        expense: '200',
        count: '2',
      });

      transactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.calculateCurrentBalance('account-1');

      expect(result).toEqual({
        accountId: 'account-1',
        initialBalance: 1000,
        totalIncome: 500,
        totalExpense: 200,
        finalBalance: 1300,
        transactionCount: 2,
      });
    });

    it('should handle account with only income', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount as Account);

      const mockQueryBuilder = createMockQueryBuilder({
        income: '1000',
        expense: '0',
        count: '1',
      });

      transactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.calculateCurrentBalance('account-1');

      expect(result.finalBalance).toBe(2000);
      expect(result.totalIncome).toBe(1000);
      expect(result.totalExpense).toBe(0);
    });

    it('should handle account with only expenses', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount as Account);

      const mockQueryBuilder = createMockQueryBuilder({
        income: '0',
        expense: '300',
        count: '1',
      });

      transactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.calculateCurrentBalance('account-1');

      expect(result.finalBalance).toBe(700);
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(300);
    });

    it('should handle account with no transactions', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount as Account);

      const mockQueryBuilder = createMockQueryBuilder({
        income: null,
        expense: null,
        count: '0',
      });

      transactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.calculateCurrentBalance('account-1');

      expect(result.finalBalance).toBe(1000);
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.transactionCount).toBe(0);
    });

    it('should throw NotFoundException when account does not exist', async () => {
      accountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.calculateCurrentBalance('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle decimal values correctly', async () => {
      accountRepository.findOne.mockResolvedValue({
        ...mockAccount,
        initialBalance: 100.5,
      } as Account);

      const mockQueryBuilder = createMockQueryBuilder({
        income: '250.75',
        expense: '50.25',
        count: '2',
      });

      transactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.calculateCurrentBalance('account-1');

      expect(result.finalBalance).toBe(301);
    });
  });

  describe('syncAccountBalance', () => {
    it('should update account balance with calculated value', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount as Account);

      const mockQueryBuilder = createMockQueryBuilder({
        income: '500',
        expense: '200',
        count: '2',
      });

      transactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.syncAccountBalance('account-1');

      expect(accountRepository.update).toHaveBeenCalledWith('account-1', {
        balance: 1300,
      });
    });
  });

  describe('getCurrentBalanceResponse', () => {
    it('should return formatted current balance response', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount as Account);

      const mockQueryBuilder = createMockQueryBuilder({
        income: '500',
        expense: '200',
        count: '2',
      });

      transactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getCurrentBalanceResponse('account-1');

      expect(result).toEqual({
        accountId: 'account-1',
        balance: 1300,
        lastCalculatedAt: expect.any(Date),
        transactionCount: 2,
      });
    });
  });

  describe('getBalanceSummary', () => {
    it('should return summary for user with multiple accounts', async () => {
      const mockAccounts = [
        { ...mockAccount, id: 'account-1', includeInTotals: true },
        { ...mockAccount, id: 'account-2', includeInTotals: false },
      ];

      accountRepository.find.mockResolvedValue(mockAccounts as Account[]);

      accountRepository.findOne
        .mockResolvedValueOnce({ ...mockAccount, id: 'account-1' } as Account)
        .mockResolvedValueOnce({ ...mockAccount, id: 'account-2' } as Account);

      const mockQueryBuilder = createMockQueryBuilder({
        income: '500',
        expense: '200',
        count: '2',
      });

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({
          income: '500',
          expense: '200',
          count: '2',
        })
        .mockResolvedValueOnce({
          income: '100',
          expense: '50',
          count: '1',
        });

      transactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getBalanceSummary('user-1');

      expect(result.totalBalance).toBe(1300);
      expect(result.accounts).toHaveLength(2);
      expect(result.accounts[0].includeInTotals).toBe(true);
      expect(result.accounts[1].includeInTotals).toBe(false);
    });

    it('should handle user with no accounts', async () => {
      accountRepository.find.mockResolvedValue([]);

      const result = await service.getBalanceSummary('user-1');

      expect(result.totalBalance).toBe(0);
      expect(result.accounts).toHaveLength(0);
    });
  });

  describe('recalculateUserBalances', () => {
    it('should recalculate all user account balances', async () => {
      const mockAccounts = [
        { ...mockAccount, id: 'account-1' },
        { ...mockAccount, id: 'account-2' },
      ];

      accountRepository.find.mockResolvedValue(mockAccounts as Account[]);
      accountRepository.findOne.mockResolvedValue(mockAccount as Account);

      const mockQueryBuilder = createMockQueryBuilder({
        income: '100',
        expense: '50',
        count: '1',
      });

      transactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.recalculateUserBalances('user-1');

      expect(accountRepository.update).toHaveBeenCalledTimes(2);
      expect(accountRepository.update).toHaveBeenCalledWith('account-1', {
        balance: 1050,
      });
      expect(accountRepository.update).toHaveBeenCalledWith('account-2', {
        balance: 1050,
      });
    });
  });

  describe('getBalanceHistory', () => {
    it('should return balance history for a month period', async () => {
      const mockRequest = {
        period: 'month' as const,
      };

      accountRepository.findOne.mockResolvedValue(mockAccount as Account);

      const mockQueryBuilder = createMockQueryBuilder({
        income: '0',
        expense: '0',
      });

      transactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getBalanceHistory('account-1', mockRequest);

      expect(result.accountId).toBe('account-1');
      expect(result.period).toBe('month');
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle custom date range', async () => {
      const mockRequest = {
        period: 'custom' as const,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      accountRepository.findOne.mockResolvedValue(mockAccount as Account);

      const mockQueryBuilder = createMockQueryBuilder({
        income: '0',
        expense: '0',
      });

      transactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getBalanceHistory('account-1', mockRequest);

      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-01-31');
    });
  });

  describe('getBalanceEvolution', () => {
    it('should return balance evolution for specified days', async () => {
      const mockHistoryData = {
        accountId: 'account-1',
        period: 'custom',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        data: [
          {
            date: '2024-01-01',
            balance: 1000,
            dailyIncome: 0,
            dailyExpense: 0,
            dailyChange: 0,
            transactionCount: 0,
          },
          {
            date: '2024-01-02',
            balance: 1100,
            dailyIncome: 100,
            dailyExpense: 0,
            dailyChange: 100,
            transactionCount: 1,
          },
        ],
      };

      const spy = jest.spyOn(service, 'getBalanceHistory');
      spy.mockResolvedValue(mockHistoryData);

      const result = await service.getBalanceEvolution('account-1', 7);

      expect(result.accountId).toBe('account-1');
      expect(result.period).toBe('7 days');
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('changePercent');

      spy.mockRestore();
    });
  });

  describe('integration tests', () => {
    it('should handle complete balance calculation flow', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount as Account);

      const mockQueryBuilder = createMockQueryBuilder({
        income: '500',
        expense: '200',
        count: '3',
      });

      transactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const balanceResult = await service.calculateCurrentBalance('account-1');
      expect(balanceResult.finalBalance).toBe(1300);

      await service.syncAccountBalance('account-1');
      expect(accountRepository.update).toHaveBeenCalledWith('account-1', {
        balance: 1300,
      });

      const responseResult =
        await service.getCurrentBalanceResponse('account-1');
      expect(responseResult.balance).toBe(1300);
      expect(responseResult.accountId).toBe('account-1');
    });
  });
});
