import { useQuery } from '@apollo/client/react';
import { DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER } from 'twenty-shared/application';
import { FindManyApplicationsDocument } from '~/generated-metadata/graphql';
import { SettingsApplicationsTable } from '~/pages/settings/applications/components/SettingsApplicationsTable';

export const SettingsApplicationsInstalledTab = () => {
  const { data } = useQuery(FindManyApplicationsDocument);

  const applications = (data?.findManyApplications ?? []).filter(
    ({ universalIdentifier }) =>
      universalIdentifier !== DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
  );

  if (applications.length === 0) {
    return null;
  }

  return <SettingsApplicationsTable applications={applications} />;
};
