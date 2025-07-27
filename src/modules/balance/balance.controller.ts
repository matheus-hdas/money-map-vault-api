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
import { AuthenticatedRequest } from 'src/common/types/request.type';

@Controller('api/v1/balance')
@UseGuards(AuthGuard)
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get('accounts/:id/current')
  async getCurrentBalance(
    @Param('id') accountId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<CurrentBalanceResponse> {
    const userId = req.user.sub;
    return this.balanceService.getCurrentBalanceResponse(accountId, userId);
  }

  @Get('accounts/:id/history')
  async getBalanceHistory(
    @Param('id') accountId: string,
    @Query() request: BalanceHistoryRequest,
    @Req() req: AuthenticatedRequest,
  ): Promise<BalanceHistoryResponse> {
    const userId = req.user.sub;
    return this.balanceService.getBalanceHistory(accountId, request, userId);
  }

  @Get('accounts/:id/evolution')
  async getBalanceEvolution(
    @Param('id') accountId: string,
    @Query('days') days: number = 30,
    @Req() req: AuthenticatedRequest,
  ): Promise<BalanceEvolutionResponse> {
    const userId = req.user.sub;
    return this.balanceService.getBalanceEvolution(accountId, days, userId);
  }

  @Post('accounts/:id/recalculate')
  async recalculateBalance(
    @Param('id') accountId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<CurrentBalanceResponse> {
    const userId = req.user.sub;
    await this.balanceService.syncAccountBalance(accountId, userId);
    return this.balanceService.getCurrentBalanceResponse(accountId, userId);
  }

  @Get('summary')
  async getBalanceSummary(
    @Req() req: AuthenticatedRequest,
  ): Promise<BalanceSummaryResponse> {
    const userId = req.user.sub;
    return this.balanceService.getBalanceSummary(userId);
  }
}
