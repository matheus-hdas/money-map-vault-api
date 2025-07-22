import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccountService } from '../account.service';
import { Account, AccountType } from '../../database/entities/account.entity';
import { CreateAccountRequest, UpdateAccountRequest } from '../account.dto';

describe('AccountService', () => {
  let service: AccountService;

  const mockAccount: Account = {
    id: '1',
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

  const mockRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return accounts and total', async () => {
      const userId = 'user-1';
      const page = 1;
      const limit = 10;
      const total = 1;
      const accounts = [mockAccount];

      mockRepository.findAndCount.mockResolvedValue([accounts, total]);

      const result = await service.findAll(userId, page, limit);

      expect(result).toEqual({
        accounts,
        total,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty list when no accounts found', async () => {
      const userId = 'user-1';
      const page = 1;
      const limit = 10;
      const total = 0;
      const accounts = [];

      mockRepository.findAndCount.mockResolvedValue([accounts, total]);

      const result = await service.findAll(userId, page, limit);

      expect(result).toEqual({
        accounts: [],
        total: 0,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });
    });

    it('should handle different page and limit values', async () => {
      const userId = 'user-1';
      const page = 2;
      const limit = 5;
      const total = 10;
      const accounts = [mockAccount];

      mockRepository.findAndCount.mockResolvedValue([accounts, total]);

      const result = await service.findAll(userId, page, limit);

      expect(result).toEqual({
        accounts,
        total,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return account when found', async () => {
      const accountId = '1';
      const userId = 'user-1';
      mockRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.findById(accountId, userId);

      expect(result).toEqual(mockAccount);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: accountId, userId, isActive: true },
      });
    });

    it('should return account when found without userId', async () => {
      const accountId = '1';
      mockRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.findById(accountId);

      expect(result).toEqual(mockAccount);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: accountId, isActive: true },
      });
    });

    it('should throw NotFoundException when account not found', async () => {
      const accountId = 'nonexistent';
      const userId = 'user-1';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(accountId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: accountId, userId, isActive: true },
      });
    });
  });

  describe('create', () => {
    it('should create a new account successfully', async () => {
      const userId = 'user-1';
      const createAccountRequest: CreateAccountRequest = {
        name: 'Nova Conta',
        type: AccountType.SAVINGS,
        bank: 'Nubank',
        initialBalance: 500.0,
      };

      const newAccount: Account = {
        ...mockAccount,
        id: '2',
        name: 'Nova Conta',
        type: AccountType.SAVINGS,
        bank: 'Nubank',
        balance: 500.0,
        initialBalance: 500.0,
        userId,
      };

      // Mock para validateUniqueAccountName - não encontra conta existente
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(newAccount);
      mockRepository.save.mockResolvedValue(newAccount);

      const result = await service.create(userId, createAccountRequest);

      expect(result).toEqual(newAccount);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: createAccountRequest.name, userId, isActive: true },
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createAccountRequest,
        userId,
        balance: 500.0,
        initialBalance: 500.0,
        currency: 'BRL',
        color: '#1976d2',
        includeInTotals: true,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(newAccount);
    });

    it('should create account with default values when not provided', async () => {
      const userId = 'user-1';
      const createAccountRequest: CreateAccountRequest = {
        name: 'Conta Básica',
        type: AccountType.CASH,
      };

      const newAccount: Account = {
        ...mockAccount,
        name: 'Conta Básica',
        type: AccountType.CASH,
        balance: 0,
        initialBalance: 0,
        userId,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(newAccount);
      mockRepository.save.mockResolvedValue(newAccount);

      const result = await service.create(userId, createAccountRequest);

      expect(result).toEqual(newAccount);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createAccountRequest,
        userId,
        balance: 0,
        initialBalance: 0,
        currency: 'BRL',
        color: '#1976d2',
        includeInTotals: true,
      });
    });

    it('should throw BadRequestException when account name already exists', async () => {
      const userId = 'user-1';
      const createAccountRequest: CreateAccountRequest = {
        name: 'Conta Existente',
        type: AccountType.CHECKING,
      };

      mockRepository.findOne.mockResolvedValue(mockAccount);

      await expect(
        service.create(userId, createAccountRequest),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: createAccountRequest.name, userId, isActive: true },
      });
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update account successfully', async () => {
      const accountId = '1';
      const userId = 'user-1';
      const updateAccountRequest: UpdateAccountRequest = {
        name: 'Conta Atualizada',
        description: 'Nova descrição',
      };

      const updatedAccount: Account = {
        ...mockAccount,
        name: 'Conta Atualizada',
        description: 'Nova descrição',
      };

      // Primeiro call: findById (encontra a conta)
      // Segundo call: validateUniqueAccountName (não encontra conflito)
      mockRepository.findOne
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(null);
      mockRepository.save.mockResolvedValue(updatedAccount);

      const result = await service.update(
        accountId,
        userId,
        updateAccountRequest,
      );

      expect(result).toEqual(updatedAccount);
      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: accountId, userId, isActive: true },
      });
      expect(mockRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { name: 'Conta Atualizada', userId, isActive: true },
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockAccount,
        ...updateAccountRequest,
      });
    });

    it('should validate unique name when updating', async () => {
      const accountId = '1';
      const userId = 'user-1';
      const updateAccountRequest: UpdateAccountRequest = {
        name: 'Novo Nome',
      };

      const updatedAccount: Account = {
        ...mockAccount,
        name: 'Novo Nome',
      };

      // Primeiro call: findById (encontra a conta)
      // Segundo call: validateUniqueAccountName (não encontra conflito)
      mockRepository.findOne
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(null);
      mockRepository.save.mockResolvedValue(updatedAccount);

      const result = await service.update(
        accountId,
        userId,
        updateAccountRequest,
      );

      expect(result).toEqual(updatedAccount);
      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: accountId, userId, isActive: true },
      });
      expect(mockRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { name: 'Novo Nome', userId, isActive: true },
      });
    });

    it('should throw BadRequestException when new name already exists', async () => {
      const accountId = '1';
      const userId = 'user-1';
      const updateAccountRequest: UpdateAccountRequest = {
        name: 'Nome Existente',
      };

      const conflictAccount: Account = {
        ...mockAccount,
        id: '2',
        name: 'Nome Existente',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(conflictAccount);

      await expect(
        service.update(accountId, userId, updateAccountRequest),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when account not found', async () => {
      const accountId = 'nonexistent';
      const userId = 'user-1';
      const updateAccountRequest: UpdateAccountRequest = {
        name: 'Novo Nome',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(accountId, userId, updateAccountRequest),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should perform soft delete when account has transactions', async () => {
      const accountId = '1';
      const userId = 'user-1';

      mockRepository.findOne.mockResolvedValue(mockAccount);
      mockRepository.query.mockResolvedValue([{ count: '5' }]);
      mockRepository.save.mockResolvedValue({
        ...mockAccount,
        isActive: false,
      });

      const result = await service.delete(accountId, userId);

      expect(result).toEqual({
        success: true,
        message:
          'Account deactivated successfully (has associated transactions)',
      });
      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count'),
        [accountId],
      );
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockAccount,
        isActive: false,
      });
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should perform hard delete when account has no transactions', async () => {
      const accountId = '1';
      const userId = 'user-1';

      mockRepository.findOne.mockResolvedValue(mockAccount);
      mockRepository.query.mockResolvedValue([{ count: '0' }]);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.delete(accountId, userId);

      expect(result).toEqual({
        success: true,
        message: 'Account deleted successfully',
      });
      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count'),
        [accountId],
      );
      expect(mockRepository.delete).toHaveBeenCalledWith(accountId);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when account not found', async () => {
      const accountId = 'nonexistent';
      const userId = 'user-1';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(accountId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.query).not.toHaveBeenCalled();
      expect(mockRepository.delete).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getSummary', () => {
    it('should return account summary', async () => {
      const userId = 'user-1';
      const accounts = [
        { ...mockAccount, type: AccountType.CHECKING, balance: 1000 },
        { ...mockAccount, id: '2', type: AccountType.SAVINGS, balance: 2000 },
        {
          ...mockAccount,
          id: '3',
          type: AccountType.CREDIT_CARD,
          balance: -500,
          includeInTotals: false,
        },
      ];

      mockRepository.find.mockResolvedValue(accounts);

      const result = await service.getSummary(userId);

      expect(result).toEqual({
        totalAccounts: 3,
        totalBalance: 3000, // Apenas contas com includeInTotals: true
        activeAccounts: 3,
        accountsByType: {
          checking: 1,
          savings: 1,
          credit_card: 1,
          investment: 0,
          cash: 0,
          other: 0,
        },
      });
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId, isActive: true },
      });
    });

    it('should return empty summary when no accounts', async () => {
      const userId = 'user-1';
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getSummary(userId);

      expect(result).toEqual({
        totalAccounts: 0,
        totalBalance: 0,
        activeAccounts: 0,
        accountsByType: {
          checking: 0,
          savings: 0,
          credit_card: 0,
          investment: 0,
          cash: 0,
          other: 0,
        },
      });
    });
  });

  describe('updateBalance', () => {
    it('should update account balance successfully', async () => {
      const accountId = '1';
      const userId = 'user-1';
      const newBalance = 2500.0;

      const updatedAccount: Account = {
        ...mockAccount,
        balance: newBalance,
      };

      mockRepository.findOne.mockResolvedValue(mockAccount);
      mockRepository.save.mockResolvedValue(updatedAccount);

      const result = await service.updateBalance(accountId, userId, newBalance);

      expect(result).toEqual(updatedAccount);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: accountId, userId, isActive: true },
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockAccount,
        balance: newBalance,
      });
    });

    it('should throw NotFoundException when account not found', async () => {
      const accountId = 'nonexistent';
      const userId = 'user-1';
      const newBalance = 1000.0;

      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateBalance(accountId, userId, newBalance),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
