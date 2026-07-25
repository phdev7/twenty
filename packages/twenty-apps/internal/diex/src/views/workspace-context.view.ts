import { defineView, ViewType } from 'twenty-sdk/define';

import {
  WORKSPACE_CONTEXT_BUSINESS_FIELD_UNIVERSAL_IDENTIFIER,
  WORKSPACE_CONTEXT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  WORKSPACE_CONTEXT_REVIEWED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  WORKSPACE_CONTEXT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  WORKSPACE_CONTEXT_UNIVERSAL_IDENTIFIER,
} from 'src/objects/workspace-context.object';

export const WORKSPACE_CONTEXT_VIEW_UNIVERSAL_IDENTIFIER =
  'd1e07000-0000-4000-8000-000000000012';

export default defineView({
  universalIdentifier: WORKSPACE_CONTEXT_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Contexto do workspace',
  objectUniversalIdentifier: WORKSPACE_CONTEXT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconBook2',
  position: 0,
  fields: [
    {
      universalIdentifier: 'd1e07710-0000-4000-8000-000000000001',
      fieldMetadataUniversalIdentifier:
        WORKSPACE_CONTEXT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'd1e07710-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier:
        WORKSPACE_CONTEXT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'd1e07710-0000-4000-8000-000000000003',
      fieldMetadataUniversalIdentifier:
        WORKSPACE_CONTEXT_BUSINESS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 360,
    },
    {
      universalIdentifier: 'd1e07710-0000-4000-8000-000000000004',
      fieldMetadataUniversalIdentifier:
        WORKSPACE_CONTEXT_REVIEWED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 150,
    },
  ],
});
