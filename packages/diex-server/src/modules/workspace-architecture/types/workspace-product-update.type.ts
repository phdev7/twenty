import { type WorkspaceReadinessCriterion } from 'src/modules/workspace-architecture/types/workspace-readiness-pack';

export type WorkspaceProductUpdateContextField =
  | 'toneOfVoice'
  | 'commercialRules'
  | 'objectionPlaybook'
  | 'competitiveLandscape'
  | 'forbiddenClaims';

export type WorkspaceProductUpdateImportance =
  | 'REQUIRED'
  | 'RECOMMENDED'
  | 'INFORMATIONAL';

export type WorkspaceProductUpdateDefinition = {
  key: string;
  version: string;
  title: string;
  summary: string;
  revenueImpact: string;
  releasedAt: string;
  importance: WorkspaceProductUpdateImportance;
  blocksReadiness: boolean;
  readinessWeight: number;
  actionLabel: string;
  actionRoute: string;
  completion:
    | {
        kind: 'CONTEXT_FIELDS';
        requiresAdminConfirmation: boolean;
        fields: Array<{
          key: WorkspaceProductUpdateContextField;
          label: string;
        }>;
      }
    | { kind: 'ACKNOWLEDGEMENT' };
};

export type WorkspaceProductUpdateAcknowledgement = {
  key: string;
  version: string;
  acknowledgedAt: string;
  acknowledgedByUserWorkspaceId: string | null;
};

export type WorkspaceProductUpdateItem = Omit<
  WorkspaceProductUpdateDefinition,
  'completion'
> & {
  status: 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED';
  isUpdateForExistingWorkspace: boolean;
  missingFields: Array<{
    key: WorkspaceProductUpdateContextField;
    label: string;
  }>;
  acknowledgedAt: string | null;
  completionKind: WorkspaceProductUpdateDefinition['completion']['kind'];
  needsAdminConfirmation: boolean;
  canAdminConfirm: boolean;
  readinessCriterionKey: string;
};

export type WorkspaceProductUpdatesState = {
  registryVersion: string;
  pendingCount: number;
  blockingPendingCount: number;
  adminNoticeCount: number;
  items: WorkspaceProductUpdateItem[];
};

export type WorkspaceProductUpdateEvaluation = {
  state: WorkspaceProductUpdatesState;
  readinessCriteria: WorkspaceReadinessCriterion[];
  readinessByCriterionKey: Map<string, boolean>;
  evidenceRecordIdByCriterionKey: Map<string, string | null>;
};
