import { defineView, ViewType } from 'twenty-sdk/define';

import { ACCESS_REQUESTS_VIEW_UNIVERSAL_IDENTIFIER } from 'src/modules/access-requests/constants/access-request.constants';
import {
  ACCESS_REQUEST_CONTACT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  ACCESS_REQUEST_DESIRED_SUBDOMAIN_FIELD_UNIVERSAL_IDENTIFIER,
  ACCESS_REQUEST_EMAIL_FIELD_UNIVERSAL_IDENTIFIER,
  ACCESS_REQUEST_GOAL_FIELD_UNIVERSAL_IDENTIFIER,
  ACCESS_REQUEST_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  ACCESS_REQUEST_REQUESTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  ACCESS_REQUEST_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  ACCESS_REQUEST_UNIVERSAL_IDENTIFIER,
  ACCESS_REQUEST_WHATSAPP_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/modules/access-requests/objects/access-request.object';

export default defineView({
  universalIdentifier: ACCESS_REQUESTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Solicitações de acesso',
  objectUniversalIdentifier: ACCESS_REQUEST_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconUserQuestion',
  position: 0,
  fields: [
    {
      universalIdentifier: 'd1e17200-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier:
        ACCESS_REQUEST_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'd1e17200-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier:
        ACCESS_REQUEST_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'd1e17200-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier:
        ACCESS_REQUEST_WHATSAPP_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'd1e17200-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier:
        ACCESS_REQUEST_CONTACT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'd1e17200-0000-4000-8000-000000000005',
      fieldMetadataUniversalIdentifier:
        ACCESS_REQUEST_EMAIL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'd1e17200-0000-4000-8000-000000000006',
      fieldMetadataUniversalIdentifier:
        ACCESS_REQUEST_REQUESTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'd1e17200-0000-4000-8000-000000000007',
      fieldMetadataUniversalIdentifier:
        ACCESS_REQUEST_DESIRED_SUBDOMAIN_FIELD_UNIVERSAL_IDENTIFIER,
      position: 6,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'd1e17200-0000-4000-8000-000000000008',
      fieldMetadataUniversalIdentifier:
        ACCESS_REQUEST_GOAL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 7,
      isVisible: true,
      size: 320,
    },
  ],
});
