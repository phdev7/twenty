import { PageLayoutTabLayoutMode, definePageLayout } from 'twenty-sdk/define';

import {
  ONBOARDING_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  ONBOARDING_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  ONBOARDING_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  ONBOARDING_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/modules/onboarding/constants/onboarding.constants';

export default definePageLayout({
  universalIdentifier: ONBOARDING_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Primeiros passos',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: ONBOARDING_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Primeiros passos',
      position: 0,
      icon: 'IconRocket',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: ONBOARDING_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Primeiros passos',
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
              ONBOARDING_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
