import { Injectable } from '@nestjs/common';

import { isDefined } from 'diex-shared/utils';
import { WorkspaceActivationStatus } from 'diex-shared/workspace';

import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';

// A workspace in either of these states owns no database schema, so it holds no
// records at all. Gating on the activation status is what makes the approval
// wall airtight rather than a list of blocked endpoints: there is no "approved"
// column that a forgotten code path could read as true by default.
export const UNACTIVATED_WORKSPACE_STATUSES = [
  WorkspaceActivationStatus.PENDING_CREATION,
  WorkspaceActivationStatus.ONGOING_CREATION,
];

// WorkspaceService reaches one of these states only after the workspace
// schema, standard objects and initial permissions have been provisioned. A
// suspended or inactive workspace may still have a schema, but it is not
// approved to execute billable AI work.
export const AI_APPROVED_WORKSPACE_STATUSES = [
  WorkspaceActivationStatus.CREATED,
  WorkspaceActivationStatus.ACTIVE,
];

export type ApprovalGateUser = {
  id?: string;
  canAccessFullAdminPanel?: boolean | null;
};

export type ApprovalGateWorkspace = {
  activationStatus: WorkspaceActivationStatus;
};

// Deliberately depends on nothing but the config service. WorkspaceAuthGuard is
// instantiated inside dozens of module contexts, and giving it a heavier
// dependency (repositories, WorkspaceService) would create an import cycle
// through WorkspaceModule. Keeping the predicate free of I/O also means the
// choke-point guard costs no database round trip per request.
@Injectable()
export class WorkspaceApprovalGateService {
  constructor(private readonly diexConfigService: DiexConfigService) {}

  isApprovalRequired(): boolean {
    return this.diexConfigService.get('IS_WORKSPACE_APPROVAL_REQUIRED');
  }

  // True whenever the workspace itself has not been approved yet. Independent of
  // who is asking, because the data surfaces must refuse the workspace, not a
  // particular caller.
  isWorkspaceAwaitingApproval(
    workspace: ApprovalGateWorkspace | undefined | null,
  ): boolean {
    if (!this.isApprovalRequired() || !isDefined(workspace)) {
      return false;
    }

    return UNACTIVATED_WORKSPACE_STATUSES.includes(workspace.activationStatus);
  }

  // AI provider calls have their own hard gate. It is intentionally independent
  // of the optional request-wall configuration: an unprovisioned workspace must
  // never spend provider tokens, even when another access mode is enabled for a
  // development or migration environment.
  isWorkspaceApprovedForAi(
    workspace: ApprovalGateWorkspace | undefined | null,
  ): boolean {
    return (
      isDefined(workspace) &&
      AI_APPROVED_WORKSPACE_STATUSES.includes(workspace.activationStatus)
    );
  }

  isServerAdmin(user: ApprovalGateUser | undefined | null): boolean {
    return isDefined(user) && user.canAccessFullAdminPanel === true;
  }

  // Server admins are exempt so they can still activate their own workspace and
  // run the very first setup. The exemption grants them nothing new: an admin can
  // approve any workspace anyway, so letting them through is not an escalation.
  // Everyone else — including API keys and applications, which carry no user and
  // therefore fail closed — is refused.
  shouldBlockWorkspaceAccess({
    workspace,
    user,
  }: {
    workspace: ApprovalGateWorkspace | undefined | null;
    user: ApprovalGateUser | undefined | null;
  }): boolean {
    if (!this.isWorkspaceAwaitingApproval(workspace)) {
      return false;
    }

    return !this.isServerAdmin(user);
  }

  canActivateWithoutApproval(user: ApprovalGateUser | undefined | null) {
    return !this.isApprovalRequired() || this.isServerAdmin(user);
  }
}
