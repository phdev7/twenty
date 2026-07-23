import { PageLayoutTabLayoutMode, definePageLayout } from 'twenty-sdk/define';

import {
  INBOX_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  INBOX_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  INBOX_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  INBOX_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-universal-identifiers';

export default definePageLayout({
  universalIdentifier: INBOX_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Inbox comercial',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: INBOX_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Inbox',
      position: 0,
      icon: 'IconInbox',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: INBOX_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Inbox comercial',
          type: 'FRONT_COMPONENT',
          gridPosition: {
            row: 0,
            column: 0,
            rowSpan: 14,
            columnSpan: 12,
          },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              INBOX_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
