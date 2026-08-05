import { STANDARD_OBJECTS } from 'twenty-shared/metadata';

import { NavigationMenuItemType } from 'src/engine/metadata-modules/navigation-menu-item/enums/navigation-menu-item-type.enum';

export const STANDARD_NAVIGATION_MENU_ITEMS = {
  allCompanies: {
    universalIdentifier: '20202020-b001-4b01-8b01-c0aba11c0001',
    type: NavigationMenuItemType.OBJECT,
    viewUniversalIdentifier:
      STANDARD_OBJECTS.company.views.allCompanies.universalIdentifier,
    position: 0,
  },
  allPeople: {
    universalIdentifier: '20202020-b005-4b05-8b05-c0aba11c0005',
    type: NavigationMenuItemType.OBJECT,
    viewUniversalIdentifier:
      STANDARD_OBJECTS.person.views.allPeople.universalIdentifier,
    position: 1,
  },
  allOpportunities: {
    universalIdentifier: '20202020-b004-4b04-8b04-c0aba11c0004',
    type: NavigationMenuItemType.OBJECT,
    viewUniversalIdentifier:
      STANDARD_OBJECTS.opportunity.views.allOpportunities.universalIdentifier,
    position: 2,
  },
  allTasks: {
    universalIdentifier: '20202020-b006-4b06-8b06-c0aba11c0006',
    type: NavigationMenuItemType.OBJECT,
    viewUniversalIdentifier:
      STANDARD_OBJECTS.task.views.allTasks.universalIdentifier,
    position: 3,
  },
  agenda: {
    universalIdentifier: 'd1e18030-0000-4000-8000-000000000001',
    type: NavigationMenuItemType.VIEW,
    name: 'Agenda',
    icon: 'IconCalendarEvent',
    color: 'purple',
    position: -0.5,
    viewUniversalIdentifier:
      STANDARD_OBJECTS.task.views.agenda.universalIdentifier,
  },
  allNotes: {
    universalIdentifier: '20202020-b003-4b03-8b03-c0aba11c0003',
    type: NavigationMenuItemType.OBJECT,
    viewUniversalIdentifier:
      STANDARD_OBJECTS.note.views.allNotes.universalIdentifier,
    position: 4,
  },
  allDashboards: {
    universalIdentifier: '20202020-b002-4b02-8b02-c0aba11c0002',
    type: NavigationMenuItemType.OBJECT,
    viewUniversalIdentifier:
      STANDARD_OBJECTS.dashboard.views.allDashboards.universalIdentifier,
    position: 5,
  },
  workflowsFolder: {
    universalIdentifier: '20202020-b007-4b07-8b07-c0aba11c0007',
    type: NavigationMenuItemType.FOLDER,
    name: 'Automações',
    icon: 'IconSettingsAutomation',
    position: 6,
  },
  workflowsFolderAllWorkflows: {
    universalIdentifier: '20202020-b008-4b08-8b08-c0aba11c0008',
    type: NavigationMenuItemType.OBJECT,
    viewUniversalIdentifier:
      STANDARD_OBJECTS.workflow.views.allWorkflows.universalIdentifier,
    folderUniversalIdentifier: '20202020-b007-4b07-8b07-c0aba11c0007',
    position: 0,
  },
  workflowsFolderAllWorkflowRuns: {
    universalIdentifier: '20202020-b009-4b09-8b09-c0aba11c0009',
    type: NavigationMenuItemType.OBJECT,
    viewUniversalIdentifier:
      STANDARD_OBJECTS.workflowRun.views.allWorkflowRuns.universalIdentifier,
    folderUniversalIdentifier: '20202020-b007-4b07-8b07-c0aba11c0007',
    position: 1,
  },
  workflowsFolderAllWorkflowVersions: {
    universalIdentifier: '20202020-b00a-4b0a-8b0a-c0aba11c000a',
    type: NavigationMenuItemType.OBJECT,
    viewUniversalIdentifier:
      STANDARD_OBJECTS.workflowVersion.views.allWorkflowVersions
        .universalIdentifier,
    folderUniversalIdentifier: '20202020-b007-4b07-8b07-c0aba11c0007',
    position: 2,
  },
  diexFolder: {
    universalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
    type: NavigationMenuItemType.FOLDER,
    name: 'Cadastros Diex',
    icon: 'IconSparkles',
    color: 'purple',
    position: 20,
  },
  offers: {
    universalIdentifier: 'd1e08000-0000-4000-8000-000000000002',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconPackage',
    position: 2,
    viewUniversalIdentifier: 'd1e07000-0000-4000-8000-000000000001',
    folderUniversalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
  },
  commercialSignals: {
    universalIdentifier: 'd1e08000-0000-4000-8000-000000000003',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconRadar',
    position: 1,
    viewUniversalIdentifier: 'd1e07000-0000-4000-8000-000000000002',
    folderUniversalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
  },
  customerSuccess: {
    universalIdentifier: 'd1e08000-0000-4000-8000-000000000004',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconHeartHandshake',
    position: 7,
    viewUniversalIdentifier: 'd1e07000-0000-4000-8000-000000000003',
    folderUniversalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
  },
  successMilestones: {
    universalIdentifier: 'd1e08000-0000-4000-8000-000000000005',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconFlag3',
    position: 7,
    viewUniversalIdentifier: 'd1e07000-0000-4000-8000-000000000004',
    folderUniversalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
  },
  aiGovernance: {
    universalIdentifier: 'd1e08000-0000-4000-8000-000000000006',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconShieldCheck',
    position: 4,
    viewUniversalIdentifier: 'd1e07000-0000-4000-8000-000000000005',
    folderUniversalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
  },
  commercialTasks: {
    universalIdentifier: 'd1e08000-0000-4000-8000-000000000020',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconTargetArrow',
    position: 12,
    viewUniversalIdentifier: 'd1e07000-0000-4000-8000-000000000010',
  },
  operationalTasks: {
    universalIdentifier: 'd1e08000-0000-4000-8000-000000000021',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconChecklist',
    position: 13,
    viewUniversalIdentifier: 'd1e07000-0000-4000-8000-000000000011',
  },
  workspaceContext: {
    universalIdentifier: 'd1e08000-0000-4000-8000-000000000022',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconBook2',
    position: 14,
    viewUniversalIdentifier: 'd1e07000-0000-4000-8000-000000000012',
    folderUniversalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
  },
  inboxSavedReplies: {
    universalIdentifier: 'd1e0d300-0000-4000-8000-000000000001',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconBolt',
    position: 8,
    viewUniversalIdentifier: 'd1e0d200-0000-4000-8000-000000000001',
    folderUniversalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
  },
  inboxLabels: {
    universalIdentifier: 'd1e0e300-0000-4000-8000-000000000001',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconTags',
    position: 9,
    viewUniversalIdentifier: 'd1e0e200-0000-4000-8000-000000000001',
    folderUniversalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
  },
  inboxTeams: {
    universalIdentifier: 'd1e0f730-0000-4000-8000-000000000001',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconUsersGroup',
    position: 10,
    viewUniversalIdentifier: 'd1e0f700-0000-4000-8000-000000000001',
    folderUniversalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
  },
  inboxTeamMembers: {
    universalIdentifier: 'd1e0f830-0000-4000-8000-000000000001',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconUserPlus',
    position: 11,
    viewUniversalIdentifier: 'd1e0f800-0000-4000-8000-000000000001',
    folderUniversalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
  },
  inboxMentions: {
    universalIdentifier: 'd1e0fa50-0000-4000-8000-000000000001',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconAt',
    position: 12,
    viewUniversalIdentifier: 'd1e0fa40-0000-4000-8000-000000000001',
    folderUniversalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
  },
  inboxMacros: {
    universalIdentifier: 'd1e0fb50-0000-4000-8000-000000000001',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconWand',
    position: 13,
    viewUniversalIdentifier: 'd1e0fb40-0000-4000-8000-000000000001',
    folderUniversalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
  },
  inboxAutomations: {
    universalIdentifier: 'd1e0fd50-0000-4000-8000-000000000001',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconSettingsAutomation',
    position: 14,
    viewUniversalIdentifier: 'd1e0fd40-0000-4000-8000-000000000001',
    folderUniversalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
  },
  inboxConversationEvents: {
    universalIdentifier: 'd1e0fc50-0000-4000-8000-000000000001',
    type: NavigationMenuItemType.VIEW,
    icon: 'IconTimelineEvent',
    position: 15,
    viewUniversalIdentifier: 'd1e0fc40-0000-4000-8000-000000000001',
    folderUniversalIdentifier: 'd1e08000-0000-4000-8000-000000000001',
  },
  accessRequests: {
    universalIdentifier: 'd1e17000-0000-4000-8000-000000000004',
    type: NavigationMenuItemType.PAGE_LAYOUT,
    name: 'Solicitações de acesso',
    icon: 'IconUserQuestion',
    color: 'yellow',
    position: -4,
    pageLayoutUniversalIdentifier: 'd1e17000-0000-4000-8000-000000000006',
  },
  aiCommandCenter: {
    universalIdentifier: 'd1e11000-0000-4000-8000-000000000005',
    type: NavigationMenuItemType.PAGE_LAYOUT,
    name: 'Governança de IA',
    icon: 'IconRobot',
    color: 'blue',
    position: -3,
    pageLayoutUniversalIdentifier: 'd1e11000-0000-4000-8000-000000000002',
  },
  commercialIntelligence: {
    universalIdentifier: 'd1e10000-0000-4000-8000-000000000005',
    type: NavigationMenuItemType.PAGE_LAYOUT,
    name: 'Inteligência Comercial',
    icon: 'IconRadar',
    color: 'blue',
    position: -4,
    pageLayoutUniversalIdentifier: 'd1e10000-0000-4000-8000-000000000002',
  },
  customerSuccessCommandCenter: {
    universalIdentifier: 'd1e12000-0000-4000-8000-000000000005',
    type: NavigationMenuItemType.PAGE_LAYOUT,
    name: 'Customer Success',
    icon: 'IconHeartHandshake',
    color: 'blue',
    position: -2,
    pageLayoutUniversalIdentifier: 'd1e12000-0000-4000-8000-000000000002',
  },
  inbox: {
    universalIdentifier: 'c07d3567-a2f3-4b86-b538-5d05ae2d0801',
    type: NavigationMenuItemType.PAGE_LAYOUT,
    name: 'Inbox Comercial',
    icon: 'IconInbox',
    color: 'green',
    position: -5,
    pageLayoutUniversalIdentifier: '36d54cc2-c839-4b50-8efe-d4f9e724d20f',
  },
  onboarding: {
    universalIdentifier: 'd1e16000-0000-4000-8000-000000000005',
    type: NavigationMenuItemType.PAGE_LAYOUT,
    name: 'Primeiros passos',
    icon: 'IconRocket',
    color: 'purple',
    position: -6,
    pageLayoutUniversalIdentifier: 'd1e16000-0000-4000-8000-000000000002',
  },
  renewalCommandCenter: {
    universalIdentifier: 'd1e13000-0000-4000-8000-000000000005',
    type: NavigationMenuItemType.PAGE_LAYOUT,
    name: 'Renovações',
    icon: 'IconRefreshDot',
    color: 'green',
    position: -1,
    pageLayoutUniversalIdentifier: 'd1e13000-0000-4000-8000-000000000002',
  },
} as const;

export type StandardNavigationMenuItemDefinition = {
  universalIdentifier: string;
  type: NavigationMenuItemType;
  name?: string;
  icon?: string;
  color?: string;
  position: number;
  viewUniversalIdentifier?: string;
  folderUniversalIdentifier?: string;
  pageLayoutUniversalIdentifier?: string;
};

export const STANDARD_NAVIGATION_MENU_ITEM_DEFAULT_COLORS: Partial<
  Record<keyof typeof STANDARD_NAVIGATION_MENU_ITEMS, string>
> = {
  allCompanies: 'blue',
  allPeople: 'blue',
  allTasks: 'turquoise',
  agenda: 'purple',
  allNotes: 'turquoise',
  allOpportunities: 'red',
  workflowsFolder: 'orange',
  allDashboards: 'gray',
  workflowsFolderAllWorkflows: 'gray',
  workflowsFolderAllWorkflowRuns: 'gray',
  workflowsFolderAllWorkflowVersions: 'gray',
};
