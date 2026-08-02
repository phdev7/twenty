import { type FieldManifest } from 'twenty-shared/application';
import {
  FieldMetadataType,
  RelationOnDeleteAction,
  RelationType,
} from 'twenty-shared/types';

type RelationEndpointDefinition = {
  universalIdentifier: string;
  objectUniversalIdentifier: string;
  name: string;
  label: string;
  description?: string;
  icon: string;
  isNullable?: boolean;
  universalSettings: NonNullable<
    FieldManifest<FieldMetadataType.RELATION>['universalSettings']
  >;
};

type RelationPairDefinition = {
  source: RelationEndpointDefinition;
  target: RelationEndpointDefinition;
};

const oneToManySettings = {
  relationType: RelationType.ONE_TO_MANY,
} as const;

const manyToOneSettings = (
  joinColumnName: string,
  onDelete: RelationOnDeleteAction | null = RelationOnDeleteAction.SET_NULL,
) => ({
  relationType: RelationType.MANY_TO_ONE,
  ...(onDelete === null ? {} : { onDelete }),
  joinColumnName,
});

const buildRelationPairDefinitions = ({
  source,
  target,
}: RelationPairDefinition): FieldManifest<FieldMetadataType.RELATION>[] => [
  {
    ...source,
    type: FieldMetadataType.RELATION,
    relationTargetObjectMetadataUniversalIdentifier:
      target.objectUniversalIdentifier,
    relationTargetFieldMetadataUniversalIdentifier: target.universalIdentifier,
  },
  {
    ...target,
    type: FieldMetadataType.RELATION,
    relationTargetObjectMetadataUniversalIdentifier:
      source.objectUniversalIdentifier,
    relationTargetFieldMetadataUniversalIdentifier: source.universalIdentifier,
  },
];

const OBJECT_IDS = {
  aiAction: 'd1e05000-0000-4000-8000-000000000001',
  commercialSignal: 'd1e02000-0000-4000-8000-000000000001',
  company: '20202020-b374-4779-a561-80086cb2e17f',
  customerRenewal: 'd1e14000-0000-4000-8000-000000000001',
  customerRenewalEvent: 'd1e14200-0000-4000-8000-000000000001',
  inboxAutomation: 'd1e0fd00-0000-4000-8000-000000000001',
  inboxConversation: 'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
  inboxConversationEvent: 'd1e0fc00-0000-4000-8000-000000000001',
  inboxMacro: 'd1e0fb00-0000-4000-8000-000000000001',
  inboxMention: 'd1e0fa00-0000-4000-8000-000000000001',
  inboxTeamMember: 'd1e0f500-0000-4000-8000-000000000001',
  offer: 'd1e01000-0000-4000-8000-000000000001',
  opportunity: '20202020-9549-49dd-b2b2-883999db8938',
  person: '20202020-e674-48e5-a542-72570eee7213',
  successPlan: 'd1e03000-0000-4000-8000-000000000001',
  task: '20202020-1ba1-48ba-bc83-ef7e5990ed10',
  workspaceMember: '20202020-3319-4234-a34c-82d5c0e881a6',
} as const;

