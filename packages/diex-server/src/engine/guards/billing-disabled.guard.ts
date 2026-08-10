import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';

import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';

@Injectable()
export class BillingDisabledGuard implements CanActivate {
  constructor(private readonly diexConfigService: DiexConfigService) {}

  canActivate(_context: ExecutionContext): boolean {
    return !this.diexConfigService.isBillingEnabled();
  }
}
