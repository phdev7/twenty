import { Injectable } from '@nestjs/common';

import { type ToolSet } from 'ai';

import { WorkspaceApprovalService } from 'src/engine/core-modules/workspace-approval/services/workspace-approval.service';
import { createApproveWorkspaceCreationTool } from 'src/modules/diex/tools/approve-workspace-creation.tool';
import { createListPendingWorkspaceApprovalsTool } from 'src/modules/diex/tools/list-pending-workspace-approvals.tool';

@Injectable()
export class WorkspaceApprovalToolService {
  constructor(
    private readonly workspaceApprovalService: WorkspaceApprovalService,
  ) {}

  generateWorkspaceApprovalTools(approver: {
    userId?: string;
    canAccessFullAdminPanel: boolean;
  }): ToolSet {
    const listTool = createListPendingWorkspaceApprovalsTool(
      this.workspaceApprovalService,
    );
    const approveTool = createApproveWorkspaceCreationTool(
      this.workspaceApprovalService,
      approver,
    );

    return { [listTool.name]: listTool, [approveTool.name]: approveTool };
  }
}
