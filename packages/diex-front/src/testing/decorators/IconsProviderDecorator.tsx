import { type Decorator } from '@storybook/react-vite';
import { IconsProvider } from 'diex-ui/icon';

export const IconsProviderDecorator: Decorator = (Story) => {
  return (
    <IconsProvider>
      <Story />
    </IconsProvider>
  );
};
