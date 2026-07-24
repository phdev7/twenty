import { PageLayoutTabLayoutMode, definePageLayout } from 'twenty-sdk/define';

import {
  RENEWAL_COMMAND_CENTER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  RENEWAL_COMMAND_CENTER_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  RENEWAL_COMMAND_CENTER_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  RENEWAL_COMMAND_CENTER_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/modules/renewal-command-center/constants/renewal-command-center.constants';

export default definePageLayout({
  universalIdentifier: RENEWAL_COMMAND_CENTER_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Renovações',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier:
        RENEWAL_COMMAND_CENTER_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Motor de retenção',
      position: 0,
      icon: 'IconRefreshDot',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier:
            RENEWAL_COMMAND_CENTER_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Motor de retenção',
          type: 'FRONT_COMPONENT',
          gridPosition: {
            row: 0,
            column: 0,
            rowSpan: 18,
            columnSpan: 12,
          },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              RENEWAL_COMMAND_CENTER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
