import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionService } from '../transaction.service';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../../database/entities/transaction.entity';
import { Account, AccountType } from '../../database/entities/account.entity';
import { Category } from '../../database/entities/category.entity';
import { AccountService } from '../../account/account.service';
import { CategoryService } from '../../category/category.service';
import {
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionListRequest,
} from '../transaction.dto';

describe('TransactionService', () => {
  let service: TransactionService;

  const mockAccount: Account = {
    id: 'account-1',
    name: 'Conta Corrente',
    type: AccountType.CHECKING,
    bank: 'Banco do Brasil',
    accountNumber: '12345-6',
    balance: 1500.0,
    initialBalance: 1000.0,
    currency: 'BRL',
    color: '#1976d2',
    icon: 'credit_card',
    description: 'Conta principal',
    isActive: true,
    includeInTotals: true,
    userId: 'user-1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    user: undefined,
    transactionsFrom: [],
    transactionsTo: [],
  };

  const mockToAccount: Account = {
    ...mockAccount,
    id: 'account-2',
    name: 'Conta Poupança',
    type: AccountType.SAVINGS,
  };

  const mockCategory = {
    id: 'category-1',
    name: 'Alimentação',
  } as Category;

  const mockTransaction = {
    id: 'transaction-1',
    type: TransactionType.EXPENSE,
    amount: 50.0,
    description: 'Almoço',
    date: new Date('2023-01-15'),
    status: TransactionStatus.COMPLETED,
    userId: 'user-1',
    categoryId: 'category-1',
    fromAccountId: 'account-1',
    category: mockCategory,
    fromAccount: mockAccount,
  } as Transaction;

  const mockRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    })),
  };

  const mockAccountService = {
    findById: jest.fn(),
    updateBalanceFromCalculation: jest.fn(),
  };

  const mockCategoryService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockRepository,
        },
        {
          provide: AccountService,
          useValue: mockAccountService,
        },
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createRequest: CreateTransactionRequest = {
      type: TransactionType.EXPENSE,
      amount: 50.0,
      description: 'Almoço',
      date: '2023-01-15',
      categoryId: 'category-1',
      fromAccountId: 'account-1',
      notes: 'Restaurante do centro',
      tags: ['alimentação'],
      location: 'São Paulo',
      currency: 'BRL',
      reference: 'REF-001',
    };

    it('should create a transaction successfully', async () => {
      mockAccountService.findById.mockResolvedValue(mockAccount);
      mockCategoryService.findOne.mockResolvedValue(mockCategory);
      mockRepository.create.mockReturnValue(mockTransaction);
      mockRepository.save.mockResolvedValue(mockTransaction);
      mockRepository.findOne.mockResolvedValue(mockTransaction);
      mockAccountService.updateBalanceFromCalculation.mockResolvedValue(
        mockAccount,
      );

      const result = await service.create('user-1', createRequest);

      expect(mockAccountService.findById).toHaveBeenCalledWith(
        'account-1',
        'user-1',
      );
      expect(mockCategoryService.findOne).toHaveBeenCalledWith(
        'user-1',
        'category-1',
      );
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createRequest,
        userId: 'user-1',
        date: new Date('2023-01-15'),
        status: TransactionStatus.COMPLETED,
        currency: 'BRL',
        recurringEndDate: undefined,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockTransaction);
      expect(
        mockAccountService.updateBalanceFromCalculation,
      ).toHaveBeenCalledWith('account-1', 'user-1');
      expect(result).toEqual(mockTransaction);
    });

    it('should throw BadRequestException when amount is zero or negative', async () => {
      const invalidRequest = { ...createRequest, amount: 0 };

      await expect(service.create('user-1', invalidRequest)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when fromAccount does not belong to user', async () => {
      mockAccountService.findById.mockRejectedValue(new NotFoundException());

      await expect(service.create('user-1', createRequest)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when category does not belong to user', async () => {
      mockAccountService.findById.mockResolvedValue(mockAccount);
      mockCategoryService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.create('user-1', createRequest)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should create transfer transaction successfully', async () => {
      const transferRequest: CreateTransactionRequest = {
        ...createRequest,
        type: TransactionType.TRANSFER,
        toAccountId: 'account-2',
        categoryId: undefined,
      };

      const transferTransaction = {
        ...mockTransaction,
        type: TransactionType.TRANSFER,
        toAccountId: 'account-2',
        categoryId: null,
      };

      mockAccountService.findById
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(mockToAccount);
      mockRepository.create.mockReturnValue(transferTransaction);
      mockRepository.save.mockResolvedValue(transferTransaction);
      mockRepository.findOne.mockResolvedValue(transferTransaction);
      mockAccountService.updateBalanceFromCalculation.mockResolvedValue(
        mockAccount,
      );

      const result = await service.create('user-1', transferRequest);

      expect(mockAccountService.findById).toHaveBeenCalledTimes(2);
      expect(
        mockAccountService.updateBalanceFromCalculation,
      ).toHaveBeenCalledTimes(2);
      expect(result).toEqual(transferTransaction);
    });

    it('should throw BadRequestException for transfer to same account', async () => {
      const invalidTransferRequest: CreateTransactionRequest = {
        ...createRequest,
        type: TransactionType.TRANSFER,
        toAccountId: 'account-1',
      };

      mockAccountService.findById.mockResolvedValue(mockAccount);

      await expect(
        service.create('user-1', invalidTransferRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for income/expense with toAccountId', async () => {
      const invalidRequest: CreateTransactionRequest = {
        ...createRequest,
        type: TransactionType.INCOME,
        toAccountId: 'account-2',
      };

      mockAccountService.findById.mockResolvedValue(mockAccount);
      mockCategoryService.findOne.mockResolvedValue(mockCategory);

      await expect(service.create('user-1', invalidRequest)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    const query: TransactionListRequest = {
      page: 1,
      limit: 10,
      sortBy: 'date',
      sortOrder: 'DESC',
      includeCategory: true,
      includeAccounts: true,
    };

    it('should return paginated transactions', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTransaction], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('user-1', query);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'transaction',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'transaction.userId = :userId',
        { userId: 'user-1' },
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'transaction.category',
        'category',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'transaction.fromAccount',
        'fromAccount',
      );
      expect(result).toEqual({
        transactions: [mockTransaction],
        total: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should return transaction by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.findOne('user-1', 'transaction-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'transaction-1', userId: 'user-1' },
        relations: ['category', 'fromAccount', 'toAccount'],
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateRequest: UpdateTransactionRequest = {
      amount: 75.0,
      description: 'Jantar',
      notes: 'Restaurante italiano',
    };

    it('should update transaction successfully', async () => {
      const updatedTransaction = {
        ...mockTransaction,
        ...updateRequest,
      };

      mockRepository.findOne
        .mockResolvedValueOnce(mockTransaction)
        .mockResolvedValueOnce(updatedTransaction);
      mockRepository.save.mockResolvedValue(updatedTransaction);
      mockRepository.find.mockResolvedValue([mockTransaction]);
      mockAccountService.updateBalanceFromCalculation.mockResolvedValue(
        mockAccount,
      );

      const result = await service.update(
        'user-1',
        'transaction-1',
        updateRequest,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'transaction-1', userId: 'user-1' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockTransaction,
        ...updateRequest,
        date: mockTransaction.date,
        recurringEndDate: mockTransaction.recurringEndDate,
      });
      expect(result).toEqual(updatedTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'nonexistent-id', updateRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should recalculate balances when amount changes', async () => {
      const amountChangeRequest = { amount: 100.0 };
      const updatedTransaction = {
        ...mockTransaction,
        amount: 100.0,
      };

      mockRepository.findOne
        .mockResolvedValueOnce(mockTransaction)
        .mockResolvedValueOnce(updatedTransaction);
      mockRepository.save.mockResolvedValue(updatedTransaction);
      mockRepository.find.mockResolvedValue([mockTransaction]);
      mockAccountService.updateBalanceFromCalculation.mockResolvedValue(
        mockAccount,
      );

      await service.update('user-1', 'transaction-1', amountChangeRequest);

      expect(
        mockAccountService.updateBalanceFromCalculation,
      ).toHaveBeenCalledTimes(2);
    });
  });

  describe('remove', () => {
    it('should remove transaction successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockTransaction);
      mockRepository.find.mockResolvedValue([mockTransaction]);
      mockAccountService.updateBalanceFromCalculation.mockResolvedValue(
        mockAccount,
      );

      await service.remove('user-1', 'transaction-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'transaction-1', userId: 'user-1' },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockTransaction);
      expect(
        mockAccountService.updateBalanceFromCalculation,
      ).toHaveBeenCalledWith('account-1', 'user-1');
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('user-1', 'nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSummary', () => {
    it('should return transaction summary', async () => {
      const mockTransactions = [
        {
          ...mockTransaction,
          type: TransactionType.INCOME,
          amount: 1000,
          status: TransactionStatus.COMPLETED,
        },
        {
          ...mockTransaction,
          type: TransactionType.EXPENSE,
          amount: 500,
          status: TransactionStatus.COMPLETED,
        },
        {
          ...mockTransaction,
          type: TransactionType.TRANSFER,
          amount: 200,
          status: TransactionStatus.COMPLETED,
        },
      ];

      mockRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.getSummary('user-1');

      expect(result).toEqual({
        totalTransactions: 3,
        totalIncome: 1000,
        totalExpenses: 500,
        totalTransfers: 200,
        transactionsByType: {
          [TransactionType.INCOME]: 1,
          [TransactionType.EXPENSE]: 1,
          [TransactionType.TRANSFER]: 1,
        },
        transactionsByStatus: {
          [TransactionStatus.PENDING]: 0,
          [TransactionStatus.COMPLETED]: 3,
          [TransactionStatus.CANCELLED]: 0,
        },
      });
    });
  });

  describe('private methods validation', () => {
    it('should validate account ownership', async () => {
      mockAccountService.findById.mockResolvedValue(mockAccount);

      await expect(
        (service as any).validateAccountOwnership('user-1', 'account-1'),
      ).resolves.not.toThrow();

      expect(mockAccountService.findById).toHaveBeenCalledWith(
        'account-1',
        'user-1',
      );
    });

    it('should validate category ownership', async () => {
      mockCategoryService.findOne.mockResolvedValue(mockCategory);

      await expect(
        (service as any).validateCategoryOwnership('user-1', 'category-1'),
      ).resolves.not.toThrow();

      expect(mockCategoryService.findOne).toHaveBeenCalledWith(
        'user-1',
        'category-1',
      );
    });

    it('should determine when to recalculate balances', () => {
      const updateWithAmount = { amount: 100 };
      const updateWithoutAmount = { description: 'New description' };

      expect((service as any).shouldRecalculateBalances(updateWithAmount)).toBe(
        true,
      );
      expect(
        (service as any).shouldRecalculateBalances(updateWithoutAmount),
      ).toBe(false);
    });
  });
});
