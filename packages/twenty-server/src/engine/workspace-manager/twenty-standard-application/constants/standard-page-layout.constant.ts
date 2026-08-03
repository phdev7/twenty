import { PageLayoutTabLayoutMode } from 'twenty-shared/types';

import {
  STANDARD_BLOCKLIST_PAGE_LAYOUT_CONFIG,
  STANDARD_CALENDAR_CHANNEL_EVENT_ASSOCIATION_PAGE_LAYOUT_CONFIG,
  STANDARD_CALENDAR_EVENT_PAGE_LAYOUT_CONFIG,
  STANDARD_CALENDAR_EVENT_PARTICIPANT_PAGE_LAYOUT_CONFIG,
  STANDARD_CALL_RECORDING_PAGE_LAYOUT_CONFIG,
  STANDARD_COMPANY_PAGE_LAYOUT_CONFIG,
  STANDARD_DASHBOARD_PAGE_LAYOUT_CONFIG,
  STANDARD_MESSAGE_CAMPAIGN_PAGE_LAYOUT_CONFIG,
  STANDARD_MESSAGE_CHANNEL_MESSAGE_ASSOCIATION_MESSAGE_FOLDER_PAGE_LAYOUT_CONFIG,
  STANDARD_MESSAGE_CHANNEL_MESSAGE_ASSOCIATION_PAGE_LAYOUT_CONFIG,
  STANDARD_MESSAGE_PARTICIPANT_PAGE_LAYOUT_CONFIG,
  STANDARD_MESSAGE_LIST_PAGE_LAYOUT_CONFIG,
  STANDARD_MESSAGE_THREAD_PAGE_LAYOUT_CONFIG,
  STANDARD_NOTE_PAGE_LAYOUT_CONFIG,
  STANDARD_OPPORTUNITY_PAGE_LAYOUT_CONFIG,
  STANDARD_PERSON_PAGE_LAYOUT_CONFIG,
  STANDARD_TASK_PAGE_LAYOUT_CONFIG,
  STANDARD_WORKFLOW_AUTOMATED_TRIGGER_PAGE_LAYOUT_CONFIG,
  STANDARD_WORKFLOW_PAGE_LAYOUT_CONFIG,
  STANDARD_WORKFLOW_RUN_PAGE_LAYOUT_CONFIG,
  STANDARD_WORKFLOW_VERSION_PAGE_LAYOUT_CONFIG,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/page-layout-config';
import { PageLayoutType } from 'src/engine/metadata-modules/page-layout/enums/page-layout-type.enum';
import { type StandardRecordPageLayouts } from 'src/engine/workspace-manager/twenty-standard-application/utils/page-layout-config/standard-page-layout-config.type';
import { type StandardPageLayoutConfig } from 'src/engine/workspace-manager/twenty-standard-application/utils/page-layout-config/standard-page-layout-config.type';

const STANDARD_DIEX_STANDALONE_PAGE_LAYOUTS = {
  accessRequests: {
    name: 'Solicitações de acesso',
    type: PageLayoutType.STANDALONE_PAGE,
    objectUniversalIdentifier: null,
    universalIdentifier: 'd1e17000-0000-4000-8000-000000000006',
    defaultTabUniversalIdentifier: 'd1e17000-0000-4000-8000-000000000007',
    tabs: {
      approvalQueue: {
        universalIdentifier: 'd1e17000-0000-4000-8000-000000000007',
        title: 'Fila de aprovação',
        position: 0,
        icon: 'IconUserQuestion',
        layoutMode: PageLayoutTabLayoutMode.CANVAS,
        widgets: {},
      },
    },
  },
  aiCommandCenter: {
    name: 'Centro de IA',
    type: PageLayoutType.STANDALONE_PAGE,
    objectUniversalIdentifier: null,
    universalIdentifier: 'd1e11000-0000-4000-8000-000000000002',
    defaultTabUniversalIdentifier: 'd1e11000-0000-4000-8000-000000000003',
    tabs: {
      governedDecisions: {
        universalIdentifier: 'd1e11000-0000-4000-8000-000000000003',
        title: 'Decisões governadas',
        position: 0,
        icon: 'IconRobot',
        layoutMode: PageLayoutTabLayoutMode.CANVAS,
        widgets: {},
      },
    },
  },
  commercialIntelligence: {
    name: 'Inteligência comercial',
    type: PageLayoutType.STANDALONE_PAGE,
    objectUniversalIdentifier: null,
    universalIdentifier: 'd1e10000-0000-4000-8000-000000000002',
    defaultTabUniversalIdentifier: 'd1e10000-0000-4000-8000-000000000003',
    tabs: {
      commercialRadar: {
        universalIdentifier: 'd1e10000-0000-4000-8000-000000000003',
        title: 'Radar comercial',
        position: 0,
        icon: 'IconRadar',
        layoutMode: PageLayoutTabLayoutMode.CANVAS,
        widgets: {},
      },
    },
  },
  customerSuccessCommandCenter: {
    name: 'Customer Success',
    type: PageLayoutType.STANDALONE_PAGE,
    objectUniversalIdentifier: null,
    universalIdentifier: 'd1e12000-0000-4000-8000-000000000002',
    defaultTabUniversalIdentifier: 'd1e12000-0000-4000-8000-000000000003',
    tabs: {
      portfolioAndRenewals: {
        universalIdentifier: 'd1e12000-0000-4000-8000-000000000003',
        title: 'Carteira e renovações',
        position: 0,
        icon: 'IconHeartHandshake',
        layoutMode: PageLayoutTabLayoutMode.CANVAS,
        widgets: {},
      },
    },
  },
  inbox: {
    name: 'Inbox comercial',
    type: PageLayoutType.STANDALONE_PAGE,
    objectUniversalIdentifier: null,
    universalIdentifier: '36d54cc2-c839-4b50-8efe-d4f9e724d20f',
    defaultTabUniversalIdentifier: '675f8b5a-0ebb-424e-a191-9ce656ed7818',
    tabs: {
      inbox: {
        universalIdentifier: '675f8b5a-0ebb-424e-a191-9ce656ed7818',
        title: 'Inbox',
        position: 0,
        icon: 'IconInbox',
        layoutMode: PageLayoutTabLayoutMode.CANVAS,
        widgets: {},
      },
    },
  },
  onboarding: {
    name: 'Primeiros passos',
    type: PageLayoutType.STANDALONE_PAGE,
    objectUniversalIdentifier: null,
    universalIdentifier: 'd1e16000-0000-4000-8000-000000000002',
    defaultTabUniversalIdentifier: 'd1e16000-0000-4000-8000-000000000003',
    tabs: {
      firstSteps: {
        universalIdentifier: 'd1e16000-0000-4000-8000-000000000003',
        title: 'Primeiros passos',
        position: 0,
        icon: 'IconRocket',
        layoutMode: PageLayoutTabLayoutMode.CANVAS,
        widgets: {},
      },
    },
  },
  renewalCommandCenter: {
    name: 'Renovações',
    type: PageLayoutType.STANDALONE_PAGE,
    objectUniversalIdentifier: null,
    universalIdentifier: 'd1e13000-0000-4000-8000-000000000002',
    defaultTabUniversalIdentifier: 'd1e13000-0000-4000-8000-000000000003',
    tabs: {
      retentionEngine: {
        universalIdentifier: 'd1e13000-0000-4000-8000-000000000003',
        title: 'Motor de retenção',
        position: 0,
        icon: 'IconRefreshDot',
        layoutMode: PageLayoutTabLayoutMode.CANVAS,
        widgets: {},
      },
    },
  },
} as const satisfies Record<string, StandardPageLayoutConfig>;

export const STANDARD_PAGE_LAYOUTS = {
  myFirstDashboard: STANDARD_DASHBOARD_PAGE_LAYOUT_CONFIG,
  blocklistRecordPage: STANDARD_BLOCKLIST_PAGE_LAYOUT_CONFIG,
  calendarChannelEventAssociationRecordPage:
    STANDARD_CALENDAR_CHANNEL_EVENT_ASSOCIATION_PAGE_LAYOUT_CONFIG,
  calendarEventRecordPage: STANDARD_CALENDAR_EVENT_PAGE_LAYOUT_CONFIG,
  calendarEventParticipantRecordPage:
    STANDARD_CALENDAR_EVENT_PARTICIPANT_PAGE_LAYOUT_CONFIG,
  callRecordingRecordPage: STANDARD_CALL_RECORDING_PAGE_LAYOUT_CONFIG,
  companyRecordPage: STANDARD_COMPANY_PAGE_LAYOUT_CONFIG,
  messageCampaignRecordPage: STANDARD_MESSAGE_CAMPAIGN_PAGE_LAYOUT_CONFIG,
  messageChannelMessageAssociationRecordPage:
    STANDARD_MESSAGE_CHANNEL_MESSAGE_ASSOCIATION_PAGE_LAYOUT_CONFIG,
  messageChannelMessageAssociationMessageFolderRecordPage:
    STANDARD_MESSAGE_CHANNEL_MESSAGE_ASSOCIATION_MESSAGE_FOLDER_PAGE_LAYOUT_CONFIG,
  messageParticipantRecordPage: STANDARD_MESSAGE_PARTICIPANT_PAGE_LAYOUT_CONFIG,
  messageListRecordPage: STANDARD_MESSAGE_LIST_PAGE_LAYOUT_CONFIG,
  messageThreadRecordPage: STANDARD_MESSAGE_THREAD_PAGE_LAYOUT_CONFIG,
  noteRecordPage: STANDARD_NOTE_PAGE_LAYOUT_CONFIG,
  opportunityRecordPage: STANDARD_OPPORTUNITY_PAGE_LAYOUT_CONFIG,
  personRecordPage: STANDARD_PERSON_PAGE_LAYOUT_CONFIG,
  taskRecordPage: STANDARD_TASK_PAGE_LAYOUT_CONFIG,
  workflowRecordPage: STANDARD_WORKFLOW_PAGE_LAYOUT_CONFIG,
  workflowAutomatedTriggerRecordPage:
    STANDARD_WORKFLOW_AUTOMATED_TRIGGER_PAGE_LAYOUT_CONFIG,
  workflowVersionRecordPage: STANDARD_WORKFLOW_VERSION_PAGE_LAYOUT_CONFIG,
  workflowRunRecordPage: STANDARD_WORKFLOW_RUN_PAGE_LAYOUT_CONFIG,
  ...STANDARD_DIEX_STANDALONE_PAGE_LAYOUTS,
} as const;

const { myFirstDashboard: _myFirstDashboard, ...recordPageLayouts } =
  STANDARD_PAGE_LAYOUTS;

export const STANDARD_RECORD_PAGE_LAYOUTS =
  recordPageLayouts satisfies StandardRecordPageLayouts;
