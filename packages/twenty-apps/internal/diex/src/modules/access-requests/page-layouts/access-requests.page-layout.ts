import { PageLayoutTabLayoutMode, definePageLayout } from 'twenty-sdk/define';

import {
  ACCESS_REQUESTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  ACCESS_REQUESTS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  ACCESS_REQUESTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  ACCESS_REQUESTS_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/modules/access-requests/constants/access-request.constants';

export default definePageLayout({
  universalIdentifier: ACCESS_REQUESTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Solicitações de acesso',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: ACCESS_REQUESTS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Fila de aprovação',
      position: 0,
      icon: 'IconUserQuestion',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier:
            ACCESS_REQUESTS_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Solicitações de acesso',
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
              ACCESS_REQUESTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
