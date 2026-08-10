import { defineApplication } from 'diex-sdk/define';

import {
  APPLICATION_UNIVERSAL_IDENTIFIER,
  DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'Diex Slack',
  description:
    'Connect Slack to Diex. Each workspace member (or a shared workspace connection) can authenticate Slack; workflow steps then post messages, ephemerals, updates, deletes, and reactions on behalf of that connection.',
  logoUrl: 'public/diex-slack.svg',
  author: 'Diex',
  category: 'Communication',
  websiteUrl: 'https://docs.diex.com/developers/extend/apps/getting-started',
  termsUrl: 'https://www.diex.com/terms',
  emailSupport: 'contact@diex.com',
  issueReportUrl: 'https://github.com/diexhq/diex/issues',
  defaultRoleUniversalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  serverVariables: {
    SLACK_CLIENT_ID: {
      description:
        'OAuth client ID from your Slack app (api.slack.com/apps). Public in OAuth flows; only the client secret must stay confidential.',
      isSecret: false,
      isRequired: true,
    },
    SLACK_CLIENT_SECRET: {
      description:
        'OAuth client secret from your Slack app. Stored encrypted; never exposed in API responses.',
      isSecret: true,
      isRequired: true,
    },
  },
});
