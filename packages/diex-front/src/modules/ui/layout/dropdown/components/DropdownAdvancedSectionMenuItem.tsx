import { Trans } from '@lingui/react/macro';
import { IconSettings } from 'diex-ui/icon';
import { MenuItem } from 'diex-ui/navigation';

type DropdownAdvancedSectionMenuItemProps = {
  onClick: () => void;
};

export const DropdownAdvancedSectionMenuItem = ({
  onClick,
}: DropdownAdvancedSectionMenuItemProps) => (
  <MenuItem
    text={<Trans>Advanced</Trans>}
    LeftIcon={IconSettings}
    onClick={onClick}
    hasSubMenu
  />
);
