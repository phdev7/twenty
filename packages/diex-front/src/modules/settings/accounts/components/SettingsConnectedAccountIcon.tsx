import { type ConnectedAccount } from '@/accounts/types/ConnectedAccount';
import { ConnectedAccountProvider } from 'diex-shared/types';
import { isDefined } from 'diex-shared/utils';
import {
  IconAt,
  IconCalendarEvent,
  type IconComponent,
  type IconComponentProps,
  IconGoogle,
  IconMail,
  IconMicrosoft,
  IconSend,
} from 'diex-ui/icon';
import { useContext } from 'react';
import { ThemeContext } from 'diex-ui/theme-constants';

const ImapSmtpCaldavIcon = (
  props: IconComponentProps & { account: ConnectedAccount },
) => {
  const { theme } = useContext(ThemeContext);
  const { account } = props;

  const hasImap = isDefined(account.connectionParameters?.IMAP);
  const hasSmtp = isDefined(account.connectionParameters?.SMTP);
  const hasCaldav = isDefined(account.connectionParameters?.CALDAV);

  let IconToShow: IconComponent;

  if (hasImap && hasSmtp && hasCaldav) {
    IconToShow = IconAt;
  } else if (hasImap && hasCaldav) {
    IconToShow = IconAt;
  } else if (hasImap && hasSmtp) {
    IconToShow = IconMail;
  } else if (hasImap) {
    IconToShow = IconMail;
  } else if (hasSmtp) {
    IconToShow = IconSend;
  } else if (hasCaldav) {
    IconToShow = IconCalendarEvent;
  } else {
    IconToShow = IconMail;
  }

  return (
    <IconToShow
      className={props.className}
      style={props.style}
      size={props.size}
      stroke={props.stroke}
      color={props.color || theme.font.color.primary}
    />
  );
};

const getIconForProvider = (account: ConnectedAccount): IconComponent => {
  switch (account.provider) {
    case ConnectedAccountProvider.IMAP_SMTP_CALDAV:
      return (props) => (
        <ImapSmtpCaldavIcon
          account={account}
          className={props.className}
          style={props.style}
          size={props.size}
          stroke={props.stroke}
          color={props.color}
        />
      );
    case ConnectedAccountProvider.GOOGLE:
      return IconGoogle;
    case ConnectedAccountProvider.MICROSOFT:
      return IconMicrosoft;
    default:
      return IconMail;
  }
};

export const SettingsConnectedAccountIcon = ({
  account,
}: {
  account: ConnectedAccount;
}): IconComponent => {
  return getIconForProvider(account);
};
