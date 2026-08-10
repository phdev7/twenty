import { type CommonPropertiesJwtPayload } from 'src/engine/core-modules/auth/types/common-properties-jwt-payload.type';
import { JwtTokenTypeEnum } from 'src/engine/core-modules/auth/types/jwt-token-type.enum';

// Carries the identity across the redirect to Meta and back. The callback
// arrives with no session of its own, so everything the connection is scoped to
// has to be inside this signed, short-lived token: a callback that trusted
// query parameters would let anyone attach an ad account to another agency.
export type MetaAdsOAuthStateJwtPayload = CommonPropertiesJwtPayload & {
  type: JwtTokenTypeEnum.META_ADS_OAUTH_STATE;
  agencyId: string;
  userId: string;
  clientWorkspaceId: string | null;
  // Workspace the agency manager was in when the flow started, so the callback
  // can send them back to the host they came from rather than to the default
  // one, which on a custom domain is not where they are.
  redirectWorkspaceId: string;
};
