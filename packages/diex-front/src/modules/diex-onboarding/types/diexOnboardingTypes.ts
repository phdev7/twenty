export type ContextFieldKey =
  | 'businessDescription'
  | 'idealCustomerProfile'
  | 'toneOfVoice'
  | 'commercialRules'
  | 'objectionPlaybook'
  | 'competitiveLandscape'
  | 'forbiddenClaims';

export type RichTextValue = { markdown?: string | null } | null;

export type WorkspaceContextDraft = Record<ContextFieldKey, string>;

export type WorkspaceContextRecord = {
  id: string;
  name: string | null;
  status: string | null;
  reviewedAt: string | null;
} & Record<ContextFieldKey, RichTextValue>;

export type WorkspaceContextReadState =
  | 'LOADING'
  | 'ABSENT'
  | 'READY'
  | 'READ_ERROR'
  | 'RECONCILIATION_ERROR';

export type ContextField = {
  key: ContextFieldKey;
  label: string;
  hint: string;
  // Agents read the context only once it is ACTIVE, and activating it with
  // nothing written would be worse than leaving it off. These three are the
  // ones that stop every generated line from sounding like a generic vendor.
  isRequiredForActivation: boolean;
  isFilled: boolean;
};

export type DataFlowSummary = {
  conversationCount: number;
  messageCount: number;
  peopleCount: number;
  opportunityCount: number;
  taskCount: number;
  offerCount: number;
  activeOfferCount: number;
  draftOfferCount: number;
  offers: OnboardingOfferSummary[];
  isLoading: boolean;
  unconfirmedSources: Array<
    | 'conversations'
    | 'messages'
    | 'people'
    | 'opportunities'
    | 'tasks'
    | 'offers'
  >;
  errorMessage: string | null;
};

export type OnboardingOfferSummary = {
  id: string;
  name: string | null;
  status: string | null;
  valueProposition: RichTextValue;
};

export type DiexReadinessItem = {
  key: string;
  label: string;
  ready: boolean;
  required: boolean;
  weight?: number;
};

export type DiexReadinessTrack = {
  key: string;
  label: string;
  ready: boolean;
  score: number;
  selected: boolean;
  items: DiexReadinessItem[];
};

export type DiexOnboardingJourney = {
  phase:
    | 'DISCOVERY_REVIEW'
    | 'ARCHITECTURE_APPROVAL'
    | 'CHANNEL_CONNECTION'
    | 'FIRST_REVENUE_FLOW'
    | 'TEAM_ENABLEMENT'
    | 'COCKPIT_OPERATIONAL'
    | 'READY'
    | 'SELLING_READY';
  phaseIndex: number;
  completedPhases: string[];
  blockers: string[];
  nextAction: string;
  startedAt: string;
  lastTransitionAt: string;
  completedAt: string | null;
  transitions: Array<{
    from: string | null;
    to: string;
    occurredAt: string;
    reason: string;
  }>;
};

export type DiexCommercialReadiness = {
  ready: boolean;
  score: number;
  items: DiexReadinessItem[];
  tracks?: DiexReadinessTrack[];
  nextAction: string;
  onboardingJourney?: DiexOnboardingJourney;
  goal: string | null;
  readinessPack?: {
    version: string;
    goal: string | null;
    primaryChannel: string | null;
    operationLabel: string;
    readyLabel: string;
    selectedTemplateIds: string[];
    criteria: Array<
      DiexReadinessItem & {
        phase: string;
        source: string;
        firstValue: boolean;
        nextAction: string;
        sourceTemplateIds: string[];
      }
    >;
  };
  firstValueRun?: {
    id: string;
    correlationId: string;
    goal: string | null;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    startedAt: string;
    completedAt: string | null;
    steps: Array<{
      key: string;
      label: string;
      ready: boolean;
      recordId: string | null;
      source: string;
      occurredAt: string | null;
    }>;
  };
  counts: {
    activeOffers: number;
    activeOwners: number;
    conversations: number;
    opportunities: number;
    followUps: number;
  };
  dashboard: {
    pipelineValueMicros: number;
    pipelineCurrencyCode: string;
    pipelineValues?: Array<{
      amountMicros: number;
      currencyCode: string;
    }>;
    unassignedOpportunities: number;
    overdueFollowUps: number;
    unansweredLeads: number;
    averageResponseMinutes: number | null;
    nextActions: number;
    commercialRisks: number;
  };
  evidence: {
    firstConversationId: string | null;
    firstCompanyLinked: boolean;
    firstOpportunityId: string | null;
    firstFollowUpCreated: boolean;
    firstAiTriageCompleted: boolean;
    whatsappValidatedByMessage: boolean;
    primaryChannel: string | null;
    channelValidation?: {
      status: string;
      source: string;
    };
    channelHealth?: {
      provider: 'WHATSAPP';
      state:
        | 'CONNECTED'
        | 'AWAITING_SCAN'
        | 'CONNECTING'
        | 'NOT_PROVISIONED'
        | 'UNAVAILABLE'
        | 'UNKNOWN';
      instanceName: string | null;
      lastCheckedAt: string | null;
      validatedAt: string | null;
      lastError: string | null;
    };
  };
  activation?: {
    completedCount: number;
    totalCount: number;
    score: number;
    firstValueAt: string | null;
    blockers: string[];
  };
  milestones?: Array<{
    key: string;
    ready: boolean;
    recordId: string | null;
  }>;
  evidenceLedger?: {
    version: number;
    lastReconciledAt: string;
    events: Array<{
      id: string;
      key: string;
      ready: boolean;
      recordId: string | null;
      source: string;
      occurredAt: string;
      details: Record<string, unknown>;
    }>;
  };
  adaptiveReview?: {
    status: 'REVIEW_REQUIRED' | 'ADJUSTMENT_RECOMMENDED' | 'ALIGNED';
    blueprintVersion: number | null;
    pageCatalogVersion: number;
    drift: Array<{
      key: string;
      severity: 'INFO' | 'WARNING' | 'BLOCKED';
      message: string;
      action: string;
    }>;
    nextReview: string;
  };
  architecture: {
    profileStatus: string | null;
    blueprintStatus: string | null;
    changeSetStatus: string | null;
    operationManifestVersion: number | null;
    publication?: {
      nativeOperationCount: number;
      manifestOperationCount: number;
      pendingNativeMaterialization: boolean;
      pendingNativeResourceTypes?: string[];
      materializedAdapters: string[];
    } | null;
  };
  dataFreshness?: {
    status: 'LIVE' | 'PARTIAL' | 'UNAVAILABLE';
    queriedAt: string;
    source: string;
  };
};

