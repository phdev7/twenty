import { type FieldManifest } from 'twenty-shared/application';
import {
  FieldMetadataType,
  RelationOnDeleteAction,
  RelationType,
} from 'twenty-shared/types';

export const INBOX_STANDARD_RELATION_DEFINITIONS = [
  {
    universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000014',
    objectUniversalIdentifier: 'd1e0fd00-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxLabel',
    label: 'Etiqueta a aplicar',
    icon: 'IconTag',
    isNullable: true,
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0e000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fd20-0000-4000-8000-000000000001',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.SET_NULL,
      joinColumnName: 'inboxLabelId',
    },
  },
  {
    universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000015',
    objectUniversalIdentifier: 'd1e0fd00-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxTeam',
    label: 'Equipe de destino',
    icon: 'IconUsersGroup',
    isNullable: true,
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0f400-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fd20-0000-4000-8000-000000000002',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.SET_NULL,
      joinColumnName: 'inboxTeamId',
    },
  },
  {
    universalIdentifier: 'd1e0fc20-0000-4000-8000-000000000001',
    objectUniversalIdentifier: 'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
    type: FieldMetadataType.RELATION,
    name: 'conversationEvents',
    label: 'Eventos',
    icon: 'IconTimelineEvent',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0fc00-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fc10-0000-4000-8000-000000000006',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e0f600-0000-4000-8000-000000000001',
    objectUniversalIdentifier: 'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
    type: FieldMetadataType.RELATION,
    name: 'inboxTeam',
    label: 'Equipe',
    icon: 'IconUsersGroup',
    isNullable: true,
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0f400-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0f600-0000-4000-8000-000000000002',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.SET_NULL,
      joinColumnName: 'inboxTeamId',
    },
  },
  {
    universalIdentifier: 'd1e0f200-0000-4000-8000-000000000001',
    objectUniversalIdentifier: 'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
    type: FieldMetadataType.RELATION,
    name: 'labelAssignments',
    label: 'Etiquetas',
    icon: 'IconTags',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0f000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0f100-0000-4000-8000-000000000005',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e0fa20-0000-4000-8000-000000000001',
    objectUniversalIdentifier: 'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
    type: FieldMetadataType.RELATION,
    name: 'mentions',
    label: 'Menções',
    icon: 'IconAt',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0fa00-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fa10-0000-4000-8000-000000000007',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: '34bb2d1c-17c0-435f-a00d-4a30224a054c',
    objectUniversalIdentifier: 'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
    type: FieldMetadataType.RELATION,
    name: 'messages',
    label: 'Mensagens',
    icon: 'IconMessage',
    relationTargetObjectMetadataUniversalIdentifier:
      '7f598a57-08b2-4cc4-a4fa-a5c66f00da7b',
    relationTargetFieldMetadataUniversalIdentifier:
      '1b017ced-89f2-4358-a166-fa62e486e361',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e0fc10-0000-4000-8000-000000000006',
    objectUniversalIdentifier: 'd1e0fc00-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxConversation',
    label: 'Conversa',
    icon: 'IconInbox',
    relationTargetObjectMetadataUniversalIdentifier:
      'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fc20-0000-4000-8000-000000000001',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.CASCADE,
      joinColumnName: 'inboxConversationId',
    },
  },
  {
    universalIdentifier: 'd1e0f100-0000-4000-8000-000000000005',
    objectUniversalIdentifier: 'd1e0f000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxConversation',
    label: 'Conversa',
    icon: 'IconInbox',
    relationTargetObjectMetadataUniversalIdentifier:
      'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0f200-0000-4000-8000-000000000001',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.CASCADE,
      joinColumnName: 'inboxConversationId',
    },
  },
  {
    universalIdentifier: 'd1e0f100-0000-4000-8000-000000000006',
    objectUniversalIdentifier: 'd1e0f000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxLabel',
    label: 'Etiqueta',
    icon: 'IconTag',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0e000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0f200-0000-4000-8000-000000000002',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.CASCADE,
      joinColumnName: 'inboxLabelId',
    },
  },
  {
    universalIdentifier: 'd1e0f200-0000-4000-8000-000000000002',
    objectUniversalIdentifier: 'd1e0e000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'conversationAssignments',
    label: 'Conversas',
    icon: 'IconInbox',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0f000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0f100-0000-4000-8000-000000000006',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e0fd20-0000-4000-8000-000000000001',
    objectUniversalIdentifier: 'd1e0e000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxAutomations',
    label: 'Automações',
    icon: 'IconSettingsAutomation',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0fd00-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fd10-0000-4000-8000-000000000014',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e0fb20-0000-4000-8000-000000000002',
    objectUniversalIdentifier: 'd1e0e000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxMacros',
    label: 'Macros',
    icon: 'IconWand',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0fb00-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fb10-0000-4000-8000-00000000000c',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e0fb10-0000-4000-8000-00000000000c',
    objectUniversalIdentifier: 'd1e0fb00-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxLabel',
    label: 'Etiqueta',
    icon: 'IconTag',
    isNullable: true,
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0e000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fb20-0000-4000-8000-000000000002',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.SET_NULL,
      joinColumnName: 'inboxLabelId',
    },
  },
  {
    universalIdentifier: 'd1e0fb10-0000-4000-8000-00000000000d',
    objectUniversalIdentifier: 'd1e0fb00-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxTeam',
    label: 'Equipe',
    icon: 'IconUsersGroup',
    isNullable: true,
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0f400-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fb20-0000-4000-8000-000000000003',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.SET_NULL,
      joinColumnName: 'inboxTeamId',
    },
  },
  {
    universalIdentifier: 'd1e0fb10-0000-4000-8000-00000000000b',
    objectUniversalIdentifier: 'd1e0fb00-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'savedReply',
    label: 'Resposta pronta',
    icon: 'IconBolt',
    isNullable: true,
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0d000-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fb20-0000-4000-8000-000000000001',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.SET_NULL,
      joinColumnName: 'savedReplyId',
    },
  },
  {
    universalIdentifier: 'd1e0fa10-0000-4000-8000-000000000007',
    objectUniversalIdentifier: 'd1e0fa00-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxConversation',
    label: 'Conversa',
    icon: 'IconInbox',
    relationTargetObjectMetadataUniversalIdentifier:
      'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fa20-0000-4000-8000-000000000001',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.CASCADE,
      joinColumnName: 'inboxConversationId',
    },
  },
  {
    universalIdentifier: 'd1e0fa10-0000-4000-8000-000000000008',
    objectUniversalIdentifier: 'd1e0fa00-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxMessage',
    label: 'Nota interna',
    icon: 'IconNotes',
    relationTargetObjectMetadataUniversalIdentifier:
      '7f598a57-08b2-4cc4-a4fa-a5c66f00da7b',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fa20-0000-4000-8000-000000000002',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.CASCADE,
      joinColumnName: 'inboxMessageId',
    },
  },
  {
    universalIdentifier: '1b017ced-89f2-4358-a166-fa62e486e361',
    objectUniversalIdentifier: '7f598a57-08b2-4cc4-a4fa-a5c66f00da7b',
    type: FieldMetadataType.RELATION,
    name: 'inboxConversation',
    label: 'Conversa',
    icon: 'IconInbox',
    isNullable: false,
    relationTargetObjectMetadataUniversalIdentifier:
      'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
    relationTargetFieldMetadataUniversalIdentifier:
      '34bb2d1c-17c0-435f-a00d-4a30224a054c',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.CASCADE,
      joinColumnName: 'inboxConversationId',
    },
  },
  {
    universalIdentifier: 'd1e0fa20-0000-4000-8000-000000000002',
    objectUniversalIdentifier: '7f598a57-08b2-4cc4-a4fa-a5c66f00da7b',
    type: FieldMetadataType.RELATION,
    name: 'mentions',
    label: 'Menções',
    icon: 'IconAt',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0fa00-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fa10-0000-4000-8000-000000000008',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e0fb20-0000-4000-8000-000000000001',
    objectUniversalIdentifier: 'd1e0d000-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxMacros',
    label: 'Macros',
    icon: 'IconWand',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0fb00-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fb10-0000-4000-8000-00000000000b',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e0fd20-0000-4000-8000-000000000002',
    objectUniversalIdentifier: 'd1e0f400-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxAutomations',
    label: 'Automações',
    icon: 'IconSettingsAutomation',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0fd00-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fd10-0000-4000-8000-000000000015',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e0f600-0000-4000-8000-000000000002',
    objectUniversalIdentifier: 'd1e0f400-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxConversations',
    label: 'Conversas',
    icon: 'IconInbox',
    relationTargetObjectMetadataUniversalIdentifier:
      'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0f600-0000-4000-8000-000000000001',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e0fb20-0000-4000-8000-000000000003',
    objectUniversalIdentifier: 'd1e0f400-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxMacros',
    label: 'Macros',
    icon: 'IconWand',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0fb00-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0fb10-0000-4000-8000-00000000000d',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e0f600-0000-4000-8000-000000000003',
    objectUniversalIdentifier: 'd1e0f400-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'memberships',
    label: 'Membros',
    icon: 'IconUsers',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0f500-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0f510-0000-4000-8000-000000000005',
    universalSettings: {
      relationType: RelationType.ONE_TO_MANY,
    },
  },
  {
    universalIdentifier: 'd1e0f510-0000-4000-8000-000000000005',
    objectUniversalIdentifier: 'd1e0f500-0000-4000-8000-000000000001',
    type: FieldMetadataType.RELATION,
    name: 'inboxTeam',
    label: 'Equipe',
    icon: 'IconUsersGroup',
    relationTargetObjectMetadataUniversalIdentifier:
      'd1e0f400-0000-4000-8000-000000000001',
    relationTargetFieldMetadataUniversalIdentifier:
      'd1e0f600-0000-4000-8000-000000000003',
    universalSettings: {
      relationType: RelationType.MANY_TO_ONE,
      onDelete: RelationOnDeleteAction.CASCADE,
      joinColumnName: 'inboxTeamId',
    },
  },
] as const satisfies readonly FieldManifest<FieldMetadataType.RELATION>[];
