import { DIEX_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER } from 'diex-shared/application';
import { isDefined } from 'diex-shared/utils';

type ApplicationLike = {
  universalIdentifier?: string | null;
};

export const isDiexStandardApplication = (
  application: ApplicationLike | null | undefined,
): boolean =>
  isDefined(application?.universalIdentifier) &&
  application.universalIdentifier ===
    DIEX_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER;
