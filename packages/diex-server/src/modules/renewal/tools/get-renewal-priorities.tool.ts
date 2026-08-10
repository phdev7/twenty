import { z } from 'zod';

import { In, LessThanOrEqual, Not } from 'typeorm';

import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { CustomerRenewalWorkspaceEntity } from 'src/modules/renewal/standard-objects/customer-renewal.workspace-entity';

const schema = z.object({ limit: z.number().int().min(1).max(50).optional() });

export const createGetRenewalPrioritiesTool = (
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  workspaceId: string,
) => ({
  name: 'get_diex_renewal_priorities' as const,
  description:
    'Lista renovações em risco, atrasadas ou sem próxima ação, ordenadas pelo impacto operacional.',
  inputSchema: schema,
  execute: async (parameters: z.infer<typeof schema>) => {
    const limit = parameters.limit ?? 10;
    const now = new Date();
    const authContext = buildSystemAuthContext(workspaceId);

    return globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository =
        await globalWorkspaceOrmManager.getRepository<CustomerRenewalWorkspaceEntity>(
          workspaceId,
          CustomerRenewalWorkspaceEntity,
        );
      const records = await repository.find({
        where: [
          {
            stage: Not(In(['RENEWED', 'CHURNED'])),
            risk: In(['HIGH', 'CRITICAL']),
          },
          {
            stage: Not(In(['RENEWED', 'CHURNED'])),
            nextActionAt: LessThanOrEqual(now),
          },
        ],
        relations: { company: true, owner: true, successPlan: true },
        order: { targetDate: 'ASC' },
        take: limit,
      });

      return {
        generatedAt: now.toISOString(),
        renewals: records.map((renewal) => ({
          id: renewal.id,
          name: renewal.name,
          stage: renewal.stage,
          risk: renewal.risk,
          forecast: renewal.forecast,
          targetDate: renewal.targetDate?.toISOString() ?? null,
          nextAction: renewal.nextAction,
          nextActionAt: renewal.nextActionAt?.toISOString() ?? null,
          lastTouchAt: renewal.lastTouchAt?.toISOString() ?? null,
          riskReason: renewal.riskReason?.markdown?.trim() || null,
          valueEvidence: renewal.valueEvidence?.markdown?.trim() || null,
          company: renewal.company
            ? { id: renewal.company.id, name: renewal.company.name }
            : null,
          owner: renewal.owner
            ? { id: renewal.owner.id, name: renewal.owner.name }
            : null,
          successPlanId: renewal.successPlanId,
        })),
        guidance:
          'Comece pelas renovações CRITICAL e por toda próxima ação vencida. Nada aqui altera registros ou envia comunicação externa.',
      };
    }, authContext);
  },
});
