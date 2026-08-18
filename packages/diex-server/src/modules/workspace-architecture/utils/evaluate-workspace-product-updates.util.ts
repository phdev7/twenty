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

export const getWorkspaceProductUpdateReadinessCriteria = () =>
  WORKSPACE_PRODUCT_UPDATE_REGISTRY.filter(
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
}: {
  workspaceCreatedAt: Date | string | null;
  context: Partial<Record<WorkspaceProductUpdateContextField, string | null>>;
  contextIsActive: boolean;
  acknowledgements: WorkspaceProductUpdateAcknowledgement[];
  primaryChannel?: string | null;
  multiOperation?: unknown;
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
  const items = WORKSPACE_PRODUCT_UPDATE_REGISTRY.map((definition) => {
    const acknowledgement = acknowledgementByUpdate.get(
      `${definition.key}@${definition.version}`,
    );
    const missingFields =
      definition.completion.kind === 'CONTEXT_FIELDS'
        ? definition.completion.fields.filter(
            ({ key }) => (context[key] ?? '').trim().length === 0,
          )
        : [];
    const needsAdminConfirmation =
      definition.completion.kind === 'CONTEXT_FIELDS' &&
      definition.completion.requiresAdminConfirmation &&
      !acknowledgement;
    const completed =
      definition.completion.kind === 'ACKNOWLEDGEMENT'
        ? Boolean(acknowledgement)
        : definition.completion.kind === 'PRIMARY_CHANNEL'
          ? isConfiguredPrimaryChannel(primaryChannel)
          : definition.completion.kind === 'MULTI_OPERATION_CONFIGURATION'
            ? workspaceMultiOperationSchema.safeParse(multiOperation).success
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
      status: completed
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
      pendingCount: items.filter(({ status }) => status !== 'COMPLETED').length,
      blockingPendingCount: items.filter(
        ({ blocksReadiness, status }) =>
          blocksReadiness && status !== 'COMPLETED',
      ).length,
      adminNoticeCount: items.filter(
        ({ isUpdateForExistingWorkspace, status }) =>
          isUpdateForExistingWorkspace && status !== 'COMPLETED',
      ).length,
      items,
    },
    readinessCriteria,
    readinessByCriterionKey: new Map(
      items.map((item) => [
        item.readinessCriterionKey,
        item.status === 'COMPLETED',
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
