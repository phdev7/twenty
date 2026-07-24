import { defineView, ViewSortDirection, ViewType } from 'twenty-sdk/define';

import {
  INBOX_AUTOMATIONS_VIEW_UNIVERSAL_IDENTIFIER,
  INBOX_AUTOMATION_FIELD_IDS,
  INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-automation.constants';

export default defineView({
  universalIdentifier: INBOX_AUTOMATIONS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Automações da inbox',
  objectUniversalIdentifier: INBOX_AUTOMATION_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconSettingsAutomation',
  position: 0,
  fields: [
    {
      universalIdentifier: 'd1e0fd41-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier: INBOX_AUTOMATION_FIELD_IDS.name,
      position: 0,
      isVisible: true,
      size: 190,
    },
    {
      universalIdentifier: 'd1e0fd41-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier: INBOX_AUTOMATION_FIELD_IDS.status,
      position: 1,
      isVisible: true,
      size: 90,
    },
    {
      universalIdentifier: 'd1e0fd41-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier: INBOX_AUTOMATION_FIELD_IDS.trigger,
      position: 2,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'd1e0fd41-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier: INBOX_AUTOMATION_FIELD_IDS.channel,
      position: 3,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: 'd1e0fd41-0000-4000-8000-000000000005',
      fieldMetadataUniversalIdentifier: INBOX_AUTOMATION_FIELD_IDS.keywords,
      position: 4,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e0fd41-0000-4000-8000-000000000006',
      fieldMetadataUniversalIdentifier: INBOX_AUTOMATION_FIELD_IDS.crmCondition,
      position: 5,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e0fd41-0000-4000-8000-000000000007',
      fieldMetadataUniversalIdentifier:
        INBOX_AUTOMATION_FIELD_IDS.targetPriority,
      position: 6,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'd1e0fd41-0000-4000-8000-000000000008',
      fieldMetadataUniversalIdentifier: INBOX_AUTOMATION_FIELD_IDS.team,
      position: 7,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e0fd41-0000-4000-8000-000000000009',
      fieldMetadataUniversalIdentifier: INBOX_AUTOMATION_FIELD_IDS.assignee,
      position: 8,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'd1e0fd41-0000-4000-8000-00000000000a',
      fieldMetadataUniversalIdentifier: INBOX_AUTOMATION_FIELD_IDS.label,
      position: 9,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e0fd41-0000-4000-8000-00000000000b',
      fieldMetadataUniversalIdentifier:
        INBOX_AUTOMATION_FIELD_IDS.taskTitleTemplate,
      position: 10,
      isVisible: true,
      size: 210,
    },
    {
      universalIdentifier: 'd1e0fd41-0000-4000-8000-00000000000c',
      fieldMetadataUniversalIdentifier: INBOX_AUTOMATION_FIELD_IDS.runCount,
      position: 11,
      isVisible: true,
      size: 90,
    },
    {
      universalIdentifier: 'd1e0fd41-0000-4000-8000-00000000000d',
      fieldMetadataUniversalIdentifier: INBOX_AUTOMATION_FIELD_IDS.lastRunAt,
      position: 12,
      isVisible: true,
      size: 150,
    },
  ],
  sorts: [
    {
      universalIdentifier: 'd1e0fd42-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier: INBOX_AUTOMATION_FIELD_IDS.position,
      direction: ViewSortDirection.ASC,
    },
  ],
});
