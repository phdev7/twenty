import { ViewFilterOperand, ViewKey, ViewType } from 'twenty-shared/types';

export type StandardDiexViewFieldDefinition = {
  universalIdentifier: string;
  fieldName: string;
  position: number;
  isVisible: boolean;
  size: number;
};

export type StandardDiexViewGroupDefinition = {
  universalIdentifier: string;
  fieldValue: string;
  position: number;
  isVisible: boolean;
};

export type StandardDiexViewFilterDefinition = {
  universalIdentifier: string;
  fieldName: string;
  operand: ViewFilterOperand;
  value: string;
};

export type StandardDiexViewDefinition = {
  objectName: string;
  viewName: string;
  universalIdentifier: string;
  name: string;
  type: ViewType;
  key: ViewKey | null;
  icon: string;
  position: number;
  mainGroupByFieldName?: string;
  fields: readonly StandardDiexViewFieldDefinition[];
  groups?: readonly StandardDiexViewGroupDefinition[];
  filters?: readonly StandardDiexViewFilterDefinition[];
};

const field = (
  universalIdentifier: string,
  fieldName: string,
  position: number,
  size: number,
): StandardDiexViewFieldDefinition => ({
  universalIdentifier,
  fieldName,
  position,
  isVisible: true,
  size,
});

const group = (
  universalIdentifier: string,
  fieldValue: string,
  position: number,
): StandardDiexViewGroupDefinition => ({
  universalIdentifier,
  fieldValue,
  position,
  isVisible: true,
});

const table = (
  definition: Omit<StandardDiexViewDefinition, 'type' | 'key'>,
): StandardDiexViewDefinition => ({
  ...definition,
  type: ViewType.TABLE,
  key: null,
});

const kanban = (
  definition: Omit<StandardDiexViewDefinition, 'type' | 'key'>,
): StandardDiexViewDefinition => ({
  ...definition,
  type: ViewType.KANBAN,
  key: null,
});

