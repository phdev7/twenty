import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { jsonSchemaToInputSchema } from 'twenty-sdk/logic-function';

import {
  MEETING_TRANSCRIPT_CANDIDATE_LIMIT,
  MEETING_TRANSCRIPT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  MEETING_TRANSCRIPT_MAX_LENGTH,
  MEETING_TRANSCRIPT_MIN_LENGTH,
} from 'src/modules/meetings/constants/meeting-transcript.constants';

type RegisterMeetingTranscriptInput = {
  transcript?: string;
  title?: string;
  meetingAt?: string;
  companyId?: string;
  personId?: string;
  opportunityId?: string;
  companySearch?: string;
  participants?: string;
};

type RecordCandidate = {
  id: string;
  name: string | null;
};

type OpportunitySummary = {
  id: string;
  name: string | null;
  stage: string | null;
  amount: number | null;
  closeDate: string | null;
  pointOfContact: string | null;
};

type TaskSummary = {
  id: string;
  title: string | null;
  status: string | null;
  dueAt: string | null;
};

export type RegisterMeetingTranscriptResult = {
  stored: boolean;
  noteId: string | null;
  candidates: RecordCandidate[];
  linkedTo: {
    companyId: string | null;
    companyName: string | null;
    personId: string | null;
    opportunityId: string | null;
  };
  openOpportunities: OpportunitySummary[];
  openTasks: TaskSummary[];
  commercialContext: {
    business: string | null;
    idealCustomerProfile: string | null;
    toneOfVoice: string | null;
    commercialRules: string | null;
    forbiddenClaims: string | null;
  };
  guidance: string;
};

const getEdges = <TNode>(
  connection:
    | { edges?: Array<{ node?: TNode | null } | null> | null }
    | null
    | undefined,
): TNode[] =>
  connection?.edges
    ?.map((edge) => edge?.node)
    .filter((node): node is TNode => node !== null && node !== undefined) ?? [];

const readText = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value.trim() || null;
  }

  const markdown = (value as { markdown?: unknown } | null)?.markdown;

  return typeof markdown === 'string' ? markdown.trim() || null : null;
};

const findCompanies = async (
  client: CoreApiClient,
  search: string,
): Promise<RecordCandidate[]> => {
  const result = (await client.query({
    companies: {
      __args: {
        filter: { name: { ilike: `%${search}%` } },
        first: MEETING_TRANSCRIPT_CANDIDATE_LIMIT,
      },
      edges: { node: { id: true, name: true } },
    },
  })) as {
    companies?: {
      edges?: Array<{ node?: { id?: string; name?: string | null } | null }>;
    };
  };

  return getEdges(result.companies)
    .filter((company): company is { id: string; name?: string | null } =>
      Boolean(company.id),
    )
    .map((company) => ({ id: company.id, name: company.name ?? null }));
};

const loadCompanyContext = async (
  client: CoreApiClient,
  companyId: string,
): Promise<{
  companyName: string | null;
  opportunities: OpportunitySummary[];
  tasks: TaskSummary[];
}> => {
  const result = (await client.query({
    company: {
      __args: { filter: { id: { eq: companyId } } },
      id: true,
      name: true,
      opportunities: {
        __args: { first: 10 },
        edges: {
          node: {
            id: true,
            name: true,
            stage: true,
            closeDate: true,
            amount: { amountMicros: true },
            pointOfContact: { name: { firstName: true, lastName: true } },
          },
        },
      },
      taskTargets: {
        __args: { first: 20 },
        edges: {
          node: {
            task: { id: true, title: true, status: true, dueAt: true },
          },
        },
      },
    },
  } as never)) as unknown as {
    company?: {
      name?: string | null;
      opportunities?: {
        edges?: Array<{
          node?: {
            id?: string;
            name?: string | null;
            stage?: string | null;
            closeDate?: string | null;
            amount?: { amountMicros?: number | null } | null;
            pointOfContact?: {
              name?: { firstName?: string | null; lastName?: string | null };
            } | null;
          } | null;
        }>;
      } | null;
      taskTargets?: {
        edges?: Array<{
          node?: {
            task?: {
              id?: string;
              title?: string | null;
              status?: string | null;
              dueAt?: string | null;
            } | null;
          } | null;
        }>;
      } | null;
    } | null;
  };

  return {
    companyName: result.company?.name ?? null,
    opportunities: getEdges(result.company?.opportunities)
      .filter((opportunity) => Boolean(opportunity.id))
      .map((opportunity) => ({
        id: opportunity.id as string,
        name: opportunity.name ?? null,
        stage: opportunity.stage ?? null,
        amount:
          typeof opportunity.amount?.amountMicros === 'number'
            ? opportunity.amount.amountMicros / 1_000_000
            : null,
        closeDate: opportunity.closeDate ?? null,
        pointOfContact:
          [
            opportunity.pointOfContact?.name?.firstName,
            opportunity.pointOfContact?.name?.lastName,
          ]
            .filter(Boolean)
            .join(' ') || null,
      })),
    tasks: getEdges(result.company?.taskTargets)
      .map((target) => target.task)
      .filter(
        (task): task is NonNullable<typeof task> =>
          Boolean(task?.id) && task?.status !== 'DONE',
      )
      .map((task) => ({
        id: task.id as string,
        title: task.title ?? null,
        status: task.status ?? null,
        dueAt: task.dueAt ?? null,
      })),
  };
};

