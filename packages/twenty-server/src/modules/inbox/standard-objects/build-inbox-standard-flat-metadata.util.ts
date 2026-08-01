import { msg } from '@lingui/core/macro';
import {
  TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
  type ObjectManifest,
} from 'twenty-shared/application';
import {
  DateDisplayFormat,
  FieldMetadataType,
  type FieldMetadataType as FieldMetadataTypeValue,
} from 'twenty-shared/types';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';

import { fromFieldManifestToUniversalFlatFieldMetadata } from 'src/engine/core-modules/application/application-manifest/converters/from-field-manifest-to-universal-flat-field-metadata.util';
import { fromObjectManifestToUniversalFlatObjectMetadata } from 'src/engine/core-modules/application/application-manifest/converters/from-object-manifest-to-universal-flat-object-metadata.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import { type AllStandardObjectName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-name.type';
import {
  type CreateStandardFieldArgs,
  createStandardFieldFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';
import { type StandardObjectMetadataRelatedEntityIds } from 'src/engine/workspace-manager/twenty-standard-application/utils/get-standard-object-metadata-related-entity-ids.util';
import { type CreateStandardObjectArgs } from 'src/engine/workspace-manager/twenty-standard-application/utils/object-metadata/create-standard-object-flat-metadata.util';
import { buildInboxStandardRelationFlatFieldMetadatas } from 'src/modules/inbox/standard-objects/build-inbox-standard-flat-relation-metadata.util';

const INBOX_SYSTEM_FIELD_CONTEXTS: CreateStandardFieldArgs<
  AllStandardObjectName,
  FieldMetadataTypeValue
>['context'][] = [
  {
    fieldName: 'id',
    type: FieldMetadataType.UUID,
    label: i18nLabel(msg`Id`),
    description: i18nLabel(msg`Id`),
    icon: 'Icon123',
    isSystem: true,
    isNullable: false,
    isUIEditable: false,
    defaultValue: 'uuid',
  },
  {
    fieldName: 'createdAt',
    type: FieldMetadataType.DATE_TIME,
    label: i18nLabel(msg`Creation date`),
    description: i18nLabel(msg`Creation date`),
    icon: 'IconCalendar',
    isSystem: true,
    isNullable: false,
    isUIEditable: false,
    defaultValue: 'now',
    settings: { displayFormat: DateDisplayFormat.RELATIVE },
  },
  {
    fieldName: 'updatedAt',
    type: FieldMetadataType.DATE_TIME,
    label: i18nLabel(msg`Last update`),
    description: i18nLabel(msg`Last time the record was changed`),
    icon: 'IconCalendarClock',
    isSystem: true,
    isNullable: false,
    isUIEditable: false,
    defaultValue: 'now',
    settings: { displayFormat: DateDisplayFormat.RELATIVE },
  },
  {
    fieldName: 'deletedAt',
    type: FieldMetadataType.DATE_TIME,
    label: i18nLabel(msg`Deleted at`),
    description: i18nLabel(msg`Date when the record was deleted`),
    icon: 'IconCalendarMinus',
    isSystem: true,
    isNullable: true,
    isUIEditable: false,
    settings: { displayFormat: DateDisplayFormat.RELATIVE },
  },
  {
    fieldName: 'createdBy',
    type: FieldMetadataType.ACTOR,
    label: i18nLabel(msg`Created by`),
    description: i18nLabel(msg`The creator of the record`),
    icon: 'IconCreativeCommonsSa',
    isSystem: true,
    isNullable: false,
    isUIEditable: false,
    defaultValue: {
      source: "'MANUAL'",
      name: "'System'",
      workspaceMemberId: null,
    },
  },
  {
    fieldName: 'updatedBy',
    type: FieldMetadataType.ACTOR,
    label: i18nLabel(msg`Updated by`),
    description: i18nLabel(
      msg`The workspace member who last updated the record`,
    ),
    icon: 'IconUserCircle',
    isSystem: true,
    isNullable: false,
    isUIEditable: false,
    defaultValue: {
      source: "'MANUAL'",
      name: "'System'",
      workspaceMemberId: null,
    },
  },
  {
    fieldName: 'position',
    type: FieldMetadataType.POSITION,
    label: i18nLabel(msg`Position`),
    description: i18nLabel(msg`Inbox record position`),
    icon: 'IconHierarchy2',
    isSystem: true,
    isNullable: false,
    defaultValue: 0,
  },
  {
    fieldName: 'searchVector',
    type: FieldMetadataType.TS_VECTOR,
    label: i18nLabel(msg`Search vector`),
    description: i18nLabel(msg`Field used for full-text search`),
    icon: 'IconUser',
    isSystem: true,
    isNullable: true,
  },
];

type InboxObjectManifest<O extends AllStandardObjectName> = ObjectManifest & {
  nameSingular: O;
};

const getStandardObjectName = <O extends AllStandardObjectName>(
  objectDefinition: InboxObjectManifest<O>,
): O => objectDefinition.nameSingular;

const getInboxStandardObjectFieldMetadataId = <
  O extends AllStandardObjectName,
>({
  fieldName,
  objectName,
  standardObjectMetadataRelatedEntityIds,
}: {
  fieldName: string;
  objectName: O;
  standardObjectMetadataRelatedEntityIds: StandardObjectMetadataRelatedEntityIds;
}): string => {
  const fieldMetadata = (
    standardObjectMetadataRelatedEntityIds[objectName].fields as Record<
      string,
      { id: string }
    >
  )[fieldName];

  if (!fieldMetadata) {
    throw new Error(
      `Inbox object ${objectName} does not define the ${fieldName} field`,
    );
  }

  return fieldMetadata.id;
};

export const buildInboxStandardSystemFlatFieldMetadatas = <
  O extends AllStandardObjectName,
>(
  args: Omit<CreateStandardFieldArgs<O, FieldMetadataTypeValue>, 'context'>,
): Record<AllStandardObjectFieldName<O>, FlatFieldMetadata> =>
  Object.fromEntries(
    INBOX_SYSTEM_FIELD_CONTEXTS.map((context) => [
      context.fieldName,
      createStandardFieldFlatMetadata({
        ...args,
        context: context as CreateStandardFieldArgs<
          O,
          FieldMetadataTypeValue
        >['context'],
      }),
    ]),
  ) as Record<AllStandardObjectFieldName<O>, FlatFieldMetadata>;

export const buildInboxStandardObjectFlatMetadata = <
  O extends AllStandardObjectName,
>({
  objectDefinition,
  now,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  twentyStandardApplicationId,
}: Omit<CreateStandardObjectArgs<O>, 'context' | 'objectName'> & {
  objectDefinition: InboxObjectManifest<O>;
}): FlatObjectMetadata => {
  const objectName = getStandardObjectName(objectDefinition);
  const universalObjectMetadata =
    fromObjectManifestToUniversalFlatObjectMetadata({
      objectManifest: objectDefinition,
      applicationUniversalIdentifier:
        TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
      now,
    });
  const labelField = objectDefinition.fields.find(
    (field) =>
      field.universalIdentifier ===
      objectDefinition.labelIdentifierFieldMetadataUniversalIdentifier,
  );

  if (!labelField) {
    throw new Error(
      `Inbox object ${objectDefinition.nameSingular} has no label field`,
    );
  }

  return {
    ...universalObjectMetadata,
    id: standardObjectMetadataRelatedEntityIds[objectName].id,
    applicationId: twentyStandardApplicationId,
    workspaceId,
    labelIdentifierFieldMetadataId: getInboxStandardObjectFieldMetadataId({
      fieldName: labelField.name,
      objectName,
      standardObjectMetadataRelatedEntityIds,
    }),
    imageIdentifierFieldMetadataId: null,
    fieldIds: [],
    indexMetadataIds: [],
    searchFieldMetadataIds: [],
    objectPermissionIds: [],
    fieldPermissionIds: [],
    viewIds: [],
  };
};

export const buildInboxStandardObjectFlatFieldMetadatas = <
  O extends AllStandardObjectName,
>({
  objectDefinition,
  now,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<O, FieldMetadataTypeValue>,
  'context' | 'objectName'
> & {
  objectDefinition: InboxObjectManifest<O>;
}): Record<AllStandardObjectFieldName<O>, FlatFieldMetadata> => {
  const objectName = getStandardObjectName(objectDefinition);

  const flatFieldMetadatas = Object.fromEntries(
    objectDefinition.fields.map((field) => {
      const universalFieldMetadata =
        fromFieldManifestToUniversalFlatFieldMetadata({
          fieldManifest: {
            ...field,
            objectUniversalIdentifier: objectDefinition.universalIdentifier,
          },
          applicationUniversalIdentifier:
            TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
          now,
        });

      return [
        field.name,
        {
          ...universalFieldMetadata,
          id: getInboxStandardObjectFieldMetadataId({
            fieldName: field.name,
            objectName,
            standardObjectMetadataRelatedEntityIds,
          }),
          applicationId: twentyStandardApplicationId,
          workspaceId,
          objectMetadataId:
            standardObjectMetadataRelatedEntityIds[objectName].id,
          settings: universalFieldMetadata.universalSettings,
          relationTargetFieldMetadataId: null,
          relationTargetObjectMetadataId: null,
          viewFieldIds: [],
          viewFilterIds: [],
          fieldPermissionIds: [],
          kanbanAggregateOperationViewIds: [],
          calendarViewIds: [],
          calendarEndViewIds: [],
          mainGroupByFieldMetadataViewIds: [],
          viewSortIds: [],
          searchFieldMetadataIds: [],
        } satisfies FlatFieldMetadata,
      ];
    }),
  ) satisfies Record<string, FlatFieldMetadata>;

  const allFlatFieldMetadatas = {
    ...flatFieldMetadatas,
    ...buildInboxStandardRelationFlatFieldMetadatas({
      objectName,
      now,
      workspaceId,
      standardObjectMetadataRelatedEntityIds,
      dependencyFlatEntityMaps,
      twentyStandardApplicationId,
    }),
  };

  const systemFieldNames = new Set<string>(
    INBOX_SYSTEM_FIELD_CONTEXTS.map(({ fieldName }) => fieldName),
  );
  const missingFieldNames = Object.keys(STANDARD_OBJECTS[objectName].fields)
    .filter((fieldName) => !systemFieldNames.has(fieldName))
    .filter((fieldName) => !(fieldName in allFlatFieldMetadatas));

  if (missingFieldNames.length > 0) {
    throw new Error(
      `Inbox object ${objectName} is missing standard fields: ${missingFieldNames.join(', ')}`,
    );
  }

  return allFlatFieldMetadatas as unknown as Record<
    AllStandardObjectFieldName<O>,
    FlatFieldMetadata
  >;
};