export const STANDARD_DIEX_VIEWS: readonly StandardDiexViewDefinition[] = [
  kanban({
    objectName: 'aiAction',
    viewName: 'aiActionGovernance',
    universalIdentifier: 'd1e07000-0000-4000-8000-000000000005',
    name: 'Governança de IA',
    icon: 'IconShieldCheck',
    position: 0,
    mainGroupByFieldName: 'status',
    fields: [
      field('d1e07900-0000-4000-8000-000000000001', 'name', 0, 220),
      field('d1e07900-0000-4000-8000-000000000002', 'actionType', 1, 150),
      field('d1e07900-0000-4000-8000-000000000003', 'confidence', 2, 120),
      field('d1e07900-0000-4000-8000-000000000004', 'requiresApproval', 3, 120),
      field('d1e07900-0000-4000-8000-000000000005', 'requestedAt', 4, 150),
      field('d1e07900-0000-4000-8000-000000000006', 'opportunity', 5, 180),
      field('d1e07900-0000-4000-8000-000000000007', 'commercialSignal', 6, 180),
      field('d1e07900-0000-4000-8000-000000000008', 'successPlan', 7, 180),
      field('d1e07900-0000-4000-8000-000000000009', 'reviewer', 8, 180),
      field('d1e07900-0000-4000-8000-00000000000a', 'proposedAction', 9, 320),
    ],
    groups: [
      group('d1e07800-0000-4000-8000-000000000001', 'DRAFT', 0),
      group('d1e07800-0000-4000-8000-000000000002', 'PENDING_APPROVAL', 1),
      group('d1e07800-0000-4000-8000-000000000003', 'APPROVED', 2),
      group('d1e07800-0000-4000-8000-000000000004', 'REJECTED', 3),
      group('d1e07800-0000-4000-8000-000000000005', 'EXECUTED', 4),
      group('d1e07800-0000-4000-8000-000000000006', 'FAILED', 5),
    ],
  }),
  kanban({
    objectName: 'commercialSignal',
    viewName: 'commercialSignalTriage',
    universalIdentifier: 'd1e07000-0000-4000-8000-000000000002',
    name: 'Triagem de sinais',
    icon: 'IconRadar',
    position: 0,
    mainGroupByFieldName: 'status',
    fields: [
      field('d1e07300-0000-4000-8000-000000000001', 'name', 0, 220),
      field('d1e07300-0000-4000-8000-000000000002', 'signalType', 1, 130),
      field('d1e07300-0000-4000-8000-000000000003', 'source', 2, 130),
      field('d1e07300-0000-4000-8000-000000000004', 'strength', 3, 110),
      field('d1e07300-0000-4000-8000-000000000005', 'opportunity', 4, 180),
      field('d1e07300-0000-4000-8000-000000000006', 'company', 5, 180),
      field('d1e07300-0000-4000-8000-000000000007', 'person', 6, 180),
      field('d1e07300-0000-4000-8000-000000000008', 'capturedAt', 7, 150),
      field(
        'd1e07300-0000-4000-8000-000000000009',
        'recommendedAction',
        8,
        300,
      ),
    ],
    groups: [
      group('d1e07200-0000-4000-8000-000000000001', 'NEW', 0),
      group('d1e07200-0000-4000-8000-000000000002', 'IN_REVIEW', 1),
      group('d1e07200-0000-4000-8000-000000000003', 'ACTIONED', 2),
      group('d1e07200-0000-4000-8000-000000000004', 'DISMISSED', 3),
    ],
  }),
  kanban({
    objectName: 'task',
    viewName: 'commercialTasks',
    universalIdentifier: 'd1e07000-0000-4000-8000-000000000010',
    name: 'Tarefas comerciais',
    icon: 'IconTargetArrow',
    position: 10,
    mainGroupByFieldName: 'status',
    fields: [],
    filters: [
      {
        universalIdentifier: 'd1e07610-0000-4000-8000-000000000001',
        fieldName: 'taskCategory',
        operand: ViewFilterOperand.IS,
        value: JSON.stringify(['COMMERCIAL']),
      },
    ],
  }),
  kanban({
    objectName: 'successPlan',
    viewName: 'customerSuccessPortfolio',
    universalIdentifier: 'd1e07000-0000-4000-8000-000000000003',
    name: 'Saúde da carteira',
    icon: 'IconHeartHandshake',
    position: 0,
    mainGroupByFieldName: 'health',
    fields: [
      field('d1e07500-0000-4000-8000-000000000001', 'name', 0, 220),
      field('d1e07500-0000-4000-8000-000000000002', 'company', 1, 200),
      field('d1e07500-0000-4000-8000-000000000003', 'lifecycle', 2, 140),
      field('d1e07500-0000-4000-8000-000000000004', 'recurringRevenue', 3, 150),
      field('d1e07500-0000-4000-8000-000000000005', 'renewalDate', 4, 140),
      field('d1e07500-0000-4000-8000-000000000006', 'nextReviewAt', 5, 150),
      field('d1e07500-0000-4000-8000-000000000007', 'owner', 6, 180),
      field('d1e07500-0000-4000-8000-000000000008', 'primaryContact', 7, 180),
    ],
    groups: [
      group('d1e07400-0000-4000-8000-000000000001', 'UNKNOWN', 0),
      group('d1e07400-0000-4000-8000-000000000002', 'HEALTHY', 1),
      group('d1e07400-0000-4000-8000-000000000003', 'ATTENTION', 2),
      group('d1e07400-0000-4000-8000-000000000004', 'CRITICAL', 3),
    ],
  }),
  table({
    objectName: 'offer',
    viewName: 'offers',
    universalIdentifier: 'd1e07000-0000-4000-8000-000000000001',
    name: 'Catálogo de ofertas',
    icon: 'IconPackage',
    position: 0,
    fields: [
      field('d1e07100-0000-4000-8000-000000000001', 'name', 0, 220),
      field('d1e07100-0000-4000-8000-000000000002', 'status', 1, 130),
      field('d1e07100-0000-4000-8000-000000000003', 'category', 2, 160),
      field('d1e07100-0000-4000-8000-000000000004', 'pricingModel', 3, 150),
      field('d1e07100-0000-4000-8000-000000000005', 'basePrice', 4, 150),
      field('d1e07100-0000-4000-8000-000000000006', 'opportunities', 5, 180),
      field('d1e07100-0000-4000-8000-000000000007', 'valueProposition', 6, 320),
    ],
  }),
  kanban({
    objectName: 'task',
    viewName: 'operationalTasks',
    universalIdentifier: 'd1e07000-0000-4000-8000-000000000011',
    name: 'Tarefas operacionais',
    icon: 'IconChecklist',
    position: 11,
    mainGroupByFieldName: 'status',
    fields: [],
    filters: [
      {
        universalIdentifier: 'd1e07610-0000-4000-8000-000000000002',
        fieldName: 'taskCategory',
        operand: ViewFilterOperand.IS,
        value: JSON.stringify(['OPERATIONAL']),
      },
    ],
  }),
  kanban({
    objectName: 'successMilestone',
    viewName: 'successMilestones',
    universalIdentifier: 'd1e07000-0000-4000-8000-000000000004',
    name: 'Marcos de sucesso',
    icon: 'IconFlag3',
    position: 0,
    mainGroupByFieldName: 'status',
    fields: [
      field('d1e07700-0000-4000-8000-000000000001', 'name', 0, 220),
      field('d1e07700-0000-4000-8000-000000000002', 'successPlan', 1, 200),
      field('d1e07700-0000-4000-8000-000000000003', 'category', 2, 140),
      field('d1e07700-0000-4000-8000-000000000004', 'dueAt', 3, 150),
      field('d1e07700-0000-4000-8000-000000000005', 'impact', 4, 110),
      field('d1e07700-0000-4000-8000-000000000006', 'evidence', 5, 300),
    ],
    groups: [
      group('d1e07600-0000-4000-8000-000000000001', 'PLANNED', 0),
      group('d1e07600-0000-4000-8000-000000000002', 'IN_PROGRESS', 1),
      group('d1e07600-0000-4000-8000-000000000003', 'BLOCKED', 2),
      group('d1e07600-0000-4000-8000-000000000004', 'COMPLETED', 3),
      group('d1e07600-0000-4000-8000-000000000005', 'CANCELLED', 4),
    ],
  }),
  table({
    objectName: 'diexWorkspaceContext',
    viewName: 'workspaceContext',
    universalIdentifier: 'd1e07000-0000-4000-8000-000000000012',
    name: 'Contexto do workspace',
    icon: 'IconBook2',
    position: 0,
    fields: [
      field('d1e07710-0000-4000-8000-000000000001', 'name', 0, 220),
      field('d1e07710-0000-4000-8000-000000000002', 'status', 1, 120),
      field(
        'd1e07710-0000-4000-8000-000000000003',
        'businessDescription',
        2,
        360,
      ),
      field('d1e07710-0000-4000-8000-000000000004', 'reviewedAt', 3, 150),
    ],
  }),
  table({
    objectName: 'diexAccessRequest',
    viewName: 'accessRequests',
    universalIdentifier: 'd1e17000-0000-4000-8000-000000000003',
    name: 'Solicitações de acesso',
    icon: 'IconUserQuestion',
    position: 0,
    fields: [
      field('d1e17200-0000-4000-8000-000000000001', 'name', 0, 200),
      field('d1e17200-0000-4000-8000-000000000002', 'status', 1, 140),
      field('d1e17200-0000-4000-8000-000000000003', 'whatsapp', 2, 170),
      field('d1e17200-0000-4000-8000-000000000004', 'contactName', 3, 170),
      field('d1e17200-0000-4000-8000-000000000005', 'email', 4, 220),
      field('d1e17200-0000-4000-8000-000000000006', 'requestedAt', 5, 160),
      field('d1e17200-0000-4000-8000-000000000007', 'desiredSubdomain', 6, 160),
      field('d1e17200-0000-4000-8000-000000000008', 'goal', 7, 320),
    ],
  }),
  table({
    objectName: 'inboxConversation',
    viewName: 'activeConversations',
    universalIdentifier: '2007bfab-939f-4512-a7d3-324d22fe96a8',
    name: 'Inbox ativa',
    icon: 'IconInbox',
    position: 0,
    fields: [
      field('143c3b65-6625-40ef-8530-f81c968ac0aa', 'name', 0, 220),
      field('24d78571-b091-4b8a-adf1-70bf966de0a9', 'status', 1, 120),
      field('3ee782c3-73f4-4507-ac57-a32326c26b56', 'priority', 2, 110),
      field('0f5ca83e-d2b4-4a1b-9edd-8d82c17d6f86', 'person', 3, 180),
      field('7692045a-63a6-4196-a858-db01e56cdd84', 'company', 4, 180),
      field('8eac3d1b-ea14-41ac-8a92-9607533c05b7', 'opportunity', 5, 190),
      field('d1e0f900-0000-4000-8000-000000000001', 'inboxTeam', 6, 150),
      field('17c052e5-2b03-4335-a673-e49535a7a96a', 'assignee', 7, 170),
      field('a9692c16-28ed-4ebe-ad97-ed6e6ac88992', 'unreadCount', 8, 90),
      field(
        '6b0b66d7-a282-4360-ba8c-2f2376eab334',
        'lastMessagePreview',
        9,
        300,
      ),
      field('dc640df6-b174-4c9e-936f-14cb4808a488', 'lastMessageAt', 10, 150),
      field('9ab146db-e7c4-4e64-99a9-f4e52778595b', 'followUpDueAt', 11, 150),
    ],
    filters: [
      {
        universalIdentifier: '3da4e1ad-d947-41f8-ba94-8d56d261f2dc',
        fieldName: 'status',
        operand: ViewFilterOperand.IS_NOT,
        value: JSON.stringify(['RESOLVED', 'SNOOZED']),
      },
    ],
  }),
  table({
    objectName: 'inboxMessage',
    viewName: 'allMessages',
    universalIdentifier: '3302fd1e-c4ff-4929-8375-9b4331dfa544',
    name: 'Histórico da inbox',
    icon: 'IconMessages',
    position: 0,
    fields: [
      field('525e4658-e77a-41be-ab91-7ea1df23ed73', 'name', 0, 180),
      field(
        '2b436cf8-cf8d-4fb3-a519-39056fdc481c',
        'inboxConversation',
        1,
        220,
      ),
      field('d1be39d4-e360-4357-aa56-7b7e782e05e9', 'direction', 2, 110),
      field('1101d296-4ed0-48d2-a96f-893601d49b41', 'messageType', 3, 110),
      field('0fc9c242-c31c-4dda-90fb-ba4401313983', 'deliveryStatus', 4, 120),
      field(
        '9af06bbb-1689-4c3c-b149-425c76017a28',
        'senderDisplayName',
        5,
        170,
      ),
      field('c46245ed-0831-486b-a949-588fcaf57831', 'body', 6, 320),
      field('9cce9532-1523-464f-a847-93c6db21b1d9', 'sentAt', 7, 150),
      field('2875fc6e-10a5-4941-a160-7a7aca721d32', 'isInternalNote', 8, 110),
    ],
  }),
  table({
    objectName: 'inboxAutomation',
    viewName: 'inboxAutomations',
    universalIdentifier: 'd1e0fd40-0000-4000-8000-000000000001',
    name: 'Automações da inbox',
    icon: 'IconSettingsAutomation',
    position: 0,
    fields: [
      field('d1e0fd41-0000-4000-8000-000000000001', 'name', 0, 190),
      field('d1e0fd41-0000-4000-8000-000000000002', 'status', 1, 90),
      field('d1e0fd41-0000-4000-8000-000000000003', 'trigger', 2, 170),
      field('d1e0fd41-0000-4000-8000-000000000004', 'channel', 3, 110),
      field('d1e0fd41-0000-4000-8000-000000000005', 'keywords', 4, 180),
      field('d1e0fd41-0000-4000-8000-000000000006', 'crmCondition', 5, 150),
      field('d1e0fd41-0000-4000-8000-000000000007', 'targetPriority', 6, 120),
      field('d1e0fd41-0000-4000-8000-000000000008', 'inboxTeam', 7, 150),
      field('d1e0fd41-0000-4000-8000-000000000009', 'assignee', 8, 160),
      field('d1e0fd41-0000-4000-8000-00000000000a', 'inboxLabel', 9, 150),
      field(
        'd1e0fd41-0000-4000-8000-00000000000b',
        'taskTitleTemplate',
        10,
        210,
      ),
      field('d1e0fd41-0000-4000-8000-00000000000c', 'runCount', 11, 90),
      field('d1e0fd41-0000-4000-8000-00000000000d', 'lastRunAt', 12, 150),
    ],
  }),
  table({
    objectName: 'inboxConversationEvent',
    viewName: 'inboxConversationEvents',
    universalIdentifier: 'd1e0fc40-0000-4000-8000-000000000001',
    name: 'Histórico da inbox',
    icon: 'IconTimelineEvent',
    position: 0,
    fields: [
      field('d1e0fc41-0000-4000-8000-000000000001', 'summary', 0, 300),
      field('d1e0fc41-0000-4000-8000-000000000002', 'eventType', 1, 150),
      field(
        'd1e0fc41-0000-4000-8000-000000000003',
        'inboxConversation',
        2,
        180,
      ),
      field('d1e0fc41-0000-4000-8000-000000000004', 'actor', 3, 180),
      field('d1e0fc41-0000-4000-8000-000000000005', 'details', 4, 360),
      field('d1e0fc41-0000-4000-8000-000000000006', 'occurredAt', 5, 160),
    ],
  }),
  table({
    objectName: 'inboxLabel',
    viewName: 'inboxLabels',
    universalIdentifier: 'd1e0e200-0000-4000-8000-000000000001',
    name: 'Etiquetas da inbox',
    icon: 'IconTags',
    position: 0,
    fields: [
      field('d1e0e210-0000-4000-8000-000000000001', 'name', 0, 190),
      field('d1e0e210-0000-4000-8000-000000000002', 'slug', 1, 160),
      field('d1e0e210-0000-4000-8000-000000000003', 'color', 2, 110),
      field('d1e0e210-0000-4000-8000-000000000004', 'description', 3, 360),
      field('d1e0e210-0000-4000-8000-000000000005', 'usageCount', 4, 100),
      field('d1e0e210-0000-4000-8000-000000000006', 'status', 5, 110),
    ],
  }),
  table({
    objectName: 'inboxMacro',
    viewName: 'inboxMacros',
    universalIdentifier: 'd1e0fb40-0000-4000-8000-000000000001',
    name: 'Macros da inbox',
    icon: 'IconWand',
    position: 0,
    fields: [
      field('d1e0fb41-0000-4000-8000-000000000001', 'name', 0, 180),
      field('d1e0fb41-0000-4000-8000-000000000002', 'shortcut', 1, 120),
      field('d1e0fb41-0000-4000-8000-000000000003', 'channel', 2, 110),
      field(
        'd1e0fb41-0000-4000-8000-000000000004',
        'targetConversationStatus',
        3,
        120,
      ),
      field('d1e0fb41-0000-4000-8000-000000000005', 'targetPriority', 4, 120),
      field('d1e0fb41-0000-4000-8000-000000000006', 'inboxLabel', 5, 150),
      field('d1e0fb41-0000-4000-8000-000000000007', 'inboxTeam', 6, 150),
      field('d1e0fb41-0000-4000-8000-000000000008', 'assignee', 7, 160),
      field('d1e0fb41-0000-4000-8000-000000000009', 'savedReply', 8, 180),
      field('d1e0fb41-0000-4000-8000-00000000000a', 'usageCount', 9, 90),
      field('d1e0fb41-0000-4000-8000-00000000000b', 'status', 10, 100),
    ],
  }),
  table({
    objectName: 'inboxMention',
    viewName: 'inboxMentions',
    universalIdentifier: 'd1e0fa40-0000-4000-8000-000000000001',
    name: 'Menções da inbox',
    icon: 'IconAt',
    position: 0,
    fields: [
      field('d1e0fa41-0000-4000-8000-000000000001', 'name', 0, 180),
      field(
        'd1e0fa41-0000-4000-8000-000000000002',
        'mentionedWorkspaceMember',
        1,
        180,
      ),
      field(
        'd1e0fa41-0000-4000-8000-000000000003',
        'authorWorkspaceMember',
        2,
        180,
      ),
      field(
        'd1e0fa41-0000-4000-8000-000000000004',
        'inboxConversation',
        3,
        180,
      ),
      field('d1e0fa41-0000-4000-8000-000000000005', 'excerpt', 4, 300),
      field('d1e0fa41-0000-4000-8000-000000000006', 'status', 5, 110),
      field('d1e0fa41-0000-4000-8000-000000000007', 'mentionedAt', 6, 150),
    ],
  }),
  table({
    objectName: 'inboxSavedReply',
    viewName: 'inboxSavedReplies',
    universalIdentifier: 'd1e0d200-0000-4000-8000-000000000001',
    name: 'Respostas prontas',
    icon: 'IconBolt',
    position: 0,
    fields: [
      field('d1e0d210-0000-4000-8000-000000000001', 'name', 0, 190),
      field('d1e0d210-0000-4000-8000-000000000002', 'shortcut', 1, 130),
      field('d1e0d210-0000-4000-8000-000000000003', 'category', 2, 140),
      field('d1e0d210-0000-4000-8000-000000000004', 'channel', 3, 120),
      field('d1e0d210-0000-4000-8000-000000000005', 'body', 4, 380),
      field('d1e0d210-0000-4000-8000-000000000006', 'usageCount', 5, 90),
      field('d1e0d210-0000-4000-8000-000000000007', 'lastUsedAt', 6, 150),
      field('d1e0d210-0000-4000-8000-000000000008', 'status', 7, 110),
    ],
  }),
  table({
    objectName: 'inboxTeamMember',
    viewName: 'inboxTeamMembers',
    universalIdentifier: 'd1e0f800-0000-4000-8000-000000000001',
    name: 'Membros das equipes',
    icon: 'IconUserPlus',
    position: 0,
    fields: [
      field('d1e0f810-0000-4000-8000-000000000001', 'name', 0, 190),
      field('d1e0f810-0000-4000-8000-000000000002', 'inboxTeam', 1, 170),
      field('d1e0f810-0000-4000-8000-000000000003', 'workspaceMember', 2, 190),
      field('d1e0f810-0000-4000-8000-000000000004', 'memberRole', 3, 110),
      field('d1e0f810-0000-4000-8000-000000000005', 'isActive', 4, 90),
      field('d1e0f810-0000-4000-8000-000000000006', 'joinedAt', 5, 150),
    ],
  }),
  table({
    objectName: 'inboxTeam',
    viewName: 'inboxTeams',
    universalIdentifier: 'd1e0f700-0000-4000-8000-000000000001',
    name: 'Equipes da inbox',
    icon: 'IconUsersGroup',
    position: 0,
    fields: [
      field('d1e0f710-0000-4000-8000-000000000001', 'name', 0, 180),
      field('d1e0f710-0000-4000-8000-000000000002', 'key', 1, 130),
      field('d1e0f710-0000-4000-8000-000000000003', 'description', 2, 300),
      field('d1e0f710-0000-4000-8000-000000000004', 'routingStrategy', 3, 140),
      field(
        'd1e0f710-0000-4000-8000-000000000005',
        'defaultResponseSlaMinutes',
        4,
        150,
      ),
      field('d1e0f710-0000-4000-8000-000000000006', 'isDefault', 5, 110),
      field('d1e0f710-0000-4000-8000-000000000007', 'status', 6, 100),
    ],
  }),
];

export const STANDARD_DIEX_VIEWS_BY_KEY = Object.fromEntries(
  STANDARD_DIEX_VIEWS.map((view) => [
    `${view.objectName}.${view.viewName}`,
    view,
  ]),
) as Record<string, StandardDiexViewDefinition>;
