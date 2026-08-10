import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { WorkspaceApprovalGateService } from 'src/engine/core-modules/workspace-approval/services/workspace-approval-gate.service';
import { getRequest } from 'src/utils/extract-request';

@Injectable()
export class WorkspaceAuthGuard implements CanActivate {
  constructor(
    private readonly workspaceApprovalGateService: WorkspaceApprovalGateService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = getRequest(context);

    if (!request) {
      return false;
    }

    if (!request.workspace) {
      return false;
    }

    // This is the choke point for the workspace approval gate. Every resolver
    // that reads or writes anything workspace-scoped declares this guard — the
    // metadata resolvers, the record subscriptions, the AI chat resolvers, the
    // REST controller and the MCP controller all pass through here — so refusing
    // once covers them together. The handful of resolvers that do not declare it
    // (currentUser, auth/token, email verification) are exactly the ones an
    // unapproved user still needs to reach the waiting screen, and none of them
    // expose workspace records.
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
