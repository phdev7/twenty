import { DIEX_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER } from 'diex-shared/application';
import { isDefined } from 'diex-shared/utils';

import {
  ApplicationException,
  ApplicationExceptionCode,
} from 'src/engine/core-modules/application/application.exception';
import { type FlatApplicationCacheMaps } from 'src/engine/core-modules/application/types/flat-application-cache-maps.type';

export const getDiexStandardApplicationIdOrThrow = (
  flatApplicationMaps: FlatApplicationCacheMaps,
): string => {
  const diexStandardApplicationId =
    flatApplicationMaps.idByUniversalIdentifier[
      DIEX_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER
    ];

  if (!isDefined(diexStandardApplicationId)) {
    throw new ApplicationException(
      'Could not find the diex-standard application in the workspace cache',
      ApplicationExceptionCode.APPLICATION_NOT_FOUND,
    );
  }

  return diexStandardApplicationId;
};
