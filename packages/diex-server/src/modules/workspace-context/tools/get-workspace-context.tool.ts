import { z } from 'zod';

import { type RichTextMetadata } from 'diex-shared/types';

import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { type DiexWorkspaceContextWorkspaceEntity } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.workspace-entity';
import { WorkspaceContextStatus } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.standard-object-definition';
import { OfferStatus } from 'src/modules/commercial-intelligence/standard-objects/offer.standard-object-definition';
import { type OfferWorkspaceEntity } from 'src/modules/commercial-intelligence/standard-objects/offer.workspace-entity';
import {
  type WorkspaceContextToolContext,
  type WorkspaceContextToolDependencies,
} from 'src/modules/workspace-context/tools/types/workspace-context-tool-dependencies.type';

const getWorkspaceContextSchema = z.object({});

const text = (value?: RichTextMetadata | null): string | null => {
  const markdown = value?.markdown?.trim();

  return markdown && markdown.length > 0 ? markdown : null;
};

const daysSince = (value?: Date | null): number | null => {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? Math.floor((Date.now() - timestamp) / 86_400_000)
    : null;
};

export const createGetWorkspaceContextTool = (
  deps: Pick<WorkspaceContextToolDependencies, 'globalWorkspaceOrmManager'>,
  context: WorkspaceContextToolContext,
) => ({
  name: 'get_diex_workspace_context' as const,
  description:
    'Carrega o contexto comercial da empresa deste workspace — negócio, cliente ideal, tom de voz, regras, objeções, concorrência, proibições e ofertas ativas. Chame antes de analisar ou redigir qualquer coisa destinada ao cliente.',
  inputSchema: getWorkspaceContextSchema,
  execute: async () => {
    const authContext = buildSystemAuthContext(context.workspaceId);

    const { activeContext, offers } =
      await deps.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const contextRepository =
            await deps.globalWorkspaceOrmManager.getRepository<DiexWorkspaceContextWorkspaceEntity>(
              context.workspaceId,
              'diexWorkspaceContext',
              { shouldBypassPermissionChecks: true },
            );
          const offerRepository =
            await deps.globalWorkspaceOrmManager.getRepository<OfferWorkspaceEntity>(
              context.workspaceId,
              'offer',
              { shouldBypassPermissionChecks: true },
            );

          const [contexts, offerRecords] = await Promise.all([
            contextRepository.find({
              where: { status: WorkspaceContextStatus.ACTIVE },
              order: { updatedAt: 'DESC' },
              take: 1,
            }),
            offerRepository.find({
              where: { status: OfferStatus.ACTIVE },
              take: 20,
            }),
          ]);

          return { activeContext: contexts[0] ?? null, offers: offerRecords };
        },
        authContext,
      );

    const business = text(activeContext?.businessDescription);
    const idealCustomerProfile = text(activeContext?.idealCustomerProfile);
    const toneOfVoice = text(activeContext?.toneOfVoice);
    const commercialRules = text(activeContext?.commercialRules);
    const objectionPlaybook = text(activeContext?.objectionPlaybook);
    const competitiveLandscape = text(activeContext?.competitiveLandscape);
    const forbiddenClaims = text(activeContext?.forbiddenClaims);
    const stalenessDays = daysSince(activeContext?.reviewedAt);

    const gaps: string[] = [];

    if (!activeContext) {
      gaps.push(
        'Nenhum contexto ativo cadastrado. A IA operará sem conhecer o negócio deste workspace.',
      );
    }

    if (!business) {
      gaps.push('Falta descrever o que a empresa faz.');
    }

    if (!idealCustomerProfile) {
      gaps.push('Falta o perfil de cliente ideal.');
    }

    if (!toneOfVoice) {
      gaps.push(
        'Falta o tom de voz; rascunhos sairão no tom genérico do modelo.',
      );
    }

    if (!commercialRules) {
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
      hasContext: Boolean(activeContext),
      status: activeContext?.status ?? null,
      reviewedAt: activeContext?.reviewedAt ?? null,
      stalenessDays,
      business,
      idealCustomerProfile,
      toneOfVoice,
      commercialRules,
      objectionPlaybook,
      competitiveLandscape,
      forbiddenClaims,
      activeOffers: offers.map((offer) => ({
        name: offer.name?.trim() || 'Oferta sem nome',
        category: offer.category ?? null,
        pricingModel: offer.pricingModel ?? null,
        basePrice: offer.basePrice ?? null,
        valueProposition: text(offer.valueProposition),
        idealCustomerProfile: text(offer.idealCustomerProfile),
        differentiators: text(offer.differentiators),
        objectionPlaybook: text(offer.objectionPlaybook),
        qualificationCriteria: text(offer.qualificationCriteria),
      })),
      gaps,
      guidance: [
        'Use este contexto como fonte da identidade comercial deste workspace.',
        'Respeite o tom de voz e as regras comerciais em qualquer texto destinado ao cliente.',
        'Nunca faça afirmação listada em "o que nunca afirmar".',
        'Trate as lacunas como ausência de informação, não como permissão para inventar.',
      ].join(' '),
    };
  },
});
