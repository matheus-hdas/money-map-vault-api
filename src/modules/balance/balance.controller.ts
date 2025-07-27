import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BalanceService } from './balance.service';
import {
  BalanceHistoryRequest,
  CurrentBalanceResponse,
  BalanceHistoryResponse,
  BalanceEvolutionResponse,
  BalanceSummaryResponse,
} from './balance.dto';
import { AuthGuard } from '../auth/auth.guard';
import {
  ResourceOwner,
  ResourceOwnerGuard,
} from 'src/common/guards/resource-owner.guard';
import { AuthenticatedRequest } from 'src/common/types/request.type';

@Controller('api/v1/balance')
@UseGuards(AuthGuard, ResourceOwnerGuard)
@ResourceOwner({ entity: 'account' })
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get('accounts/:id/current')
  async getCurrentBalance(
    @Param('id') accountId: string,
  ): Promise<CurrentBalanceResponse> {
    return this.balanceService.getCurrentBalanceResponse(accountId);
  }

  @Get('accounts/:id/history')
  async getBalanceHistory(
    @Param('id') accountId: string,
    @Query() request: BalanceHistoryRequest,
  ): Promise<BalanceHistoryResponse> {
    return this.balanceService.getBalanceHistory(accountId, request);
  }

  @Get('accounts/:id/evolution')
  async getBalanceEvolution(
    @Param('id') accountId: string,
    @Query('days') days: number = 30,
  ): Promise<BalanceEvolutionResponse> {
    return this.balanceService.getBalanceEvolution(accountId, days);
  }

  @Post('accounts/:id/recalculate')
  async recalculateBalance(
    @Param('id') accountId: string,
  ): Promise<CurrentBalanceResponse> {
    await this.balanceService.syncAccountBalance(accountId);
    return this.balanceService.getCurrentBalanceResponse(accountId);
  }

  @Get('summary')
  async getBalanceSummary(
    @Req() req: AuthenticatedRequest,
  ): Promise<BalanceSummaryResponse> {
    const userId = req.user.sub;
    return this.balanceService.getBalanceSummary(userId);
  }
}
