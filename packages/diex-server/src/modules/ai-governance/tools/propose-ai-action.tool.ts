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
