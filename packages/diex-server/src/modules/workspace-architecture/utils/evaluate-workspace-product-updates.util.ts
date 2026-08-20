import {
  WORKSPACE_PRODUCT_UPDATE_REGISTRY,
  WORKSPACE_PRODUCT_UPDATE_REGISTRY_VERSION,
} from 'src/modules/workspace-architecture/constants/workspace-product-update-registry.constant';
import {
  type WorkspaceProductUpdateAcknowledgement,
  type WorkspaceProductUpdateContextField,
  type WorkspaceProductUpdateEvaluation,
} from 'src/modules/workspace-architecture/types/workspace-product-update.type';
import { workspaceMultiOperationSchema } from 'src/modules/workspace-architecture/types/workspace-multi-operation.schema';

export const workspaceProductUpdateReadinessCriterionKey = (
  updateKey: string,
): string => `product_update_${updateKey.replace(/[^a-zA-Z0-9]+/g, '_')}`;

// Entrada substituída sai da avaliação inteira: ela permanece no registro como
// histórico do que foi publicado, mas quem cobra o workspace é a sucessora.
export const ACTIVE_WORKSPACE_PRODUCT_UPDATES =
  WORKSPACE_PRODUCT_UPDATE_REGISTRY.filter(
    ({ supersededByKey }) => supersededByKey === undefined,
  );

export const getWorkspaceProductUpdateReadinessCriteria = () =>
  ACTIVE_WORKSPACE_PRODUCT_UPDATES.filter(
    ({ blocksReadiness }) => blocksReadiness,
  ).map((definition) => ({
    key: workspaceProductUpdateReadinessCriterionKey(definition.key),
    label: definition.title,
    phase: 'DISCOVERY_REVIEW' as const,
    required: true,
    weight: definition.readinessWeight,
    source: 'CUSTOM' as const,
    firstValue: false,
    // Atualização pendente reduz a prontidão e aparece como aviso, mas nunca
    // tranca um workspace que já está operando.
    blocksActivation: false,
    nextAction:
      definition.completion.kind === 'CONTEXT_FIELDS'
        ? `Complete: ${definition.completion.fields
            .map(({ label }) => label)
            .join(', ')}.`
        : definition.actionLabel,
    sourceTemplateIds: [
      `diex.product-update.${definition.key}@${definition.version}`,
    ],
  }));

const CONFIGURED_PRIMARY_CHANNELS = new Set([
  'WHATSAPP',
  'EMAIL',
  'IMPORT',
  'MANUAL',
]);

const isConfiguredPrimaryChannel = (
  primaryChannel: string | null | undefined,
): boolean =>
  typeof primaryChannel === 'string' &&
  CONFIGURED_PRIMARY_CHANNELS.has(primaryChannel.trim().toUpperCase());