export type DiexPrimaryChannel =
  | 'WHATSAPP'
  | 'EMAIL'
  | 'IMPORT'
  | 'MANUAL'
  | 'LATER';

export type DiexArchitectureArtifact = {
  id: string;
  status: string;
  version: number;
  name: string;
  summary: RichTextValue;
  payload: Record<string, unknown>;
};

export type DiexArchitectureState = {
  profile: DiexArchitectureArtifact | null;
  blueprint: DiexArchitectureArtifact | null;
  changeSet: DiexArchitectureArtifact | null;
  pageCatalog?: DiexPageCatalogState;
};

export type DiexPageRenderer =
  | 'INBOX'
  | 'DASHBOARD'
  | 'PIPELINE'
  | 'CALENDAR'
  | 'OPERATIONS'
  | 'CUSTOM';

export type DiexPageCatalogItem = {
  key: string;
  label: string;
  description: string;
  route: string;
  nativeRoute: string | null;
  renderer: DiexPageRenderer;
  icon: string;
  navigationGroup: string;
  capabilities: string[];
  blocks: DiexPageBlock[];
  lifecycle: 'CORE' | 'RECOMMENDED' | 'CUSTOM';
  copyOrigin?: 'PROFILE' | 'USER' | 'AI';
  status: 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';
  sourceTemplateIds: string[];
  primaryAction: string;
  dataSources: string[];
  dataContracts?: Array<{
    key: string;
    source: string;
    kind: string;
    objectName: string | null;
    objectMetadataId?: string | null;
    fieldNames: string[];
    required: boolean;
    fallback: string;
  }>;
  capabilityContract?: {
    version: string;
    key: string;
    dependencies: string[];
    fallbackRoute: string;
  } | null;
  actions?: Array<{
    key: string;
    label: string;
    route: string;
    confirmationRequired: boolean;
    requiresApproval: boolean;
    requiredPermission: string;
  }>;
  emptyState: {
    title: string;
    description: string;
    actionLabel: string;
    actionRoute: string;
  };
  permissions: string[];
  aiGenerated: boolean;
  editable: boolean;
  showInNavigation: boolean;
  position: number;
  createdAt: string;
};

export type DiexPageUpdateInput = {
  key: string;
  label?: string;
  description?: string;
  showInNavigation?: boolean;
  position?: number;
  renderer?: DiexPageRenderer;
  icon?: string;
  navigationGroup?: string;
  capabilities?: string[];
  dataSources?: string[];
  primaryAction?: string;
  blocks?: DiexPageBlock[];
};

export type DiexPageBlock = {
  key: string;
  label: string;
  type:
    | 'KPI'
    | 'LIST'
    | 'PIPELINE'
    | 'INBOX'
    | 'CALENDAR'
    | 'TIMELINE'
    | 'CHECKLIST'
    | 'AI_SUMMARY';
  title: string;
  description: string;
  dataSources: string[];
  dataContracts?: Array<{
    key: string;
    source: string;
    kind: string;
    objectName: string | null;
    objectMetadataId?: string | null;
    fieldNames: string[];
    required: boolean;
    fallback: string;
  }>;
  actions?: Array<{
    key: string;
    label: string;
    route: string;
    confirmationRequired: boolean;
    requiresApproval: boolean;
    requiredPermission: string;
  }>;
  actionLabel: string;
  actionRoute: string;
  sourceTemplateIds: string[];
  configuration: Record<string, unknown>;
  position: number;
};

export type DiexPageCatalogState = {
  version: number;
  blueprintVersion: number | null;
  profileVersion: number | null;
  navigationMode: 'ADAPTIVE';
  items: DiexPageCatalogItem[];
  updatedAt: string;
};

export type DiexPageDataSource = {
  contractKey: string;
  source: string;
  kind: string;
  objectName: string | null;
  records: Array<Record<string, unknown>>;
  count: number | null;
  returnedCount: number;
  totalCount: number | null;
  isPartial: boolean;
  queriedAt: string;
  sourceUpdatedAt: string | null;
  freshnessStatus: 'LIVE' | 'PARTIAL' | 'UNAVAILABLE' | 'NOT_APPLICABLE';
  fallback: string;
  error: string | null;
  dataClassification?:
    | 'PUBLIC_WORKSPACE'
    | 'INTERNAL'
    | 'CONFIDENTIAL'
    | 'SENSITIVE';
};

export type DiexPageDataState = {
  pageKey: string;
  contractVersion: string;
  generatedAt: string;
  isPartial: boolean;
  hasErrors: boolean;
  sources: DiexPageDataSource[];
};

export type DiexFirstCommercialFlowResult = {
  success: boolean;
  conversationId: string;
  opportunityId: string | null;
  taskId: string;
  assigneeId: string | null;
  companyLinked: boolean;
  nextAction: string;
};
