import { PageLayoutTabLayoutMode, definePageLayout } from 'twenty-sdk/define';

import {
  AI_COMMAND_CENTER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  AI_COMMAND_CENTER_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  AI_COMMAND_CENTER_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  AI_COMMAND_CENTER_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/modules/ai-command-center/constants/ai-command-center.constants';

export default definePageLayout({
  universalIdentifier: AI_COMMAND_CENTER_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Centro de IA',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier:
        AI_COMMAND_CENTER_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Decisões governadas',
      position: 0,
      icon: 'IconRobot',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier:
            AI_COMMAND_CENTER_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Centro de IA',
          type: 'FRONT_COMPONENT',
          gridPosition: {
            row: 0,
            column: 0,
            rowSpan: 16,
            columnSpan: 12,
          },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              AI_COMMAND_CENTER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
