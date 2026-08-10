import { addDays } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';

import { SaveAndCancelButtons } from '@/settings/components/SaveAndCancelButtons/SaveAndCancelButtons';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsSkeletonLoader } from '@/settings/components/SettingsSkeletonLoader';
import { SettingsDevelopersRoleSelector } from '@/settings/developers/components/SettingsDevelopersRoleSelector';
import { EXPIRATION_DATES } from '@/settings/developers/constants/ExpirationDates';
import { apiKeyTokenFamilyState } from '@/settings/developers/states/apiKeyTokenFamilyState';
import { MCP_SETUP } from '@/settings/mcp-and-apis/constants/McpSetup';
import { Select } from '@/ui/input/components/Select';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useStore } from 'jotai';
import { useSearchParams } from 'react-router-dom';
import { Key } from 'ts-key-enum';
import { SettingsPath } from 'diex-shared/types';
import { getSettingsPath, isDefined } from 'diex-shared/utils';
import { H2Title } from 'diex-ui/typography';
import { Section } from 'diex-ui/layout';
import {
  CreateApiKeyDocument,
  GenerateApiKeyTokenDocument,
  GetApiKeyRolesDocument,
  GetApiKeysDocument,
} from '~/generated-metadata/graphql';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';
import { SETTINGS_API_WEBHOOKS_TABS } from '~/pages/settings/api-webhooks/constants/SettingsApiWebhooksTabs';

export const SettingsDevelopersApiKeysNew = () => {
  const { t } = useLingui();
  const [searchParams] = useSearchParams();
  const isMcpSetup = searchParams.get('purpose') === 'mcp';
  const [generateOneApiKeyToken] = useMutation(GenerateApiKeyTokenDocument);
  const navigateSettings = useNavigateSettings();
  const { data: rolesData, loading: rolesLoading } = useQuery(
    GetApiKeyRolesDocument,
  );
  const roles = rolesData?.getApiKeyRoles ?? [];

  const [formValues, setFormValues] = useState<{
    name: string;
    expirationDate: number | null;
    roleId: string;
  }>({
    expirationDate: isMcpSetup
      ? EXPIRATION_DATES[3].value
      : EXPIRATION_DATES[5].value,
    name: isMcpSetup ? MCP_SETUP.apiKey.defaultName : '',
    roleId: '',
  });

  useEffect(() => {
    if (isDefined(rolesData?.getApiKeyRoles)) {
      const apiKeyAssignableRoles = rolesData.getApiKeyRoles.filter(
        (role) => role.canBeAssignedToApiKeys,
      );
      if (apiKeyAssignableRoles.length > 0) {
        const preferredRole = isMcpSetup
          ? (apiKeyAssignableRoles.find(
              (role) => role.label === MCP_SETUP.apiKey.roleLabel,
            ) ?? apiKeyAssignableRoles[0])
          : apiKeyAssignableRoles[0];

        setFormValues((prev) => {
          if (!prev.roleId) {
            return { ...prev, roleId: preferredRole.id };
          }
          return prev;
        });
      }
    }
  }, [isMcpSetup, rolesData]);

  const [createApiKey] = useMutation(CreateApiKeyDocument, {
    refetchQueries: [GetApiKeysDocument],
    awaitRefetchQueries: true,
  });

  const jotaiStore = useStore();

  const setApiKeyTokenCallback = useCallback(
    (apiKeyId: string, token: string) => {
      jotaiStore.set(apiKeyTokenFamilyState.atomFamily(apiKeyId), token);
    },
    [jotaiStore],
  );

  const handleSave = async () => {
    if (!formValues.name) return;

    const expiresAt = addDays(
      new Date(),
      formValues.expirationDate ?? 30,
    ).toISOString();

    const roleIdToUse = formValues.roleId;

    if (!roleIdToUse) {
      return;
    }

    const { data: newApiKeyData } = await createApiKey({
      variables: {
        input: {
          name: formValues.name.trim(),
          expiresAt,
          roleId: roleIdToUse,
        },
      },
    });

    const newApiKey = newApiKeyData?.createApiKey;

    if (!newApiKey) {
      return;
    }

    const tokenData = await generateOneApiKeyToken({
      variables: {
        apiKeyId: newApiKey.id,
        expiresAt: expiresAt,
      },
    });

    if (isDefined(tokenData.data?.generateApiKeyToken)) {
      setApiKeyTokenCallback(
        newApiKey.id,
        tokenData.data.generateApiKeyToken.token,
      );
      navigateSettings(
        SettingsPath.ApiKeyDetail,
        {
          apiKeyId: newApiKey.id,
        },
        isMcpSetup ? { purpose: 'mcp' } : undefined,
      );
    }
  };

  const canSave = !!formValues.name && !!formValues.roleId;

  if (rolesLoading) {
    return <SettingsSkeletonLoader />;
  }

  return (
    <SettingsPageLayout
      title={isMcpSetup ? t`New MCP key` : t`New key`}
      links={[
        {
          children: t`Workspace`,
          href: getSettingsPath(SettingsPath.General),
        },
        {
          children: t`MCP & APIs`,
          href: getSettingsPath(
            SettingsPath.ApiWebhooks,
            undefined,
            undefined,
            isMcpSetup
              ? SETTINGS_API_WEBHOOKS_TABS.TABS_IDS.MCP
              : SETTINGS_API_WEBHOOKS_TABS.TABS_IDS.API,
          ),
        },
        { children: isMcpSetup ? t`New MCP key` : t`New Key` },
      ]}
      actionButton={
        <SaveAndCancelButtons
          isSaveDisabled={!canSave}
          onCancel={() => {
            navigateSettings(
              SettingsPath.ApiWebhooks,
              undefined,
              undefined,
              undefined,
              isMcpSetup
                ? SETTINGS_API_WEBHOOKS_TABS.TABS_IDS.MCP
                : SETTINGS_API_WEBHOOKS_TABS.TABS_IDS.API,
            );
          }}
          onSave={handleSave}
        />
      }
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title={t`Name`}
            description={
              isMcpSetup
                ? t`Use a clear name so this credential can be audited and revoked independently.`
                : t`Name of your API key`
            }
          />
          <SettingsTextInput
            instanceId="api-key-new-name"
            placeholder={
              isMcpSetup
                ? MCP_SETUP.apiKey.defaultName
                : t`E.g. backoffice integration`
            }
            value={formValues.name}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.keyCode === 229) {
                return;
              }
              if (e.key === Key.Enter) {
                handleSave();
              }
            }}
            onChange={(value) => {
              setFormValues((prevState) => ({
                ...prevState,
                name: value,
              }));
            }}
            fullWidth
          />
        </Section>
        <Section>
          <H2Title
            title={t`Role`}
            description={
              isMcpSetup
                ? t`The Diex CRM role limits this key to commercial, Inbox, AI and Customer Success operations without settings or deletion access.`
                : t`What this API can do: Select a user role to define its permissions.`
            }
          />
          <SettingsDevelopersRoleSelector
            value={formValues.roleId}
            onChange={(roleId) => {
              setFormValues((prevState) => ({
                ...prevState,
                roleId,
              }));
            }}
            roles={roles}
          />
        </Section>
        <Section>
          <H2Title
            title={t`Expiration Date`}
            description={t`When the API key will expire.`}
          />
          <Select
            dropdownId="object-field-type-select"
            options={EXPIRATION_DATES}
            value={formValues.expirationDate}
            onChange={(value) => {
              setFormValues((prevState) => ({
                ...prevState,
                expirationDate: value,
              }));
            }}
          />
        </Section>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
