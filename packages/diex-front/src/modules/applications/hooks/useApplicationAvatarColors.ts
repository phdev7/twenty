import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDiexStandardApplication } from '@/applications/utils/isDiexStandardApplication';
import { isWorkspaceCustomApplication } from '@/applications/utils/isWorkspaceCustomApplication';
import { useContext } from 'react';
import { ThemeContext } from 'diex-ui/theme-constants';
import { isDefined } from 'diex-shared/utils';

export type ApplicationAvatarColors = {
  color: string;
  backgroundColor: string;
  borderColor: string;
};

type UseApplicationAvatarColorsArgs = {
  id?: string | null;
  name?: string | null;
  universalIdentifier?: string | null;
};

export const useApplicationAvatarColors = (
  application: UseApplicationAvatarColorsArgs | null | undefined,
): ApplicationAvatarColors | undefined => {
  const { theme } = useContext(ThemeContext);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);

  if (!isDefined(application) || !isDefined(application.id)) {
    return undefined;
  }

  if (isDiexStandardApplication(application)) {
    return {
      backgroundColor: theme.color.blue3,
      borderColor: theme.color.blue4,
      color: theme.color.blue9,
    };
  }

  if (isWorkspaceCustomApplication(application, currentWorkspace)) {
    return {
      backgroundColor: theme.color.orange3,
      borderColor: theme.color.orange4,
      color: theme.color.orange9,
    };
  }

  return undefined;
};
