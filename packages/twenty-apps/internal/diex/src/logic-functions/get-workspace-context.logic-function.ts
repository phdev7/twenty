import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { jsonSchemaToInputSchema } from 'twenty-sdk/logic-function';

type RichText = { markdown?: string | null } | null;

type ContextRecord = {
  id: string;
  name?: string | null;
  status?: string | null;
  businessDescription?: RichText;
  idealCustomerProfile?: RichText;
  toneOfVoice?: RichText;
  commercialRules?: RichText;
  objectionPlaybook?: RichText;
  competitiveLandscape?: RichText;
  forbiddenClaims?: RichText;
  reviewedAt?: string | null;
};

type OfferRecord = {
  id: string;
  name?: string | null;
  category?: string | null;
  pricingModel?: string | null;
  valueProposition?: RichText;
  idealCustomerProfile?: RichText;
  differentiators?: RichText;
  objectionPlaybook?: RichText;
};

export type WorkspaceContextResult = {
  hasContext: boolean;
  status: string | null;
  reviewedAt: string | null;
  stalenessDays: number | null;
  business: string | null;
  idealCustomerProfile: string | null;
  toneOfVoice: string | null;
  commercialRules: string | null;
  objectionPlaybook: string | null;
  competitiveLandscape: string | null;
  forbiddenClaims: string | null;
  activeOffers: {
    name: string;
    category: string | null;
    pricingModel: string | null;
    valueProposition: string | null;
    idealCustomerProfile: string | null;
    differentiators: string | null;
  }[];
  gaps: string[];
  guidance: string;
};

const text = (value?: RichText): string | null => {
  const markdown = value?.markdown?.trim();

  return markdown && markdown.length > 0 ? markdown : null;
};

const daysSince = (value?: string | null): number | null => {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? Math.floor((Date.now() - timestamp) / 86_400_000)
    : null;
};

// The context is the workspace's own commercial identity. Every AI surface —
// internal agents and external MCP clients — should load it before writing
// anything a customer will read, so tone and limits come from the company
// rather than from the model's priors.
const getWorkspaceContext = async (): Promise<WorkspaceContextResult> => {
  const client = new CoreApiClient();

  const result = (await client.query({
    diexWorkspaceContexts: {
      __args: {
        filter: { status: { eq: 'ACTIVE' } },
        orderBy: [{ updatedAt: 'DescNullsLast' }],
        first: 1,
      },
      edges: {
        node: {
          id: true,
          name: true,
          status: true,
          businessDescription: { markdown: true },
          idealCustomerProfile: { markdown: true },
          toneOfVoice: { markdown: true },
          commercialRules: { markdown: true },
          objectionPlaybook: { markdown: true },
          competitiveLandscape: { markdown: true },
          forbiddenClaims: { markdown: true },
          reviewedAt: true,
        },
      },
    },
    offers: {
      __args: {
        filter: { status: { eq: 'ACTIVE' } },
        first: 20,
      },
      edges: {
        node: {
          id: true,
          name: true,
          category: true,
          pricingModel: true,
          valueProposition: { markdown: true },
          idealCustomerProfile: { markdown: true },
          differentiators: { markdown: true },
          objectionPlaybook: { markdown: true },
        },
      },
    },
  } as never)) as unknown as {
    diexWorkspaceContexts?: { edges?: { node: ContextRecord }[] };
    offers?: { edges?: { node: OfferRecord }[] };
  };

  const context = result.diexWorkspaceContexts?.edges?.[0]?.node ?? null;
  const offers = (result.offers?.edges ?? []).map(({ node }) => node);

  const business = text(context?.businessDescription);
  const icp = text(context?.idealCustomerProfile);
  const tone = text(context?.toneOfVoice);
  const rules = text(context?.commercialRules);
  const objections = text(context?.objectionPlaybook);
  const competitors = text(context?.competitiveLandscape);
  const forbidden = text(context?.forbiddenClaims);
  const stalenessDays = daysSince(context?.reviewedAt);

  const gaps: string[] = [];

  if (!context) {
    gaps.push(
      'Nenhum contexto ativo cadastrado. A IA operará sem conhecer o negócio deste workspace.',
    );
  }

  if (!business) {
    gaps.push('Falta descrever o que a empresa faz.');
  }

  if (!icp) {
    gaps.push('Falta o perfil de cliente ideal.');
  }

  if (!tone) {
    gaps.push(
      'Falta o tom de voz; rascunhos sairão no tom genérico do modelo.',
    );
  }

  if (!rules) {
    gaps.push(
      'Faltam as regras comerciais; a IA não sabe o que exige aprovação humana.',
    );
  }

  if (offers.length === 0) {
    gaps.push('Nenhuma oferta ativa cadastrada.');
  }

  if (stalenessDays !== null && stalenessDays > 90) {
    gaps.push(
      `Contexto revisado há ${stalenessDays} dias; confirme antes de usar em decisão comercial.`,
    );
  }

  return {
    hasContext: Boolean(context),
    status: context?.status ?? null,
    reviewedAt: context?.reviewedAt ?? null,
    stalenessDays,
    business,
    idealCustomerProfile: icp,
    toneOfVoice: tone,
    commercialRules: rules,
    objectionPlaybook: objections,
    competitiveLandscape: competitors,
    forbiddenClaims: forbidden,
    activeOffers: offers.map((offer) => ({
      name: offer.name?.trim() || 'Oferta sem nome',
      category: offer.category ?? null,
      pricingModel: offer.pricingModel ?? null,
      valueProposition: text(offer.valueProposition),
      idealCustomerProfile: text(offer.idealCustomerProfile),
      differentiators: text(offer.differentiators),
    })),
    gaps,
    guidance: [
      'Use este contexto como fonte da identidade comercial deste workspace.',
      'Respeite o tom de voz e as regras comerciais em qualquer texto destinado ao cliente.',
      'Nunca faça afirmação listada em "o que nunca afirmar".',
      'Trate as lacunas como ausência de informação, não como permissão para inventar.',
    ].join(' '),
  };
};

const inputSchema = {
  type: 'object' as const,
  properties: {},
};

export default defineLogicFunction({
  universalIdentifier: 'd1e0b000-0000-4000-8000-000000000020',
  name: 'get-diex-workspace-context',
  description:
    'Carrega o contexto comercial da empresa deste workspace — negócio, cliente ideal, tom de voz, regras, objeções, concorrência, proibições e ofertas ativas. Chame antes de analisar ou redigir qualquer coisa destinada ao cliente.',
  timeoutSeconds: 15,
  handler: getWorkspaceContext,
  toolTriggerSettings: {
    inputSchema,
  },
  workflowActionTriggerSettings: {
    label: 'Carregar contexto do workspace Diex',
    inputSchema: jsonSchemaToInputSchema(inputSchema),
    outputSchema: [
      {
        type: 'object',
        properties: {
          hasContext: { type: 'boolean' },
          business: { type: 'string' },
          idealCustomerProfile: { type: 'string' },
          toneOfVoice: { type: 'string' },
          commercialRules: { type: 'string' },
          objectionPlaybook: { type: 'string' },
          competitiveLandscape: { type: 'string' },
          forbiddenClaims: { type: 'string' },
          activeOffers: { type: 'array', items: { type: 'object' } },
          gaps: { type: 'array', items: { type: 'string' } },
          guidance: { type: 'string' },
        },
      },
    ],
  },
});
