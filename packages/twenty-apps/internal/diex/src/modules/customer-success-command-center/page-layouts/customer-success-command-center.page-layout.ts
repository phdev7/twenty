import { PageLayoutTabLayoutMode, definePageLayout } from 'twenty-sdk/define';

import {
  CUSTOMER_SUCCESS_COMMAND_CENTER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  CUSTOMER_SUCCESS_COMMAND_CENTER_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  CUSTOMER_SUCCESS_COMMAND_CENTER_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  CUSTOMER_SUCCESS_COMMAND_CENTER_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/modules/customer-success-command-center/constants/customer-success-command-center.constants';

export default definePageLayout({
  universalIdentifier:
    CUSTOMER_SUCCESS_COMMAND_CENTER_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Customer Success',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier:
        CUSTOMER_SUCCESS_COMMAND_CENTER_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Carteira e renovações',
      position: 0,
      icon: 'IconHeartHandshake',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier:
            CUSTOMER_SUCCESS_COMMAND_CENTER_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Customer Success',
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
              CUSTOMER_SUCCESS_COMMAND_CENTER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
