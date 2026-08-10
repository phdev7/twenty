import { type PageLayoutType } from 'diex-shared/types';
import { v4 as uuidv4 } from 'uuid';

export const getPageLayoutBaseFile = ({
  name,
  type,
}: {
  name: string;
  type: PageLayoutType;
}) => {
  return `import { definePageLayout, PageLayoutType } from 'diex-sdk/define';

export default definePageLayout({
  universalIdentifier: '${uuidv4()}',
  name: '${name}',
  type: PageLayoutType.${type},
  tabs: [
    {
      universalIdentifier: '${uuidv4()}',
      title: 'Overview',
      widgets: [],
    },
  ],
});
`;
};
