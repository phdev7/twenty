import { styled } from '@linaria/react';
import { isNonEmptyString } from '@sniptt/guards';
import { useStore } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { LightCopyIconButton } from '@/object-record/record-field/ui/components/LightCopyIconButton';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsSkeletonLoader } from '@/settings/components/SettingsSkeletonLoader';
import { ApiKeyInput } from '@/settings/developers/components/ApiKeyInput';
import { ApiKeyNameInput } from '@/settings/developers/components/ApiKeyNameInput';
import { SettingsDevelopersRoleSelector } from '@/settings/developers/components/SettingsDevelopersRoleSelector';
import { apiKeyTokenFamilyState } from '@/settings/developers/states/apiKeyTokenFamilyState';
import ModelContextProtocolLogo from '@/settings/mcp-and-apis/assets/model-context-protocol-logo.svg?react';
import {
  buildMcpConfig,
  buildMcpServerUrl,
} from '@/settings/mcp-and-apis/utils/mcpSetup';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { computeNewExpirationDate } from '@/settings/developers/utils/computeNewExpirationDate';
import { formatExpiration } from '@/settings/developers/utils/formatExpiration';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { Trans, useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'diex-shared/types';
import { getSettingsPath, isDefined } from 'diex-shared/utils';
import { IconRepeat, IconTrash } from 'diex-ui/icon';
import { H2Title } from 'diex-ui/typography';
import { Button, CodeEditor, CoreEditorHeader } from 'diex-ui/input';
import { Section } from 'diex-ui/layout';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  AssignRoleToApiKeyDocument,
  CreateApiKeyDocument,
  GenerateApiKeyTokenDocument,
  GetApiKeyDocument,
  GetApiKeyRolesDocument,
  RevokeApiKeyDocument,
} from '~/generated-metadata/graphql';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';
import { SETTINGS_API_WEBHOOKS_TABS } from '~/pages/settings/api-webhooks/constants/SettingsApiWebhooksTabs';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

const StyledInfo = styled.span`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.regular};
`;

const StyledInputContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledMcpEditorHeaderTitle = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMcpIcon = styled(ModelContextProtocolLogo)`
  color: inherit;
  flex-shrink: 0;
  height: calc(${themeCssVariables.icon.size.md} * 1px);
  width: calc(${themeCssVariables.icon.size.md} * 1px);
`;

const DELETE_API_KEY_MODAL_ID = 'delete-api-key-modal';
const REGENERATE_API_KEY_MODAL_ID = 'regenerate-api-key-modal';

