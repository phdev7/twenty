import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { EnterprisePlanService } from 'src/engine/core-modules/enterprise/services/enterprise-plan.service';

@Injectable()
export class DiexAiCreditsGuard implements CanActivate {
  constructor(private readonly enterprisePlanService: EnterprisePlanService) {}

  canActivate(context: ExecutionContext): boolean {
    const isEnterpriseUnlocked = this.enterprisePlanService.isValid();

    if (!isEnterpriseUnlocked) {
      throw new ForbiddenException(
        'Teto mensal de créditos de IA atingido para o workspace. Faça upgrade do seu plano para renovar o acesso.',
      );
    }

    return true;
  }
}
