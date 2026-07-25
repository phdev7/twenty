import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { jsonSchemaToInputSchema } from 'twenty-sdk/logic-function';

import { AiActionStatus, AiActionType } from 'src/objects/ai-action.object';

type ProposeAiActionInput = {
  name: string;
  type: AiActionType;
  confidence?: number;
  rationale: string;
  proposedAction: string;
  opportunityId?: string;
  commercialSignalId?: string;
  successPlanId?: string;
  reviewerId?: string;
  inboxConversationId?: string;
  idempotencyKey?: string;
};

type ProposeAiActionResult = {
  success: boolean;
  aiActionId?: string;
  status: AiActionStatus;
  message: string;
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

export const proposeAiAction = async (
  input: ProposeAiActionInput,
): Promise<ProposeAiActionResult> => {
  const name = input.name.trim();
  const rationale = input.rationale.trim();
  const proposedAction = input.proposedAction.trim();
  const idempotencyKey = input.idempotencyKey?.trim();

  if (!name || !rationale || !proposedAction) {
    return {
      success: false,
      status: AiActionStatus.DRAFT,
      message:
        'Título, justificativa e ação proposta são obrigatórios para criar uma ação revisável.',
    };
  }

  const client = new CoreApiClient();

  if (idempotencyKey) {
    const existingResult = (await client.query({
      aiActions: {
        __args: {
          filter: { idempotencyKey: { eq: idempotencyKey } },
          first: 1,
        },
        edges: {
          node: {
            id: true,
            status: true,
          },
        },
      },
    })) as {
      aiActions?: {
        edges?: Array<{
          node?: { id?: string | null; status?: AiActionStatus | null } | null;
        }>;
      };
    };
    const existingAction = existingResult.aiActions?.edges?.[0]?.node;

    if (existingAction?.id) {
      return {
        success: true,
        aiActionId: existingAction.id,
        status: existingAction.status ?? AiActionStatus.PENDING_APPROVAL,
        message:
          'A mesma evidência já possui uma ação registrada. Nenhuma duplicata foi criada.',
      };
    }
  }

  const { createAiAction } = await client.mutation({
    createAiAction: {
      __args: {
        data: {
          name,
          actionType: input.type,
          status: AiActionStatus.PENDING_APPROVAL,
          confidence:
            input.confidence === undefined
              ? undefined
              : clamp(input.confidence, 0, 100),
          rationale: {
            markdown: rationale,
            blocknote: null,
          },
          proposedAction: {
            markdown: proposedAction,
            blocknote: null,
          },
          requestedAt: new Date().toISOString(),
          requiresApproval: true,
          opportunityId: input.opportunityId,
          commercialSignalId: input.commercialSignalId,
          successPlanId: input.successPlanId,
          reviewerId: input.reviewerId,
          inboxConversationId: input.inboxConversationId,
          idempotencyKey,
        },
      },
      id: true,
      status: true,
    },
  });

  if (!createAiAction?.id) {
    return {
      success: false,
      status: AiActionStatus.DRAFT,
      message: 'A ação não pôde ser registrada na fila de aprovação.',
    };
  }

  return {
    success: true,
    aiActionId: createAiAction.id,
    status: AiActionStatus.PENDING_APPROVAL,
    message:
      'Ação registrada como aguardando aprovação. Nenhum efeito externo foi executado.',
  };
};

const inputSchema = {
  type: 'object' as const,
  properties: {
    name: {
      type: 'string' as const,
      description: 'Título curto e objetivo da ação.',
    },
    type: {
      type: 'string' as const,
      enum: Object.values(AiActionType),
      description: 'Tipo da ação comercial ou de Customer Success.',
    },
    confidence: {
      type: 'number' as const,
      minimum: 0,
      maximum: 100,
    },
    rationale: {
      type: 'string' as const,
      description: 'Fatos e inferências que justificam a proposta.',
    },
    proposedAction: {
      type: 'string' as const,
      description:
        'Prévia exata do que deverá acontecer caso um humano aprove.',
    },
    opportunityId: { type: 'string' as const },
    commercialSignalId: { type: 'string' as const },
    successPlanId: { type: 'string' as const },
    reviewerId: { type: 'string' as const },
    inboxConversationId: { type: 'string' as const },
    idempotencyKey: {
      type: 'string' as const,
      description:
        'Chave estável para impedir propostas duplicadas da mesma evidência.',
    },
  },
  required: ['name', 'type', 'rationale', 'proposedAction'],
};

export default defineLogicFunction({
  universalIdentifier: 'd1e0b000-0000-4000-8000-000000000003',
  name: 'propose-diex-ai-action',
  description:
    'Registra uma ação comercial ou de CS como aguardando aprovação, sem executar efeitos externos.',
  timeoutSeconds: 10,
  handler: proposeAiAction,
  toolTriggerSettings: {
    inputSchema,
  },
  workflowActionTriggerSettings: {
    label: 'Propor ação governada pela IA',
    inputSchema: jsonSchemaToInputSchema(inputSchema),
    outputSchema: [
      {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          aiActionId: { type: 'string' },
          status: { type: 'string' },
          message: { type: 'string' },
        },
      },
    ],
  },
});