export const SettingsDevelopersApiKeyDetail = () => {
  const { t } = useLingui();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { openModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigateSettings();
  const { apiKeyId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const isMcpSetup = searchParams.get('purpose') === 'mcp';

  const jotaiStore = useStore();

  const apiKeyToken = useAtomFamilyStateValue(apiKeyTokenFamilyState, apiKeyId);

  const setApiKeyTokenCallback = useCallback(
    (apiKeyId: string, token: string) => {
      jotaiStore.set(apiKeyTokenFamilyState.atomFamily(apiKeyId), token);
    },
    [jotaiStore],
  );

  const [generateOneApiKeyToken] = useMutation(GenerateApiKeyTokenDocument);
  const [createApiKey] = useMutation(CreateApiKeyDocument);
  const [revokeApiKey] = useMutation(RevokeApiKeyDocument);
  const [assignRoleToApiKey] = useMutation(AssignRoleToApiKeyDocument);

  const { data: apiKeyData, loading: apiKeyLoading } = useQuery(
    GetApiKeyDocument,
    {
      variables: {
        input: {
          id: apiKeyId,
        },
      },
    },
  );

  useEffect(() => {
    if (isDefined(apiKeyData?.apiKey)) {
      setApiKeyName(apiKeyData.apiKey.name);
      if (isDefined(apiKeyData.apiKey.role)) {
        setSelectedRoleId(apiKeyData.apiKey.role.id);
      }
    }
  }, [apiKeyData]);

  const { data: rolesData, loading: rolesLoading } = useQuery(
    GetApiKeyRolesDocument,
  );

  const roles = rolesData?.getApiKeyRoles ?? [];

  const apiKey = apiKeyData?.apiKey;
  const [apiKeyName, setApiKeyName] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(
    undefined,
  );

  const handleRoleChange = async (roleId: string) => {
    if (!apiKey?.id || !isNonEmptyString(roleId)) return;

    setIsLoading(true);
    try {
      await assignRoleToApiKey({
        variables: {
          apiKeyId: apiKey.id,
          roleId,
        },
      });
      enqueueSuccessSnackBar({
        message: t`Role updated successfully`,
      });
      setSelectedRoleId(roleId);
    } catch {
      enqueueErrorSnackBar({
        message: t`Error updating role`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteIntegration = async (redirect = true) => {
    setIsLoading(true);

    try {
      await revokeApiKey({
        variables: {
          input: {
            id: apiKeyId,
          },
        },
      });
      if (redirect) {
        navigate(
          SettingsPath.ApiWebhooks,
          undefined,
          undefined,
          undefined,
          isMcpSetup
            ? SETTINGS_API_WEBHOOKS_TABS.TABS_IDS.MCP
            : SETTINGS_API_WEBHOOKS_TABS.TABS_IDS.API,
        );
      }
    } catch {
      enqueueErrorSnackBar({ message: t`Error deleting api key.` });
    } finally {
      setIsLoading(false);
    }
  };

  const createIntegration = async (
    name: string,
    newExpiresAt: string | null,
  ) => {
    const roleIdToUse = selectedRoleId;

    if (!roleIdToUse) {
      enqueueErrorSnackBar({
        message: t`A role must be selected for the API key`,
      });
      return;
    }

    if (!isDefined(roleIdToUse)) {
      throw new Error('Role not selected - this should never happen');
    }

    const { data: newApiKeyData } = await createApiKey({
      variables: {
        input: {
          name: name,
          expiresAt: newExpiresAt ?? '',
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
        expiresAt: newApiKey?.expiresAt,
      },
    });
    return {
      id: newApiKey.id,
      token: tokenData.data?.generateApiKeyToken.token,
    };
  };

  const regenerateApiKey = async () => {
    setIsLoading(true);
    try {
      if (isDefined(apiKey)) {
        if (!isNonEmptyString(apiKeyName)) {
          enqueueErrorSnackBar({
            message: t`API key name cannot be empty`,
          });
          return;
        }
        const newExpiresAt = computeNewExpirationDate(
          apiKey.expiresAt,
          apiKey.createdAt,
        );
        const newApiKey = await createIntegration(apiKeyName, newExpiresAt);
        await deleteIntegration(false);

        if (isNonEmptyString(newApiKey?.token)) {
          setApiKeyTokenCallback(newApiKey.id, newApiKey.token);
          navigate(
            SettingsPath.ApiKeyDetail,
            {
              apiKeyId: newApiKey.id,
            },
            isMcpSetup ? { purpose: 'mcp' } : undefined,
          );
        }
      }
    } catch {
      enqueueErrorSnackBar({
        message: t`Error regenerating api key.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmationValue = t`yes`;

  if (apiKeyLoading || rolesLoading) {
    return <SettingsSkeletonLoader />;
  }

  return (
    <>
      {isDefined(apiKey) && (
        <SettingsPageLayout
          title={apiKey.name || t`Unnamed API Key`}
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
            { children: apiKey.name || t`Unnamed API Key` },
          ]}
        >
          <SettingsPageContainer>
            <Section>
              {apiKeyToken ? (
                <>
                  <H2Title
                    title={t`API Key`}
                    description={t`Copy this key as it will not be visible again`}
                  />
                  <ApiKeyInput apiKey={apiKeyToken} />
                </>
              ) : (
                <>
                  <H2Title
                    title={t`API Key`}
                    description={t`Regenerate an API key`}
                  />
                  <StyledInputContainer>
                    <Button
                      title={t`Regenerate Key`}
                      Icon={IconRepeat}
                      onClick={() => openModal(REGENERATE_API_KEY_MODAL_ID)}
                    />
                    <StyledInfo>
                      {formatExpiration(apiKey?.expiresAt || '', true, false)}
                    </StyledInfo>
                  </StyledInputContainer>
                </>
              )}
            </Section>
            {apiKeyToken && isMcpSetup ? (
              <Section>
                <H2Title
                  title={t`MCP client configuration`}
                  description={t`Copy this configuration now. The API key remains only in this authenticated browser session and will not be shown again.`}
                />
                <CoreEditorHeader
                  leftNodes={[
                    <StyledMcpEditorHeaderTitle key="mcp-key-editor-title">
                      <StyledMcpIcon aria-hidden />
                      <span>{t`Diex CRM MCP with scoped key`}</span>
                    </StyledMcpEditorHeaderTitle>,
                  ]}
                  rightNodes={[
                    <LightCopyIconButton
                      key="mcp-key-config-copy-button"
                      copyText={buildMcpConfig(
                        buildMcpServerUrl(REACT_APP_SERVER_BASE_URL),
                        apiKeyToken,
                      )}
                    />,
                  ]}
                />
                <CodeEditor
                  value={buildMcpConfig(
                    buildMcpServerUrl(REACT_APP_SERVER_BASE_URL),
                    apiKeyToken,
                  )}
                  language="json"
                  variant="with-header"
                  contentPadding="comfortable"
                  autoHeight
                  options={{
                    readOnly: true,
                    domReadOnly: true,
                    lineNumbers: 'off',
                    lineNumbersMinChars: 0,
                    folding: false,
                    glyphMargin: false,
                    scrollBeyondLastLine: false,
                    renderLineHighlight: 'none',
                    wordWrap: 'on',
                  }}
                />
              </Section>
            ) : null}
            <Section>
              <H2Title title={t`Name`} description={t`Name of your API key`} />
              <ApiKeyNameInput
                apiKeyName={apiKeyName}
                apiKeyId={apiKey?.id}
                disabled={isLoading}
                onNameUpdate={setApiKeyName}
              />
            </Section>
            <Section>
              <H2Title
                title={t`Role`}
                description={t`What this API can do: Select a user role to define its permissions.`}
              />
              <SettingsDevelopersRoleSelector
                value={selectedRoleId}
                onChange={handleRoleChange}
                roles={roles}
              />
            </Section>
            <Section>
              <H2Title
                title={t`Expiration`}
                description={t`When the key will be disabled`}
              />
              <SettingsTextInput
                instanceId={`api-key-expiration-${apiKey?.id}`}
                placeholder={t`E.g. backoffice integration`}
                value={formatExpiration(apiKey?.expiresAt || '', true, false)}
                disabled
                fullWidth
              />
            </Section>
            <Section>
              <H2Title
                title={t`Danger zone`}
                description={t`Delete this integration`}
              />
              <Button
                accent="danger"
                variant="secondary"
                title={t`Delete`}
                Icon={IconTrash}
                onClick={() => openModal(DELETE_API_KEY_MODAL_ID)}
              />
            </Section>
          </SettingsPageContainer>
        </SettingsPageLayout>
      )}
      <ConfirmationModal
        confirmationPlaceholder={confirmationValue}
        confirmationValue={confirmationValue}
        modalInstanceId={DELETE_API_KEY_MODAL_ID}
        title={t`Delete API key`}
        subtitle={
          <Trans>
            Please type {`"${confirmationValue}"`} to confirm you want to delete
            this API Key. Be aware that any script using this key will stop
            working.
          </Trans>
        }
        onConfirmClick={deleteIntegration}
        confirmButtonText={t`Delete`}
        loading={isLoading}
      />
      <ConfirmationModal
        confirmationPlaceholder={confirmationValue}
        confirmationValue={confirmationValue}
        modalInstanceId={REGENERATE_API_KEY_MODAL_ID}
        title={t`Regenerate an API key`}
        subtitle={
          <Trans>
            If you’ve lost this key, you can regenerate it, but be aware that
            any script using this key will need to be updated. Please type
            {`"${confirmationValue}"`} to confirm.
          </Trans>
        }
        onConfirmClick={regenerateApiKey}
        confirmButtonText={t`Regenerate key`}
        loading={isLoading}
      />
    </>
  );
};
