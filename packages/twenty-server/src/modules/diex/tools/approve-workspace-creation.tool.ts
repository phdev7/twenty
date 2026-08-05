import { z } from 'zod';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceApprovalService } from 'src/engine/core-modules/workspace-approval/services/workspace-approval.service';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  workspaceId: z
    .string()
    .describe(
      'ID exato do workspace a aprovar, copiado de list_pending_workspace_approvals.',
    ),
  confirm: z
    .boolean()
    .describe(
      'Precisa ser true. Serve como confirmação explícita de que o administrador decidiu liberar este workspace.',
    ),
});

type ApproverContext = {
  userId?: string;
  canAccessFullAdminPanel: boolean;
};

export const createApproveWorkspaceCreationTool = (
  workspaceApprovalService: WorkspaceApprovalService,
  approver: ApproverContext,
) => ({
  name: 'approve_workspace_creation' as const,
  description:
    'Aprova um workspace que aguarda liberação e o ativa, dando ao solicitante acesso ao CRM. Exige o workspaceId exato e confirm: true — nunca aprove a partir de um nome parcial ou de uma descrição ambígua.',
  inputSchema: schema,
  execute: async (parameters: z.infer<typeof schema>) => {
    if (parameters.confirm !== true) {
      return {
        approved: false,
        message:
          'Aprovação não executada: confirm precisa ser true. Confirme com o administrador antes de liberar o acesso.',
      };
    }

    const workspaceId = parameters.workspaceId.trim();

    // A malformed id would otherwise reach the database as a cast error; an
    // explicit refusal keeps an ambiguous instruction from looking like a
    // transient failure the model should retry.
    if (!UUID_PATTERN.test(workspaceId)) {
      return {
        approved: false,
        message:
          'Aprovação não executada: workspaceId precisa ser o UUID exato retornado por list_pending_workspace_approvals.',
      };
    }

    const pendingApprovals =
      await workspaceApprovalService.listPendingApprovals();
    const pendingApproval = pendingApprovals.find(
      (approval) => approval.workspaceId === workspaceId,
    );

    if (!isDefined(pendingApproval)) {
      return {
        approved: false,
        message: `Aprovação não executada: o workspace ${workspaceId} não está na fila de aprovação. Ele pode já ter sido aprovado ou removido.`,
      };
    }

    const result = await workspaceApprovalService.approveWorkspace({
      workspaceId,
      approver: {
        id: approver.userId,
        canAccessFullAdminPanel: approver.canAccessFullAdminPanel,
      },
    });

    return {
      approved: true,
      workspaceId: result.workspaceId,
      subdomain: result.subdomain,
      displayName: result.displayName,
      activationStatus: result.activationStatus,
      message: `Workspace ${result.displayName ?? result.subdomain} aprovado e ativado. O solicitante já pode concluir o onboarding.`,
    };
  },
});
