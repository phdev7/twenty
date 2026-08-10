import { defineApplication } from 'diex-sdk/define';

import {
  APPLICATION_UNIVERSAL_IDENTIFIER,
  DISCORD_BOT_TOKEN_VARIABLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'Diex Discord',
  description:
    'Connect Discord to Diex. Workflow steps post, update, and delete bot messages and add reactions using a Discord bot token shared across the deployment.',
  logoUrl: 'public/diex-discord.svg',
  author: 'Diex',
  category: 'Communication',
  websiteUrl: 'https://docs.diex.com/developers/extend/apps/getting-started',
  termsUrl: 'https://www.diex.com/terms',
  emailSupport: 'contact@diex.com',
  issueReportUrl: 'https://github.com/diexhq/diex/issues',
  applicationVariables: {
    DISCORD_BOT_TOKEN: {
      universalIdentifier: DISCORD_BOT_TOKEN_VARIABLE_UNIVERSAL_IDENTIFIER,
      description:
        'Bot token from your Discord application (Developer Portal → Bot tab → Reset Token). Used with the `Bot` auth prefix to call the Discord REST API. The same token authenticates the bot across every guild it has been invited to.',
      isSecret: true,
    },
  },
});
