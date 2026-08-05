import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { WorkspaceApprovalGateService } from 'src/engine/core-modules/workspace-approval/services/workspace-approval-gate.service';
import { getRequest } from 'src/utils/extract-request';

// Defense in depth for the REST and MCP controllers. WorkspaceAuthGuard already
// refuses these requests; this guard is declared next to it so that removing or
// reordering the auth guard on those controllers cannot silently open the gate.
@Injectable()
export class WorkspaceApprovalGuard implements CanActivate {
  constructor(
    private readonly workspaceApprovalGateService: WorkspaceApprovalGateService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = getRequest(context);

    if (!request) {
      return false;
    }

    if (
      this.workspaceApprovalGateService.shouldBlockWorkspaceAccess({
        workspace: request.workspace,
        user: request.user,
      })
    ) {
      throw new ForbiddenException(
        'This workspace is awaiting approval from a server administrator.',
      );
    }

    return true;
  }
}
