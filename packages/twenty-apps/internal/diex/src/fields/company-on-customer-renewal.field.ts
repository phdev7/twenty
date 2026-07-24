import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER } from 'src/objects/customer-renewal.object';

export const COMPANY_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14600-0000-4000-8000-000000000003';
export const CUSTOMER_RENEWALS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14600-0000-4000-8000-000000000004';

export default defineField({
  universalIdentifier: COMPANY_ON_CUSTOMER_RENEWAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'company',
  label: 'Empresa',
  icon: 'IconBuilding',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    CUSTOMER_RENEWALS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'companyId',
  },
});
