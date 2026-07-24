import { PageLayoutTabLayoutMode, definePageLayout } from 'twenty-sdk/define';

import {
  COMMERCIAL_INTELLIGENCE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  COMMERCIAL_INTELLIGENCE_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  COMMERCIAL_INTELLIGENCE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  COMMERCIAL_INTELLIGENCE_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/modules/commercial-intelligence/constants/commercial-intelligence.constants';

export default definePageLayout({
  universalIdentifier: COMMERCIAL_INTELLIGENCE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Inteligência comercial',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier:
        COMMERCIAL_INTELLIGENCE_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Radar comercial',
      position: 0,
      icon: 'IconRadar',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier:
            COMMERCIAL_INTELLIGENCE_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Inteligência comercial',
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
              COMMERCIAL_INTELLIGENCE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
