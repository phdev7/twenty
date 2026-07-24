import { registerEnumType } from '@nestjs/graphql';

export enum ApplicationRegistrationSourceType {
  NPM = 'npm',
  TARBALL = 'tarball',
  LOCAL = 'local',
  BUNDLED = 'bundled',
  OAUTH_ONLY = 'oauth-only',
}

registerEnumType(ApplicationRegistrationSourceType, {
  name: 'ApplicationRegistrationSourceType',
});