const RELATION_PAIRS = [
  {
    source: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000002',
      objectUniversalIdentifier: OBJECT_IDS.offer,
      name: 'opportunities',
      label: 'Oportunidades',
      icon: 'IconTargetArrow',
      universalSettings: oneToManySettings,
    },
    target: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000001',
      objectUniversalIdentifier: OBJECT_IDS.opportunity,
      name: 'diexOffer',
      label: 'Oferta',
      icon: 'IconPackage',
      isNullable: true,
      universalSettings: manyToOneSettings('diexOfferId'),
    },
  },
  {
    source: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000012',
      objectUniversalIdentifier: OBJECT_IDS.commercialSignal,
      name: 'company',
      label: 'Empresa',
      icon: 'IconBuilding',
      isNullable: true,
      universalSettings: manyToOneSettings('companyId'),
    },
    target: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000013',
      objectUniversalIdentifier: OBJECT_IDS.company,
      name: 'diexCommercialSignals',
      label: 'Sinais comerciais',
      icon: 'IconRadar',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000014',
      objectUniversalIdentifier: OBJECT_IDS.commercialSignal,
      name: 'opportunity',
      label: 'Oportunidade',
      icon: 'IconTargetArrow',
      isNullable: true,
      universalSettings: manyToOneSettings('opportunityId'),
    },
    target: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000015',
      objectUniversalIdentifier: OBJECT_IDS.opportunity,
      name: 'diexCommercialSignals',
      label: 'Sinais comerciais',
      icon: 'IconRadar',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000010',
      objectUniversalIdentifier: OBJECT_IDS.commercialSignal,
      name: 'person',
      label: 'Pessoa',
      icon: 'IconUser',
      isNullable: true,
      universalSettings: manyToOneSettings('personId'),
    },
    target: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000011',
      objectUniversalIdentifier: OBJECT_IDS.person,
      name: 'diexCommercialSignals',
      label: 'Sinais comerciais',
      icon: 'IconRadar',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000020',
      objectUniversalIdentifier: OBJECT_IDS.successPlan,
      name: 'company',
      label: 'Empresa',
      icon: 'IconBuilding',
      isNullable: true,
      universalSettings: manyToOneSettings('companyId'),
    },
    target: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000021',
      objectUniversalIdentifier: OBJECT_IDS.company,
      name: 'diexSuccessPlans',
      label: 'Planos de sucesso',
      icon: 'IconHeartHandshake',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000018',
      objectUniversalIdentifier: OBJECT_IDS.successPlan,
      name: 'operationalTasks',
      label: 'Tarefas operacionais',
      description: 'Trabalho de entrega e adoção vinculado a este plano.',
      icon: 'IconChecklist',
      universalSettings: oneToManySettings,
    },
    target: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000017',
      objectUniversalIdentifier: OBJECT_IDS.task,
      name: 'diexSuccessPlan',
      label: 'Plano de sucesso',
      description:
        'Plano de Customer Success que esta tarefa operacional faz avançar.',
      icon: 'IconHeartHandshake',
      isNullable: true,
      universalSettings: manyToOneSettings('diexSuccessPlanId', null),
    },
  },
  {
    source: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000044',
      objectUniversalIdentifier: OBJECT_IDS.successPlan,
      name: 'opportunity',
      label: 'Oportunidade de origem',
      icon: 'IconTargetArrow',
      isNullable: true,
      universalSettings: manyToOneSettings('opportunityId'),
    },
    target: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000045',
      objectUniversalIdentifier: OBJECT_IDS.opportunity,
      name: 'diexSuccessPlans',
      label: 'Planos de sucesso',
      icon: 'IconHeartHandshake',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000024',
      objectUniversalIdentifier: OBJECT_IDS.successPlan,
      name: 'owner',
      label: 'Responsável de CS',
      icon: 'IconUserCheck',
      isNullable: true,
      universalSettings: manyToOneSettings('ownerId'),
    },
    target: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000025',
      objectUniversalIdentifier: OBJECT_IDS.workspaceMember,
      name: 'diexOwnedSuccessPlans',
      label: 'Planos de sucesso sob responsabilidade',
      icon: 'IconHeartHandshake',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000022',
      objectUniversalIdentifier: OBJECT_IDS.successPlan,
      name: 'primaryContact',
      label: 'Contato principal',
      icon: 'IconUser',
      isNullable: true,
      universalSettings: manyToOneSettings('primaryContactId'),
    },
    target: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000023',
      objectUniversalIdentifier: OBJECT_IDS.person,
      name: 'diexSuccessPlans',
      label: 'Planos de sucesso',
      icon: 'IconHeartHandshake',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000040',
      objectUniversalIdentifier: OBJECT_IDS.aiAction,
      name: 'executionTask',
      label: 'Tarefa executada',
      icon: 'IconListCheck',
      isNullable: true,
      universalSettings: manyToOneSettings('executionTaskId'),
    },
    target: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000041',
      objectUniversalIdentifier: OBJECT_IDS.task,
      name: 'diexAiActions',
      label: 'Ações de IA executadas',
      icon: 'IconRobot',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000042',
      objectUniversalIdentifier: OBJECT_IDS.aiAction,
      name: 'executor',
      label: 'Executor',
      icon: 'IconUserCog',
      isNullable: true,
      universalSettings: manyToOneSettings('executorId'),
    },
    target: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000043',
      objectUniversalIdentifier: OBJECT_IDS.workspaceMember,
      name: 'diexExecutedAiActions',
      label: 'Ações de IA executadas',
      icon: 'IconRobot',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000030',
      objectUniversalIdentifier: OBJECT_IDS.aiAction,
      name: 'opportunity',
      label: 'Oportunidade',
      icon: 'IconTargetArrow',
      isNullable: true,
      universalSettings: manyToOneSettings('opportunityId'),
    },
    target: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000031',
      objectUniversalIdentifier: OBJECT_IDS.opportunity,
      name: 'diexAiActions',
      label: 'Ações de IA',
      icon: 'IconRobot',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000036',
      objectUniversalIdentifier: OBJECT_IDS.aiAction,
      name: 'reviewer',
      label: 'Revisor',
      icon: 'IconUserCheck',
      isNullable: true,
      universalSettings: manyToOneSettings('reviewerId'),
    },
    target: {
      universalIdentifier: 'd1e06000-0000-4000-8000-000000000037',
      objectUniversalIdentifier: OBJECT_IDS.workspaceMember,
      name: 'diexReviewActions',
      label: 'Ações de IA para revisão',
      icon: 'IconShieldCheck',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e14600-0000-4000-8000-000000000003',
      objectUniversalIdentifier: OBJECT_IDS.customerRenewal,
      name: 'company',
      label: 'Empresa',
      icon: 'IconBuilding',
      isNullable: true,
      universalSettings: manyToOneSettings('companyId'),
    },
    target: {
      universalIdentifier: 'd1e14600-0000-4000-8000-000000000004',
      objectUniversalIdentifier: OBJECT_IDS.company,
      name: 'diexCustomerRenewals',
      label: 'Renovações',
      icon: 'IconRefreshDot',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e14600-0000-4000-8000-000000000005',
      objectUniversalIdentifier: OBJECT_IDS.customerRenewal,
      name: 'owner',
      label: 'Responsável',
      icon: 'IconUserCheck',
      isNullable: true,
      universalSettings: manyToOneSettings('ownerId'),
    },
    target: {
      universalIdentifier: 'd1e14600-0000-4000-8000-000000000006',
      objectUniversalIdentifier: OBJECT_IDS.workspaceMember,
      name: 'diexOwnedCustomerRenewals',
      label: 'Renovações sob responsabilidade',
      icon: 'IconRefreshDot',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e14600-0000-4000-8000-000000000009',
      objectUniversalIdentifier: OBJECT_IDS.customerRenewalEvent,
      name: 'actor',
      label: 'Autor',
      icon: 'IconUserCheck',
      isNullable: true,
      universalSettings: manyToOneSettings('actorId'),
    },
    target: {
      universalIdentifier: 'd1e14600-0000-4000-8000-00000000000a',
      objectUniversalIdentifier: OBJECT_IDS.workspaceMember,
      name: 'diexCustomerRenewalEvents',
      label: 'Eventos de renovação',
      icon: 'IconTimelineEvent',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'b14d36db-332b-40a2-8217-b395be47a39a',
      objectUniversalIdentifier: OBJECT_IDS.inboxConversation,
      name: 'assignee',
      label: 'Responsável',
      icon: 'IconUserCheck',
      isNullable: true,
      universalSettings: manyToOneSettings('assigneeId'),
    },
    target: {
      universalIdentifier: '9ae28763-02f7-44b6-aaf0-4a1d0d52be0f',
      objectUniversalIdentifier: OBJECT_IDS.workspaceMember,
      name: 'diexAssignedInboxConversations',
      label: 'Conversas atribuídas',
      icon: 'IconInbox',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'a93d3f74-dad6-4a40-90b6-d5ef72a18a12',
      objectUniversalIdentifier: OBJECT_IDS.inboxConversation,
      name: 'company',
      label: 'Empresa',
      icon: 'IconBuilding',
      isNullable: true,
      universalSettings: manyToOneSettings('companyId'),
    },
    target: {
      universalIdentifier: '8f49a1c0-8e0d-4794-a98f-5dbdec1e9b33',
      objectUniversalIdentifier: OBJECT_IDS.company,
      name: 'diexInboxConversations',
      label: 'Conversas da inbox',
      icon: 'IconInbox',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: '14e32618-aeb9-4282-9e98-8b8aea4721e9',
      objectUniversalIdentifier: OBJECT_IDS.inboxConversation,
      name: 'opportunity',
      label: 'Oportunidade',
      icon: 'IconTargetArrow',
      isNullable: true,
      universalSettings: manyToOneSettings('opportunityId'),
    },
    target: {
      universalIdentifier: '4daced73-aa5e-4d6c-9e70-80b97fe28f97',
      objectUniversalIdentifier: OBJECT_IDS.opportunity,
      name: 'diexInboxConversations',
      label: 'Conversas da inbox',
      icon: 'IconInbox',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'ad36d6ef-df23-4c50-8704-124ac3da6973',
      objectUniversalIdentifier: OBJECT_IDS.inboxConversation,
      name: 'person',
      label: 'Pessoa',
      icon: 'IconUser',
      isNullable: true,
      universalSettings: manyToOneSettings('personId'),
    },
    target: {
      universalIdentifier: 'b59f1b65-40f9-4607-8da7-3010960ff2f0',
      objectUniversalIdentifier: OBJECT_IDS.person,
      name: 'diexInboxConversations',
      label: 'Conversas da inbox',
      icon: 'IconInbox',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: '074097e0-d250-47d6-b90d-6cf60fdb8030',
      objectUniversalIdentifier: OBJECT_IDS.inboxConversation,
      name: 'tasks',
      label: 'Tarefas',
      icon: 'IconChecklist',
      universalSettings: oneToManySettings,
    },
    target: {
      universalIdentifier: 'eba85d8a-4525-4aaf-8a2c-7c51825deb84',
      objectUniversalIdentifier: OBJECT_IDS.task,
      name: 'diexInboxConversation',
      label: 'Conversa de origem',
      icon: 'IconInbox',
      isNullable: true,
      universalSettings: manyToOneSettings('diexInboxConversationId'),
    },
  },
  {
    source: {
      universalIdentifier: 'd1e0f510-0000-4000-8000-000000000006',
      objectUniversalIdentifier: OBJECT_IDS.inboxTeamMember,
      name: 'workspaceMember',
      label: 'Usuário',
      icon: 'IconUser',
      universalSettings: manyToOneSettings(
        'workspaceMemberId',
        RelationOnDeleteAction.CASCADE,
      ),
    },
    target: {
      universalIdentifier: 'd1e0f600-0000-4000-8000-000000000004',
      objectUniversalIdentifier: OBJECT_IDS.workspaceMember,
      name: 'diexInboxTeamMemberships',
      label: 'Equipes da inbox',
      icon: 'IconUsersGroup',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e0fa10-0000-4000-8000-00000000000a',
      objectUniversalIdentifier: OBJECT_IDS.inboxMention,
      name: 'authorWorkspaceMember',
      label: 'Autor',
      icon: 'IconUserEdit',
      isNullable: true,
      universalSettings: manyToOneSettings('authorWorkspaceMemberId'),
    },
    target: {
      universalIdentifier: 'd1e0fa20-0000-4000-8000-000000000004',
      objectUniversalIdentifier: OBJECT_IDS.workspaceMember,
      name: 'diexAuthoredInboxMentions',
      label: 'Menções criadas',
      icon: 'IconAt',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e0fa10-0000-4000-8000-000000000009',
      objectUniversalIdentifier: OBJECT_IDS.inboxMention,
      name: 'mentionedWorkspaceMember',
      label: 'Mencionado',
      icon: 'IconAt',
      isNullable: true,
      universalSettings: manyToOneSettings('mentionedWorkspaceMemberId'),
    },
    target: {
      universalIdentifier: 'd1e0fa20-0000-4000-8000-000000000003',
      objectUniversalIdentifier: OBJECT_IDS.workspaceMember,
      name: 'diexInboxMentions',
      label: 'Menções recebidas',
      icon: 'IconAt',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e0fb10-0000-4000-8000-00000000000e',
      objectUniversalIdentifier: OBJECT_IDS.inboxMacro,
      name: 'assignee',
      label: 'Responsável',
      icon: 'IconUserCheck',
      isNullable: true,
      universalSettings: manyToOneSettings('assigneeId'),
    },
    target: {
      universalIdentifier: 'd1e0fb20-0000-4000-8000-000000000004',
      objectUniversalIdentifier: OBJECT_IDS.workspaceMember,
      name: 'diexInboxMacros',
      label: 'Macros da inbox',
      icon: 'IconWand',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e0fc10-0000-4000-8000-000000000007',
      objectUniversalIdentifier: OBJECT_IDS.inboxConversationEvent,
      name: 'actor',
      label: 'Autor',
      icon: 'IconUser',
      isNullable: true,
      universalSettings: manyToOneSettings('actorId'),
    },
    target: {
      universalIdentifier: 'd1e0fc20-0000-4000-8000-000000000002',
      objectUniversalIdentifier: OBJECT_IDS.workspaceMember,
      name: 'diexInboxConversationEvents',
      label: 'Eventos da inbox',
      icon: 'IconTimelineEvent',
      universalSettings: oneToManySettings,
    },
  },
  {
    source: {
      universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000016',
      objectUniversalIdentifier: OBJECT_IDS.inboxAutomation,
      name: 'assignee',
      label: 'Responsável de destino',
      icon: 'IconUserCheck',
      isNullable: true,
      universalSettings: manyToOneSettings('assigneeId'),
    },
    target: {
      universalIdentifier: 'd1e0fd20-0000-4000-8000-000000000003',
      objectUniversalIdentifier: OBJECT_IDS.workspaceMember,
      name: 'diexInboxAutomations',
      label: 'Automações da inbox',
      icon: 'IconSettingsAutomation',
      universalSettings: oneToManySettings,
    },
  },
] as const satisfies readonly RelationPairDefinition[];

export const DIEX_STANDARD_OBJECT_EXTENSION_RELATION_DEFINITIONS =
  RELATION_PAIRS.flatMap(buildRelationPairDefinitions);
