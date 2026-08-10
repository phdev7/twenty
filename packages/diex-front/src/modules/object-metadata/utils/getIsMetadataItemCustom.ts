import { isDefined } from 'diex-shared/utils';

export const getIsMetadataItemCustom = (
  metadataItem: { applicationId?: string | null },
  workspaceCustomApplicationId?: string | null,
) =>
  isDefined(metadataItem.applicationId) &&
  metadataItem.applicationId === workspaceCustomApplicationId;
