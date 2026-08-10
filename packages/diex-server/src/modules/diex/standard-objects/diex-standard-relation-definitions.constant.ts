import { type FieldManifest } from 'diex-shared/application';
import {
  FieldMetadataType,
  RelationOnDeleteAction,
  RelationType,
} from 'diex-shared/types';

import { DIEX_STANDARD_OBJECT_EXTENSION_RELATION_DEFINITIONS } from 'src/modules/diex/standard-objects/diex-standard-object-extension-relation-definitions.constant';

export const DIEX_STANDARD_RELATION_DEFINITIONS = [
  {
    universalIdentifier: 'd1e06000-0000-4000-8000-000000000032',
    objectUniversalIdentifier: 'd1e05000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'commercialSignal',
    label: 'Sinal comercial',
    icon: 'IconRadar',
    isNullable: true,
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e02000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e06000-0000-4000-8000-000000000033',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.SET_NULL,
      joinColumnName: 'commercialSignalId',
    },
  },
  {
    universalIdentifier: 'd1e14600-0000-4000-8000-00000000000b',
    objectUniversalIdentifier: 'd1e05000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'customerRenewal',
    label: 'Renovação',
    icon: 'IconRefreshDot',
    isNullable: true,
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e14000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e14600-0000-4000-8000-00000000000c',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.SET_NULL,
      joinColumnName: 'customerRenewalId',
    },
  },
  {
    universalIdentifier: 'd1e06000-0000-4000-8000-000000000038',
    objectUniversalIdentifier: 'd1e05000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxConversation',
    label: 'Conversa da inbox',
    icon: 'IconInbox',
    isNullable: true,
    relationTargetObjectMetadataUniversalIdentifier:
      'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e06000-0000-4000-8000-000000000039',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.SET_NULL,
      joinColumnName: 'inboxConversationId',
    },
  },
  {
    universalIdentifier: 'd1e06000-0000-4000-8000-000000000034',
    objectUniversalIdentifier: 'd1e05000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'successPlan',
    label: 'Plano de sucesso',
    icon: 'IconHeartHandshake',
    isNullable: true,
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e03000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e06000-0000-4000-8000-000000000035',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.SET_NULL,
      joinColumnName: 'successPlanId',
    },
  },
  {
    universalIdentifier: 'd1e06000-0000-4000-8000-000000000033',
    objectUniversalIdentifier: 'd1e02000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'aiActions',
    label: 'Ações de IA',
    icon: 'IconRobot',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e05000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e06000-0000-4000-8000-000000000032',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e14600-0000-4000-8000-00000000000c',
    objectUniversalIdentifier: 'd1e14000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'aiActions',
    label: 'Ações de IA',
    icon: 'IconRobot',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e05000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e14600-0000-4000-8000-00000000000b',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e14600-0000-4000-8000-000000000008',
    objectUniversalIdentifier: 'd1e14000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'renewalEvents',
    label: 'Histórico',
    icon: 'IconTimelineEvent',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e14200-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e14600-0000-4000-8000-000000000007',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e14600-0000-4000-8000-000000000001',
    objectUniversalIdentifier: 'd1e14000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'successPlan',
    label: 'Plano de sucesso',
    icon: 'IconHeartHandshake',
    isNullable: true,
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e03000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e14600-0000-4000-8000-000000000002',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.SET_NULL,
      joinColumnName: 'successPlanId',
    },
  },
  {
    universalIdentifier: 'd1e14600-0000-4000-8000-000000000007',
    objectUniversalIdentifier: 'd1e14200-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'customerRenewal',
    label: 'Renovação',
    icon: 'IconRefreshDot',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e14000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e14600-0000-4000-8000-000000000008',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.CASCADE,
      joinColumnName: 'customerRenewalId',
    },
  },
  {
    universalIdentifier: 'd1e06000-0000-4000-8000-000000000039',
    objectUniversalIdentifier: 'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
    type: FieldMetadataType.RELATION,
    name: 'diexAiActions',
    label: 'Ações de IA',
    icon: 'IconRobot',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e05000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e06000-0000-4000-8000-000000000038',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e06000-0000-4000-8000-000000000026',
    objectUniversalIdentifier: 'd1e04000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'successPlan',
    label: 'Plano de sucesso',
    icon: 'IconHeartHandshake',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e03000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e06000-0000-4000-8000-000000000027',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.CASCADE,
      joinColumnName: 'successPlanId',
    },
  },
  {
    universalIdentifier: 'd1e06000-0000-4000-8000-000000000035',
    objectUniversalIdentifier: 'd1e03000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'aiActions',
    label: 'Ações de IA',
    icon: 'IconRobot',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e05000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e06000-0000-4000-8000-000000000034',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e14600-0000-4000-8000-000000000002',
    objectUniversalIdentifier: 'd1e03000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'customerRenewals',
    label: 'Renovações',
    icon: 'IconRefreshDot',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e14000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e14600-0000-4000-8000-000000000001',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e06000-0000-4000-8000-000000000027',
    objectUniversalIdentifier: 'd1e03000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'milestones',
    label: 'Marcos de sucesso',
    icon: 'IconFlag3',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e04000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e06000-0000-4000-8000-000000000026',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  ...DIEX_STANDARD_OBJECT_EXTENSION_RELATION_DEFINITIONS,
] as const satisfies readonly FieldManifest<FieldMetadataType.RELATION>[];
