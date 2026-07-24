import { defineView, ViewSortDirection, ViewType } from 'twenty-sdk/define';

import {
  INBOX_TEAM_MEMBERS_VIEW_UNIVERSAL_IDENTIFIER,
  INBOX_TEAM_MEMBER_FIELD_IDS,
  INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-team.constants';

export default defineView({
  universalIdentifier: INBOX_TEAM_MEMBERS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Membros das equipes',
  objectUniversalIdentifier: INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconUserPlus',
  position: 0,
  fields: [
    {
      universalIdentifier: 'd1e0f810-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier: INBOX_TEAM_MEMBER_FIELD_IDS.name,
      position: 0,
      isVisible: true,
      size: 190,
    },
    {
      universalIdentifier: 'd1e0f810-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier: INBOX_TEAM_MEMBER_FIELD_IDS.team,
      position: 1,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'd1e0f810-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier:
        INBOX_TEAM_MEMBER_FIELD_IDS.workspaceMember,
      position: 2,
      isVisible: true,
      size: 190,
    },
    {
      universalIdentifier: 'd1e0f810-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier: INBOX_TEAM_MEMBER_FIELD_IDS.role,
      position: 3,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: 'd1e0f810-0000-4000-8000-000000000005',
      fieldMetadataUniversalIdentifier: INBOX_TEAM_MEMBER_FIELD_IDS.isActive,
      position: 4,
      isVisible: true,
      size: 90,
    },
    {
      universalIdentifier: 'd1e0f810-0000-4000-8000-000000000006',
      fieldMetadataUniversalIdentifier: INBOX_TEAM_MEMBER_FIELD_IDS.joinedAt,
      position: 5,
      isVisible: true,
      size: 150,
    },
  ],
  sorts: [
    {
      universalIdentifier: 'd1e0f820-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier: INBOX_TEAM_MEMBER_FIELD_IDS.name,
      direction: ViewSortDirection.ASC,
    },
  ],
});