const loadCommercialContext = async (client: CoreApiClient) => {
  const result = (await client.query({
    diexWorkspaceContexts: {
      __args: {
        filter: { status: { eq: 'ACTIVE' } },
        first: 1,
        orderBy: [{ updatedAt: 'DescNullsLast' }],
      },
      edges: {
        node: {
          businessDescription: { markdown: true },
          idealCustomerProfile: { markdown: true },
          toneOfVoice: { markdown: true },
          commercialRules: { markdown: true },
          forbiddenClaims: { markdown: true },
        },
      },
    },
  } as never)) as unknown as {
    diexWorkspaceContexts?: {
      edges?: Array<{ node?: Record<string, unknown> | null }>;
    };
  };
  const context = getEdges(result.diexWorkspaceContexts)[0] ?? {};

  return {
    business: readText(context.businessDescription),
    idealCustomerProfile: readText(context.idealCustomerProfile),
    toneOfVoice: readText(context.toneOfVoice),
    commercialRules: readText(context.commercialRules),
    forbiddenClaims: readText(context.forbiddenClaims),
  };
};

// The transcript is stored by the CRM and read by whoever called this tool.
// Dissecting it — what is an opportunity, what is a task, what was merely said —
// happens on the caller's side, which is why this returns the commercial context
// instead of an opinion.
export const registerMeetingTranscript = async (
  input: RegisterMeetingTranscriptInput,
): Promise<RegisterMeetingTranscriptResult> => {
  const transcript = input.transcript?.trim() ?? '';

  if (transcript.length < MEETING_TRANSCRIPT_MIN_LENGTH) {
    throw new Error(
      `A transcrição está curta demais (${transcript.length} caracteres). Envie o texto completo da reunião.`,
    );
  }

  if (transcript.length > MEETING_TRANSCRIPT_MAX_LENGTH) {
    throw new Error(
      `A transcrição excede ${MEETING_TRANSCRIPT_MAX_LENGTH} caracteres. Divida a reunião em partes.`,
    );
  }

  const client = new CoreApiClient();
  const search = input.companySearch?.trim();
  let companyId = input.companyId?.trim() || null;
  let candidates: RecordCandidate[] = [];

  if (!companyId && search) {
    candidates = await findCompanies(client, search);

    if (candidates.length === 1) {
      companyId = candidates[0].id;
    } else {
      // More than one company answers to that name, or none does. Storing the
      // meeting against a guess is worse than asking.
      return {
        stored: false,
        noteId: null,
        candidates,
        linkedTo: {
          companyId: null,
          companyName: null,
          personId: null,
          opportunityId: null,
        },
        openOpportunities: [],
        openTasks: [],
        commercialContext: await loadCommercialContext(client),
        guidance:
          candidates.length === 0
            ? 'Nenhuma empresa corresponde a essa busca. Confirme o nome ou crie a empresa antes de registrar a reunião.'
            : 'Mais de uma empresa corresponde à busca. Chame de novo com companyId para não gravar a reunião no cliente errado.',
      };
    }
  }

  const meetingAt = input.meetingAt?.trim();
  const title =
    input.title?.trim() ||
    `Reunião${meetingAt ? ` — ${meetingAt.slice(0, 10)}` : ''}`;
  const header = [
    meetingAt ? `Data: ${meetingAt}` : null,
    input.participants?.trim()
      ? `Participantes: ${input.participants.trim()}`
      : null,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  const { createNote } = await client.mutation({
    createNote: {
      __args: {
        data: {
          title,
          bodyV2: {
            markdown: header
              ? `${header}\n\n## Transcrição\n\n${transcript}`
              : `## Transcrição\n\n${transcript}`,
            blocknote: null,
          },
        },
      },
      id: true,
    },
  });
  const noteId = createNote?.id ?? null;

  if (!noteId) {
    throw new Error('A nota da reunião não pôde ser criada.');
  }

  const personId = input.personId?.trim() || null;
  const opportunityId = input.opportunityId?.trim() || null;

  // Every link is a separate target row, which is what makes the meeting show up
  // on the company, on the contact and on the deal instead of only one of them.
  for (const target of [
    companyId ? { targetCompanyId: companyId } : null,
    personId ? { targetPersonId: personId } : null,
    opportunityId ? { targetOpportunityId: opportunityId } : null,
  ]) {
    if (!target) {
      continue;
    }

    await client.mutation({
      createNoteTarget: {
        __args: { data: { noteId, ...target } },
        id: true,
      },
    } as never);
  }

  const companyContext = companyId
    ? await loadCompanyContext(client, companyId)
    : { companyName: null, opportunities: [], tasks: [] };

  return {
    stored: true,
    noteId,
    candidates,
    linkedTo: {
      companyId,
      companyName: companyContext.companyName,
      personId,
      opportunityId,
    },
    openOpportunities: companyContext.opportunities,
    openTasks: companyContext.tasks,
    commercialContext: await loadCommercialContext(client),
    guidance: [
      'A transcrição está gravada como nota e ligada aos registros informados.',
      'Separe o que foi dito do que você concluiu: fato é o que está na transcrição, o resto é inferência e deve ser rotulado como tal.',
      'Para registrar desdobramentos use as ferramentas do CRM: create_one_task para próximos passos (com dueAt e responsável quando a reunião definiu), create_one_opportunity apenas quando houve intenção real de compra, e create_one_commercial_signal para sinais que expliquem risco ou urgência.',
      'Ligue o que criar ao mesmo cliente com create_one_task_target ou os campos de relação, e cite no corpo o trecho da reunião que sustenta cada item.',
      'Não duplique: as oportunidades e tarefas abertas devolvidas aqui já existem — atualize-as em vez de criar iguais.',
      'Respeite o tom de voz e as regras comerciais devolvidas, e nada aqui autoriza enviar mensagem ao cliente.',
    ].join(' '),
  };
};

const inputSchema = {
  type: 'object' as const,
  properties: {
    transcript: {
      type: 'string' as const,
      description:
        'Texto completo da transcrição da reunião, como foi capturado.',
    },
    title: {
      type: 'string' as const,
      description: 'Título da reunião. Quando ausente, é gerado pela data.',
    },
    meetingAt: {
      type: 'string' as const,
      description: 'Data e hora da reunião em ISO 8601.',
    },
    companyId: {
      type: 'string' as const,
      description: 'Id da empresa. Use quando já souber qual é.',
    },
    companySearch: {
      type: 'string' as const,
      description:
        'Nome da empresa, quando o id não for conhecido. Busca ambígua devolve candidatos e não grava nada.',
    },
    personId: {
      type: 'string' as const,
      description: 'Id do contato presente na reunião.',
    },
    opportunityId: {
      type: 'string' as const,
      description: 'Id da oportunidade que a reunião discutiu.',
    },
    participants: {
      type: 'string' as const,
      description: 'Quem participou, como texto livre.',
    },
  },
  required: ['transcript'],
};

export default defineLogicFunction({
  universalIdentifier: MEETING_TRANSCRIPT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'register-diex-meeting-transcript',
  description:
    'Grava a transcrição de uma reunião como nota ligada à empresa, contato e oportunidade, e devolve o contexto comercial necessário para desdobrá-la em tarefas, oportunidades e sinais. A análise é feita por quem chama; o CRM guarda e contextualiza.',
  timeoutSeconds: 60,
  handler: registerMeetingTranscript,
  toolTriggerSettings: { inputSchema },
  workflowActionTriggerSettings: {
    label: 'Registrar transcrição de reunião',
    inputSchema: jsonSchemaToInputSchema(inputSchema),
    outputSchema: [
      {
        type: 'object',
        properties: {
          stored: { type: 'boolean' },
          noteId: { type: 'string' },
          candidates: { type: 'array', items: { type: 'object' } },
          linkedTo: { type: 'object' },
          openOpportunities: { type: 'array', items: { type: 'object' } },
          openTasks: { type: 'array', items: { type: 'object' } },
          commercialContext: { type: 'object' },
          guidance: { type: 'string' },
        },
      },
    ],
  },
});
