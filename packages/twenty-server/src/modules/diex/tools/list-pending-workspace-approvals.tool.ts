import { z } from 'zod';

import { type WorkspaceApprovalService } from 'src/engine/core-modules/workspace-approval/services/workspace-approval.service';

const schema = z.object({
  search: z
    .string()
    .optional()
    .describe(
      'Filtro opcional por nome do workspace, subdomínio ou e-mail do solicitante.',
    ),
});

const matchesSearch = (
  value: string | null,
  normalizedSearch: string,
): boolean => (value ?? '').toLowerCase().includes(normalizedSearch);

export const createListPendingWorkspaceApprovalsTool = (
  workspaceApprovalService: WorkspaceApprovalService,
) => ({
  name: 'list_pending_workspace_approvals' as const,
  description:
    'Lista os workspaces que foram criados no cadastro e ainda aguardam aprovação de um administrador do servidor. Enquanto um workspace estiver nesta lista, quem o criou não consegue acessar nenhum dado.',
  inputSchema: schema,
  execute: async (parameters: z.infer<typeof schema>) => {
    const pendingApprovals =
      await workspaceApprovalService.listPendingApprovals();

    const normalizedSearch = parameters.search?.trim().toLowerCase();

    const filteredApprovals = normalizedSearch
      ? pendingApprovals.filter(
          (approval) =>
            matchesSearch(approval.displayName, normalizedSearch) ||
            matchesSearch(approval.subdomain, normalizedSearch) ||
            matchesSearch(approval.requesterEmail, normalizedSearch),
        )
      : pendingApprovals;

    return {
      approvalRequired: workspaceApprovalService.isApprovalRequired(),
      pendingCount: filteredApprovals.length,
      pendingApprovals: filteredApprovals.map((approval) => ({
        workspaceId: approval.workspaceId,
        displayName: approval.displayName,
        subdomain: approval.subdomain,
        requesterEmail: approval.requesterEmail,
        requesterName: approval.requesterName,
        memberCount: approval.memberCount,
        requestedAt: approval.createdAt.toISOString(),
      })),
      guidance:
        'Para liberar o acesso, chame approve_workspace_creation com o workspaceId exato desta lista e confirm: true. Nunca aprove sem o workspaceId.',
    };
  },
});
