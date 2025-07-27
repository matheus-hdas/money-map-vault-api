import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AccountService } from './account.service';
import {
  CreateAccountRequest,
  UpdateAccountRequest,
  AccountResponse,
  AccountPagedResponse,
  AccountSummaryResponse,
} from './account.dto';
import { Account } from '../database/entities/account.entity';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../../common/types/request.type';

@Controller('api/v1/accounts')
@UseGuards(AuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<AccountPagedResponse> {
    const userId: string = req.user.sub;
    const { accounts, total } = await this.accountService.findAll(
      userId,
      page,
      limit,
    );
    return this.toPagedResponse(accounts, total, page, limit);
  }

  @Get('summary')
  async getSummary(
    @Request() req: AuthenticatedRequest,
  ): Promise<AccountSummaryResponse> {
    const userId: string = req.user.sub;
    return await this.accountService.getSummary(userId);
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<AccountResponse> {
    const userId: string = req.user.sub;
    const account = await this.accountService.findById(id, userId);
    return this.toResponse(account);
  }

  @Post()
  async create(
    @Body() createAccountRequest: CreateAccountRequest,
    @Request() req: AuthenticatedRequest,
  ): Promise<AccountResponse> {
    const userId: string = req.user.sub;
    const account = await this.accountService.create(
      userId,
      createAccountRequest,
    );
    return this.toResponse(account);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAccountRequest: UpdateAccountRequest,
    @Request() req: AuthenticatedRequest,
  ): Promise<AccountResponse> {
    const userId: string = req.user.sub;
    const account = await this.accountService.update(
      id,
      userId,
      updateAccountRequest,
    );
    return this.toResponse(account);
  }

  @Patch(':id/balance')
  async updateBalance(
    @Param('id') id: string,
    @Body('balance') balance: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<AccountResponse> {
    const userId: string = req.user.sub;
    const account = await this.accountService.updateBalance(
      id,
      userId,
      balance,
    );
    return this.toResponse(account);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string }> {
    const userId: string = req.user.sub;
    return await this.accountService.delete(id, userId);
  }

  private toResponse(account: Account): AccountResponse {
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      bank: account.bank,
      accountNumber: account.accountNumber,
      balance: Number(account.balance),
      initialBalance: Number(account.initialBalance),
      currency: account.currency,
      color: account.color,
      icon: account.icon,
      description: account.description,
      isActive: account.isActive,
      includeInTotals: account.includeInTotals,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  private toPagedResponse(
    accounts: Account[],
    total: number,
    page: number,
    limit: number,
  ): AccountPagedResponse {
    return {
      success: true,
      data: accounts.map((account) => this.toResponse(account)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }
}
