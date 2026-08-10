import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { addFlatEntityToFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/add-flat-entity-to-flat-entity-maps-or-throw.util';
import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import { STANDARD_OBJECTS } from 'diex-shared/metadata';
import { ViewOpenRecordIn, ViewVisibility } from 'diex-shared/types';
import { DIEX_STANDARD_APPLICATION } from 'src/engine/workspace-manager/diex-standard-application/constants/diex-standard-applications';
import { STANDARD_DIEX_VIEWS } from 'src/engine/workspace-manager/diex-standard-application/constants/standard-diex-view.constant';
import { type AllStandardObjectName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-name.type';
import { computeStandardAttachmentViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-attachment-views.util';
import { computeStandardBlocklistViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-blocklist-views.util';
import { computeStandardCalendarChannelEventAssociationViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-calendar-channel-event-association-views.util';
import { computeStandardCalendarEventParticipantViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-calendar-event-participant-views.util';
import { computeStandardCalendarEventViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-calendar-event-views.util';
import { computeStandardCallRecordingViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-call-recording-views.util';
import { computeStandardCompanyViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-company-views.util';
import { computeStandardDashboardViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-dashboard-views.util';
import { computeStandardMessageCampaignViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-message-campaign-views.util';
import { computeStandardMessageChannelMessageAssociationMessageFolderViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-message-channel-message-association-message-folder-views.util';
import { computeStandardMessageChannelMessageAssociationViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-message-channel-message-association-views.util';
import { computeStandardMessageListViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-message-list-views.util';
import { computeStandardMessageParticipantViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-message-participant-views.util';
import { computeStandardMessageThreadViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-message-thread-views.util';
import { computeStandardMessageViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-message-views.util';
import { computeStandardNoteTargetViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-note-target-views.util';
import { computeStandardNoteViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-note-views.util';
import { computeStandardOpportunityViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-opportunity-views.util';
import { computeStandardPersonViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-person-views.util';
import { computeStandardTaskTargetViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-task-target-views.util';
import { computeStandardTaskViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-task-views.util';
import { computeStandardTimelineActivityViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-timeline-activity-views.util';
import { computeStandardWorkflowAutomatedTriggerViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-workflow-automated-trigger-views.util';
import { computeStandardWorkflowRunViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-workflow-run-views.util';
import { computeStandardWorkflowVersionViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-workflow-version-views.util';
import { computeStandardWorkflowViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-workflow-views.util';
import { computeStandardWorkspaceMemberViews } from 'src/engine/workspace-manager/diex-standard-application/utils/view/compute-standard-workspace-member-views.util';
import { type CreateStandardViewArgs } from 'src/engine/workspace-manager/diex-standard-application/utils/view/create-standard-view-flat-metadata.util';

type StandardViewBuilder<P extends AllStandardObjectName> = (
  args: Omit<CreateStandardViewArgs<P>, 'context'>,
) => Record<string, FlatView>;

const STANDARD_FLAT_VIEW_METADATA_BUILDERS_BY_OBJECT_NAME = {
  attachment: computeStandardAttachmentViews,
  blocklist: computeStandardBlocklistViews,
  calendarChannelEventAssociation:
    computeStandardCalendarChannelEventAssociationViews,
  calendarEvent: computeStandardCalendarEventViews,
  calendarEventParticipant: computeStandardCalendarEventParticipantViews,
  callRecording: computeStandardCallRecordingViews,
  company: computeStandardCompanyViews,
  dashboard: computeStandardDashboardViews,
  message: computeStandardMessageViews,
  messageCampaign: computeStandardMessageCampaignViews,
  messageChannelMessageAssociation:
    computeStandardMessageChannelMessageAssociationViews,
  messageChannelMessageAssociationMessageFolder:
    computeStandardMessageChannelMessageAssociationMessageFolderViews,
  messageList: computeStandardMessageListViews,
  messageParticipant: computeStandardMessageParticipantViews,
  messageThread: computeStandardMessageThreadViews,
  note: computeStandardNoteViews,
  noteTarget: computeStandardNoteTargetViews,
  opportunity: computeStandardOpportunityViews,
  person: computeStandardPersonViews,
  task: computeStandardTaskViews,
  taskTarget: computeStandardTaskTargetViews,
  timelineActivity: computeStandardTimelineActivityViews,
  workflow: computeStandardWorkflowViews,
  workflowAutomatedTrigger: computeStandardWorkflowAutomatedTriggerViews,
  workflowRun: computeStandardWorkflowRunViews,
  workflowVersion: computeStandardWorkflowVersionViews,
  workspaceMember: computeStandardWorkspaceMemberViews,
} as const satisfies {
  [P in AllStandardObjectName]?: StandardViewBuilder<P>;
};

export type BuildStandardFlatViewMetadataMapsArgs = Omit<
  CreateStandardViewArgs,
  'context' | 'objectName'
>;

const createStandardDiexViewFlatMetadata = ({
  args,
  view,
}: {
  args: BuildStandardFlatViewMetadataMapsArgs;
  view: (typeof STANDARD_DIEX_VIEWS)[number];
}): FlatView => {
  const objectName = view.objectName as keyof typeof STANDARD_OBJECTS;
  const objectDefinition = STANDARD_OBJECTS[objectName] as {
    universalIdentifier: string;
    fields: Record<string, { universalIdentifier: string }>;
  };
  const relatedIds = args.standardObjectMetadataRelatedEntityIds[
    objectName as keyof typeof args.standardObjectMetadataRelatedEntityIds
  ] as {
    id: string;
    fields: Record<string, { id: string }>;
    views: Record<string, { id: string }>;
  };
  const mainGroupByFieldMetadataUniversalIdentifier = view.mainGroupByFieldName
    ? objectDefinition.fields[view.mainGroupByFieldName]?.universalIdentifier
    : null;

  if (!relatedIds?.views?.[view.viewName]) {
    throw new Error(
      `Missing related ids for standard Diex view ${view.objectName}.${view.viewName}`,
    );
  }

  return {
    id: relatedIds.views[view.viewName].id,
    universalIdentifier: view.universalIdentifier,
    applicationId: args.diexStandardApplicationId,
    applicationUniversalIdentifier:
      DIEX_STANDARD_APPLICATION.universalIdentifier,
    workspaceId: args.workspaceId,
    objectMetadataId: relatedIds.id,
    objectMetadataUniversalIdentifier: objectDefinition.universalIdentifier,
    name: view.name,
    type: view.type,
    key: view.key,
    icon: view.icon,
    position: view.position,
    isCompact: false,
    isCustom: false,
    openRecordIn: ViewOpenRecordIn.SIDE_PANEL,
    kanbanAggregateOperation: null,
    kanbanAggregateOperationFieldMetadataId: null,
    kanbanAggregateOperationFieldMetadataUniversalIdentifier: null,
    mainGroupByFieldMetadataId: view.mainGroupByFieldName
      ? (relatedIds.fields[view.mainGroupByFieldName]?.id ?? null)
      : null,
    mainGroupByFieldMetadataUniversalIdentifier,
    shouldHideEmptyGroups: false,
    kanbanColumnWidth: null,
    calendarLayout: null,
    calendarFieldMetadataId: null,
    calendarFieldMetadataUniversalIdentifier: null,
    calendarEndFieldMetadataId: null,
    calendarEndFieldMetadataUniversalIdentifier: null,
    anyFieldFilterValue: null,
    visibility: ViewVisibility.WORKSPACE,
    createdByUserWorkspaceId: null,
    isActive: true,
    isSystemSideEffect: false,
    overrides: null,
    universalOverrides: null,
    viewFieldIds: [],
    viewFieldUniversalIdentifiers: [],
    viewFieldGroupIds: [],
    viewFieldGroupUniversalIdentifiers: [],
    viewFilterIds: [],
    viewFilterUniversalIdentifiers: [],
    viewGroupIds: [],
    viewGroupUniversalIdentifiers: [],
    viewFilterGroupIds: [],
    viewFilterGroupUniversalIdentifiers: [],
    viewSortIds: [],
    viewSortUniversalIdentifiers: [],
    createdAt: args.now,
    updatedAt: args.now,
    deletedAt: null,
  };
};

export const buildStandardFlatViewMetadataMaps = (
  args: BuildStandardFlatViewMetadataMapsArgs,
): FlatEntityMaps<FlatView> => {
  const standardViewMetadatas: FlatView[] = (
    Object.keys(
      STANDARD_FLAT_VIEW_METADATA_BUILDERS_BY_OBJECT_NAME,
    ) as (keyof typeof STANDARD_FLAT_VIEW_METADATA_BUILDERS_BY_OBJECT_NAME)[]
  ).flatMap((objectName) => {
    const builder: StandardViewBuilder<typeof objectName> =
      STANDARD_FLAT_VIEW_METADATA_BUILDERS_BY_OBJECT_NAME[objectName];

    const result = builder({
      ...args,
      objectName,
    });

    return Object.values(result);
  });

  const diexViewMetadatas = STANDARD_DIEX_VIEWS.map((view) =>
    createStandardDiexViewFlatMetadata({ args, view }),
  );

  const allViewMetadatas = [...standardViewMetadatas, ...diexViewMetadatas];

  let flatViewMaps = createEmptyFlatEntityMaps();

  for (const viewMetadata of allViewMetadatas) {
    flatViewMaps = addFlatEntityToFlatEntityMapsOrThrow({
      flatEntity: viewMetadata,
      flatEntityMaps: flatViewMaps,
    });
  }

  return flatViewMaps;
};
