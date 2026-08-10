/* oxlint-disable diex/no-navigate-prefer-link */
import { RecordTableEmptyStateDisplay } from '@/object-record/record-table/empty-state/components/RecordTableEmptyStateDisplay';
import { t } from '@lingui/core/macro';
import { SettingsPath } from 'diex-shared/types';
import { IconSettings } from 'diex-ui/icon';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';

export const RecordTableEmptyStateRemote = () => {
  const navigate = useNavigateSettings();

  const handleButtonClick = () => {
    navigate(SettingsPath.Integrations);
  };

  return (
    <RecordTableEmptyStateDisplay
      buttonTitle={t`Go to Settings`}
      subTitle={t`If this is unexpected, please verify your settings.`}
      title={t`No Data Available for Remote Table`}
      ButtonIcon={IconSettings}
      animatedPlaceholderType="noRecord"
      onClick={handleButtonClick}
    />
  );
};
