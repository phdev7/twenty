import { defineFrontComponent } from 'diex-sdk/define';
import {
  VisibilityHidden,
  VisibilityHiddenInput,
} from 'diex-ui/accessibility';
import { ThemeProvider } from 'diex-ui/theme-constants';
import {
  H1Title,
  H1TitleFontColor,
  H2Title,
  H3Title,
  Label,
  LinkifiedText,
  SeparatorLineText,
  StyledText,
  StyledTextContent,
  StyledTextWrapper,
} from 'diex-ui/typography';

import {
  ComponentGallery,
  type GalleryEntry,
} from '../shared/front-components/component-gallery';

const TYPOGRAPHY_ENTRIES: GalleryEntry[] = [
  {
    name: 'H1Title',
    node: <H1Title title="Heading 1" fontColor={H1TitleFontColor.Primary} />,
  },
  {
    name: 'H2Title',
    node: <H2Title title="Heading 2" />,
  },
  {
    name: 'H3Title',
    node: <H3Title title="Heading 3" />,
  },
  {
    name: 'Label',
    node: <Label variant="default">Label</Label>,
  },
  {
    name: 'LinkifiedText',
    node: <LinkifiedText text="Visit https://diex.com now" />,
  },
  {
    name: 'SeparatorLineText',
    node: <SeparatorLineText>or</SeparatorLineText>,
  },
  {
    name: 'StyledText',
    node: <StyledText text="Styled text" />,
  },
  {
    name: 'StyledTextContent',
    node: <StyledTextContent>Content</StyledTextContent>,
  },
  {
    name: 'StyledTextWrapper',
    node: <StyledTextWrapper>Wrapper</StyledTextWrapper>,
  },
  {
    name: 'VisibilityHidden',
    node: <VisibilityHidden>Screen-reader only</VisibilityHidden>,
  },
  {
    name: 'VisibilityHiddenInput',
    node: <VisibilityHiddenInput readOnly value="" />,
  },
];

const TypographyGallery = () => (
  <ThemeProvider colorScheme="light">
    <ComponentGallery
      title="diex-ui/typography + accessibility"
      entries={TYPOGRAPHY_ENTRIES}
    />
  </ThemeProvider>
);

export default defineFrontComponent({
  universalIdentifier: 'test-20ui0-0000-0000-0000-000000000104',
  name: 'diex-ui-typography-gallery',
  description:
    'Renders every diex-ui/typography and accessibility component in the sandbox',
  component: TypographyGallery,
});