export const evaluateWorkspaceProductUpdates = ({
  workspaceCreatedAt,
  context,
  contextIsActive,
  acknowledgements,
  primaryChannel,
  multiOperation,
  agencyLinked = false,
}: {
  workspaceCreatedAt: Date | string | null;
  context: Partial<Record<WorkspaceProductUpdateContextField, string | null>>;
  contextIsActive: boolean;
  acknowledgements: WorkspaceProductUpdateAcknowledgement[];
  primaryChannel?: string | null;
  multiOperation?: unknown;
  // Vínculo de agência persistido: workspace gerido por agência ou workspace
  // cujo administrador é dono de uma agência.
  agencyLinked?: boolean;
}): WorkspaceProductUpdateEvaluation => {
  const workspaceCreatedAtTimestamp = workspaceCreatedAt
    ? new Date(workspaceCreatedAt).getTime()
    : 0;
  const acknowledgementByUpdate = new Map(
    acknowledgements.map((acknowledgement) => [
      `${acknowledgement.key}@${acknowledgement.version}`,
      acknowledgement,
    ]),
  );
  const items = ACTIVE_WORKSPACE_PRODUCT_UPDATES.map((definition) => {
    const acknowledgement = acknowledgementByUpdate.get(
      `${definition.key}@${definition.version}`,
    );
    const missingFields =
      definition.completion.kind === 'CONTEXT_FIELDS'
        ? definition.completion.fields.filter(
            ({ key }) => (context[key] ?? '').trim().length === 0,
          )
        : [];
    // Operação de agência só é exigida de quem participa do ecossistema de
    // agência. Para os demais a exigência não se aplica, e não se aplica é
    // diferente de concluída: nada é dado como respondido por padrão.
    const appliesToWorkspace =
      definition.completion.kind === 'AGENCY_OPERATION_CONFIGURATION'
        ? agencyLinked
        : true;
    const needsAdminConfirmation =
      (definition.completion.kind === 'CONTEXT_FIELDS' ||
        definition.completion.kind === 'AGENCY_OPERATION_CONFIGURATION') &&
      definition.completion.requiresAdminConfirmation &&
      appliesToWorkspace &&
      !acknowledgement;
    const completed =
      definition.completion.kind === 'ACKNOWLEDGEMENT'
        ? Boolean(acknowledgement)
        : definition.completion.kind === 'PRIMARY_CHANNEL'
          ? isConfiguredPrimaryChannel(primaryChannel)
          : definition.completion.kind === 'MULTI_OPERATION_CONFIGURATION'
            ? workspaceMultiOperationSchema.safeParse(multiOperation).success
            : definition.completion.kind === 'AGENCY_OPERATION_CONFIGURATION'
              ? appliesToWorkspace && Boolean(acknowledgement)
              : missingFields.length === 0 && !needsAdminConfirmation;

    return {
      key: definition.key,
      version: definition.version,
      title: definition.title,
      summary: definition.summary,
      revenueImpact: definition.revenueImpact,
      releasedAt: definition.releasedAt,
      importance: definition.importance,
      blocksReadiness: definition.blocksReadiness,
      readinessWeight: definition.readinessWeight,
      actionLabel: definition.actionLabel,
      actionRoute: definition.actionRoute,
      appliesToWorkspace,
      status: !appliesToWorkspace
        ? ('NOT_APPLICABLE' as const)
        : completed
          ? ('COMPLETED' as const)
          : acknowledgement
            ? ('ACKNOWLEDGED' as const)
            : ('PENDING' as const),
      isUpdateForExistingWorkspace:
        workspaceCreatedAtTimestamp < Date.parse(definition.releasedAt),
      missingFields,
      acknowledgedAt: acknowledgement?.acknowledgedAt ?? null,
      completionKind: definition.completion.kind,
      needsAdminConfirmation,
      canAdminConfirm:
        definition.completion.kind === 'ACKNOWLEDGEMENT'
          ? true
          : definition.completion.kind === 'PRIMARY_CHANNEL'
            ? isConfiguredPrimaryChannel(primaryChannel)
            : definition.completion.kind === 'MULTI_OPERATION_CONFIGURATION'
              ? false
              : definition.completion.kind === 'AGENCY_OPERATION_CONFIGURATION'
                ? appliesToWorkspace
                : missingFields.length === 0 && contextIsActive,
      readinessCriterionKey: workspaceProductUpdateReadinessCriterionKey(
        definition.key,
      ),
    };
  });
  const itemByReadinessCriterionKey = new Map(
    items.map((item) => [item.readinessCriterionKey, item]),
  );
  const readinessCriteria = getWorkspaceProductUpdateReadinessCriteria().map(
    (criterion) => {
      const item = itemByReadinessCriterionKey.get(criterion.key);

      if (!item) return criterion;

      return {
        ...criterion,
        nextAction:
          item.missingFields.length > 0
            ? `Complete: ${item.missingFields
                .map(({ label }) => label)
                .join(', ')}.`
            : item.needsAdminConfirmation
              ? 'Revise os dados preenchidos e confirme esta atualização como administrador.'
              : criterion.nextAction,
      };
    },
  );

  return {
    state: {
      registryVersion: WORKSPACE_PRODUCT_UPDATE_REGISTRY_VERSION,
      pendingCount: items.filter(
        ({ status }) => status !== 'COMPLETED' && status !== 'NOT_APPLICABLE',
      ).length,
      blockingPendingCount: items.filter(
        ({ blocksReadiness, status }) =>
          blocksReadiness &&
          status !== 'COMPLETED' &&
          status !== 'NOT_APPLICABLE',
      ).length,
      adminNoticeCount: items.filter(
        ({ isUpdateForExistingWorkspace, status }) =>
          isUpdateForExistingWorkspace &&
          status !== 'COMPLETED' &&
          status !== 'NOT_APPLICABLE',
      ).length,
      items,
    },
    readinessCriteria,
    readinessByCriterionKey: new Map(
      items.map((item) => [
        item.readinessCriterionKey,
        // Exigência fora do alcance do workspace não pode segurar a prontidão.
        // Ela conta como satisfeita no cálculo e continua marcada como
        // NOT_APPLICABLE no painel, para nunca ser lida como concluída.
        item.status === 'COMPLETED' || item.status === 'NOT_APPLICABLE',
      ]),
    ),
    evidenceRecordIdByCriterionKey: new Map(
      items.map((item) => [
        item.readinessCriterionKey,
        item.status === 'COMPLETED'
          ? `product-update:${item.key}@${item.version}`
          : null,
      ]),
    ),
  };
};
