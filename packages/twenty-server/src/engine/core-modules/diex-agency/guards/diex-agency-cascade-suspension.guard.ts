import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { getRequest } from 'src/utils/extract-request';
import { DiexAgencyService } from 'src/engine/core-modules/diex-agency/services/diex-agency.service';
import { DiexAgencyStatus } from 'src/engine/core-modules/diex-agency/diex-agency.entity';

@Injectable()
export class DiexAgencyCascadeSuspensionGuard implements CanActivate {
  constructor(private readonly agencyService: DiexAgencyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = getRequest(context);

    if (!request || !request.workspace) {
      return true;
    }

    if (request.workspace.managedByAgencyId) {
      const agency = await this.agencyService.getAgencyById(
        request.workspace.managedByAgencyId,
      );

      if (agency && agency.status === DiexAgencyStatus.SUSPENDED) {
        throw new ForbiddenException(
          'O acesso a este workspace foi suspenso pela sua Agência Parceira por pendências administrativas. Entre em contato com seu gestor de conta.',
        );
      }
    }

    return true;
  }
}
