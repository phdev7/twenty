import { type WorkspaceCommercialReadiness } from 'src/modules/workspace-architecture/services/workspace-commercial-readiness.service';

export type RestrictedCommercialReadiness = Omit<
  WorkspaceCommercialReadiness,
  'visibility' | 'counts' | 'dashboard' | 'evidence' | 'evidenceLedger'
> & {
  visibility: { canViewCommercialData: false };
  counts: null;
  dashboard: null;
  evidence: Omit<
    WorkspaceCommercialReadiness['evidence'],
    'firstConversationId' | 'firstOpportunityId'
  >;
  evidenceLedger: Omit<
    WorkspaceCommercialReadiness['evidenceLedger'],
    'events'
  >;
};

// O readiness alimenta a navegação e a home de todo membro, então a rota não
// pode ser bloqueada por permissão. O que ela devolve, sim: sem a permissão de
// workspace, o membro perde o pipeline financeiro, os agregados comerciais e os
// ids de registro, e fica com o progresso de onboarding que a navegação precisa.
export const redactCommercialReadinessForRestrictedMember = (
  readiness: WorkspaceCommercialReadiness,
): RestrictedCommercialReadiness => {
  const {
    counts: _counts,
    dashboard: _dashboard,
    evidence,
    evidenceLedger,
    ...rest
  } = readiness;
  const {
    firstConversationId: _firstConversationId,
    firstOpportunityId: _firstOpportunityId,
    ...visibleEvidence
  } = evidence;
  const { events: _events, ...visibleEvidenceLedger } = evidenceLedger;

  return {
    ...rest,
    visibility: { canViewCommercialData: false },
    counts: null,
    dashboard: null,
    evidence: visibleEvidence,
    evidenceLedger: visibleEvidenceLedger,
  };
};
