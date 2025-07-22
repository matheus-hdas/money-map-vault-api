import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../../modules/database/entities/account.entity';
import { AuthenticatedRequest } from '../types/request.type';
import { SetMetadata } from '@nestjs/common';

export const RESOURCE_OWNER_KEY = 'resourceOwner';

export interface ResourceOwnerConfig {
  entity: 'account' | 'transaction' | 'category' | 'goal' | 'budget';
  paramName?: string; // Default: 'id'
  userIdField?: string; // Default: 'userId'
}

export const ResourceOwner = (config: ResourceOwnerConfig) =>
  SetMetadata(RESOURCE_OWNER_KEY, config);

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    // TODO: Inject outros repositories conforme necessário
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<ResourceOwnerConfig>(
      RESOURCE_OWNER_KEY,
      context.getHandler(),
    );

    if (!config) {
      return true; // Sem configuração, permite acesso
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user.sub;
    const paramName = config.paramName || 'id';
    const resourceId = request.params[paramName];

    if (!resourceId) {
      // Se não tem resourceId, pula a verificação (ex: GET /accounts)
      return true;
    }

    return await this.checkOwnership(config.entity, resourceId, userId);
  }

  private async checkOwnership(
    entity: string,
    resourceId: string,
    userId: string,
  ): Promise<boolean> {
    let resource: { userId: string } | null = null;

    switch (entity) {
      case 'account':
        resource = await this.accountRepository.findOne({
          where: { id: resourceId },
          select: ['userId', 'id'],
        });
        break;
      // TODO: Adicionar outros casos conforme necessário
      default:
        throw new ForbiddenException(`Unsupported entity: ${entity}`);
    }

    if (!resource) {
      throw new NotFoundException(`${entity} not found`);
    }

    if (resource.userId !== userId) {
      throw new ForbiddenException(
        `You don't have permission to access this ${entity}`,
      );
    }

    return true;
  }
}
