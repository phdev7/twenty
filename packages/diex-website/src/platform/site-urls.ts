// Every external destination the site links to, in one place. Sections and
// data files never inline these.
export const SITE_URLS: Record<
  | 'appWelcome'
  | 'calBooking'
  | 'discord'
  | 'docsApi'
  | 'docsDevelopers'
  | 'docsGettingStarted'
  | 'docsMcp'
  | 'docsUserGuide'
  | 'github'
  | 'linkedin'
  | 'trustCenter'
  | 'x',
  string
> = {
  appWelcome: 'https://app.diex.com/welcome',
  calBooking: 'https://cal.com/forms/f7841033-0a20-4958-8c92-4e34ec128a81',
  discord: 'https://discord.gg/cx5n4Jzs57',
  docsApi: 'https://docs.diex.com/developers/extend/api',
  docsDevelopers: 'https://docs.diex.com/developers/introduction',
  docsGettingStarted: 'https://docs.diex.com/getting-started/introduction',
  docsMcp: 'https://docs.diex.com/user-guide/ai/capabilities/mcp',
  docsUserGuide: 'https://docs.diex.com/user-guide/introduction',
  github: 'https://github.com/diexhq/diex',
  linkedin: 'https://www.linkedin.com/company/diex',
  trustCenter: 'https://trust.diex.com',
  x: 'https://x.com/diexcrm',
};
