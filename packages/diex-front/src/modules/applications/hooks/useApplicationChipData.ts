import {
  type ApplicationAvatarColors,
  useApplicationAvatarColors,
} from '@/applications/hooks/useApplicationAvatarColors';
import { isDiexStandardApplication } from '@/applications/utils/isDiexStandardApplication';
import { isWorkspaceCustomApplication } from '@/applications/utils/isWorkspaceCustomApplication';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { t } from '@lingui/core/macro';
import { isDefined } from 'diex-shared/utils';
import CustomLogo from '~/pages/settings/applications/assets/custom-illustrations/custom-logo.webp';

type UseApplicationChipDataArgs = {
  applicationId?: string | null;
  fallbackApplicationData?: {
    logo?: string | null;
    name?: string | null;
  };
};

type ApplicationChipData = {
  name: string;
  seed: string;
  colors?: ApplicationAvatarColors;
  logo?: string;
};

type UseApplicationChipDataReturnType = {
  applicationChipData: ApplicationChipData;
};

export const useApplicationChipData = ({
  applicationId,
  fallbackApplicationData,
}: UseApplicationChipDataArgs): UseApplicationChipDataReturnType => {
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);

  const application = currentWorkspace?.installedApplications.find(
    (installedApplication) => installedApplication.id === applicationId,
  );

  const colors = useApplicationAvatarColors(application);

  if (!isDefined(application)) {
    return {
      applicationChipData: {
        name: fallbackApplicationData?.name ?? '',
        logo: fallbackApplicationData?.logo ?? '',
        seed: fallbackApplicationData?.name ?? '',
      },
    };
  }

  const isStandard = isDiexStandardApplication(application);

  const isCustom = isWorkspaceCustomApplication(application, currentWorkspace);

  const displayName = isStandard
    ? t`Diex CRM`
    : isCustom
      ? t`Custom`
      : application.name;

  const logo = isStandard
    ? new URL('/images/brand/logomark.svg', window.location.href).toString()
    : isCustom
      ? new URL(CustomLogo, window.location.href).toString()
      : (application.logoUrl ?? undefined);

  return {
    applicationChipData: {
      name: displayName,
      seed: application.name,
      colors,
      logo,
    },
  };
};
