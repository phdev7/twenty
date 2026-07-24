import { defineView, ViewSortDirection, ViewType } from 'twenty-sdk/define';

import {
  INBOX_TEAM_FIELD_IDS,
  INBOX_TEAMS_VIEW_UNIVERSAL_IDENTIFIER,
  INBOX_TEAM_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-team.constants';

export default defineView({
  universalIdentifier: INBOX_TEAMS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Equipes da inbox',
  objectUniversalIdentifier: INBOX_TEAM_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconUsersGroup',
  position: 0,
  fields: [
    {
      universalIdentifier: 'd1e0f710-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier: INBOX_TEAM_FIELD_IDS.name,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'd1e0f710-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier: INBOX_TEAM_FIELD_IDS.key,
      position: 1,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: 'd1e0f710-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier: INBOX_TEAM_FIELD_IDS.description,
      position: 2,
      isVisible: true,
      size: 300,
    },
    {
      universalIdentifier: 'd1e0f710-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier: INBOX_TEAM_FIELD_IDS.routingStrategy,
      position: 3,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'd1e0f710-0000-4000-8000-000000000005',
      fieldMetadataUniversalIdentifier:
        INBOX_TEAM_FIELD_IDS.defaultResponseSlaMinutes,
      position: 4,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd1e0f710-0000-4000-8000-000000000006',
      fieldMetadataUniversalIdentifier: INBOX_TEAM_FIELD_IDS.isDefault,
      position: 5,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: 'd1e0f710-0000-4000-8000-000000000007',
      fieldMetadataUniversalIdentifier: INBOX_TEAM_FIELD_IDS.status,
      position: 6,
      isVisible: true,
      size: 100,
    },
  ],
  sorts: [
    {
      universalIdentifier: 'd1e0f720-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier: INBOX_TEAM_FIELD_IDS.name,
      direction: ViewSortDirection.ASC,
    },
  ],
});
