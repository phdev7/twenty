import { z } from 'zod';

import { AiActionType } from 'src/modules/ai-governance/standard-objects/ai-action.standard-object-definition';
import { AiGovernanceService } from 'src/modules/ai-governance/services/ai-governance.service';

const proposeAiActionSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(AiActionType),
  confidence: z.number().min(0).max(100).optional(),
  rationale: z.string().min(1),
  proposedAction: z.string().min(1),
  opportunityId: z.string().optional(),
  commercialSignalId: z.string().optional(),
  successPlanId: z.string().optional(),
  reviewerId: z.string().optional(),
  inboxConversationId: z.string().optional(),
  idempotencyKey: z.string().optional(),
  contextVersion: z.string().trim().min(1).optional(),
  customObject: z
    .object({
      objectName: z.string().trim().min(1),
      recordId: z.string().trim().min(1).optional(),
      operation: z.enum(['CREATE', 'UPDATE']),
      // ZodRecord não tem `.min`/`.max`: encadeá-los lança TypeError já no
      // carregamento do módulo, e como este arquivo entra no grafo por
      // AiGovernanceToolWorkspaceService, o servidor não sobe. A contagem vai
      // por refine, que valida na análise sem virar constraint no JSON Schema
      // enviado ao provedor.
      fields: z
        .record(z.string(), z.unknown())
        .refine(
          (value) =>
            Object.keys(value).length >= 1 && Object.keys(value).length <= 20,
          { message: 'fields deve conter entre 1 e 20 chaves.' },
        ),
    })
    .optional(),
});

export const createProposeAiActionTool = (
  service: AiGovernanceService,
  workspaceId: string,
) => ({
  name: 'propose_diex_ai_action' as const,
  description:
    'Registra uma proposta de ação comercial ou de CS como aguardando aprovação, sem executar efeitos externos.',
  inputSchema: proposeAiActionSchema,
  execute: async (parameters: z.infer<typeof proposeAiActionSchema>) =>
    service.propose({ workspaceId, ...parameters }),
});
