import { type ConnectedAccountProvider } from 'diex-shared/types';

type ReplyContextLoading = {
  loading: true;
};

export type ReplyContextReady = {
  loading: false;
  to: string;
  subject: string;
  inReplyTo: string;
  connectedAccountId: string;
  connectedAccountProvider: ConnectedAccountProvider;
};

export type ReplyContext = ReplyContextLoading | ReplyContextReady;
