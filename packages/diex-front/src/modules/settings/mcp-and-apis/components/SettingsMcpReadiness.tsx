import { styled } from '@linaria/react';
import { useQuery } from '@apollo/client/react';
import { t } from '@lingui/core/macro';
import { useEffect, useMemo, useState } from 'react';
import { SettingsPath } from 'diex-shared/types';
import { getSettingsPath } from 'diex-shared/utils';
import { Pill } from 'diex-ui/data-display';
import {
  IconAlertTriangle,
  IconCheck,
  IconKey,
  IconLock,
  IconPlus,
  IconServer,
} from 'diex-ui/icon';
import { Button } from 'diex-ui/input';
import { Card, CardContent } from 'diex-ui/surfaces';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { H2Title } from 'diex-ui/typography';

import { MCP_SETUP } from '@/settings/mcp-and-apis/constants/McpSetup';
import { isHttpsUrl } from '@/settings/mcp-and-apis/utils/mcpSetup';
import { GetApiKeysDocument } from '~/generated-metadata/graphql';
import { SETTINGS_API_WEBHOOKS_TABS } from '~/pages/settings/api-webhooks/constants/SettingsApiWebhooksTabs';

type EndpointStatus = 'CHECKING' | 'READY' | 'UNAVAILABLE';

const StyledStatusGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const StyledStatusContent = styled(CardContent)`
  align-items: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  min-height: ${themeCssVariables.spacing[24]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledStatusIcon = styled.div<{ status: EndpointStatus }>`
  align-items: center;
  background: ${({ status }) =>
    status === 'READY'
      ? themeCssVariables.background.transparent.success
      : status === 'UNAVAILABLE'
        ? themeCssVariables.background.transparent.danger
        : themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ status }) =>
    status === 'UNAVAILABLE'
      ? themeCssVariables.font.color.danger
      : status === 'READY'
        ? themeCssVariables.accent.primary
        : themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 0 0 ${themeCssVariables.spacing[8]};
  height: ${themeCssVariables.spacing[8]};
  justify-content: center;
`;

const StyledStatusBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledStatusHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledStatusTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledStatusDescription = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.45;
`;

const StyledEndpoint = styled.code`
  color: ${themeCssVariables.font.color.tertiary};
  font-family: monospace;
  font-size: ${themeCssVariables.font.size.xs};
  overflow-wrap: anywhere;
`;

const StyledActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[3]};
`;

const isApiKeyActive = (apiKey: {
  expiresAt: string;
  revokedAt?: string | null;
}) => !apiKey.revokedAt && new Date(apiKey.expiresAt).getTime() > Date.now();

export const SettingsMcpReadiness = ({
  mcpServerUrl,
}: {
  mcpServerUrl: string;
}) => {
  const [endpointStatus, setEndpointStatus] =
    useState<EndpointStatus>('CHECKING');
  const [endpointCheckNonce, setEndpointCheckNonce] = useState(0);
  const { data: apiKeysData, loading: apiKeysLoading } =
    useQuery(GetApiKeysDocument);

  useEffect(() => {
    const abortController = new AbortController();

    setEndpointStatus('CHECKING');

    void fetch(mcpServerUrl, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'diex-mcp-readiness',
        method: 'initialize',
        params: {
          protocolVersion: MCP_SETUP.protocolVersion,
          capabilities: {},
          clientInfo: {
            name: 'diex-crm-readiness',
            version: '1.0.0',
          },
        },
      }),
      signal: abortController.signal,
    })
      .then((response) => {
        if (!abortController.signal.aborted) {
          setEndpointStatus(
            [200, 202, 400, 401, 403, 406].includes(response.status)
              ? 'READY'
              : 'UNAVAILABLE',
          );
        }
      })
      .catch(() => {
        if (!abortController.signal.aborted) {
          setEndpointStatus('UNAVAILABLE');
        }
      });

    return () => {
      abortController.abort();
    };
  }, [endpointCheckNonce, mcpServerUrl]);

  const activeMcpKeys = useMemo(
    () =>
      (apiKeysData?.apiKeys ?? []).filter(
        (apiKey) =>
          isApiKeyActive(apiKey) &&
          (apiKey.name.toLowerCase().includes('mcp') ||
            apiKey.role.label === MCP_SETUP.apiKey.roleLabel),
      ),
    [apiKeysData?.apiKeys],
  );
  const keyStatus: EndpointStatus = apiKeysLoading
    ? 'CHECKING'
    : activeMcpKeys.length > 0
      ? 'READY'
      : 'UNAVAILABLE';
  const transportStatus: EndpointStatus = isHttpsUrl(mcpServerUrl)
    ? 'READY'
    : 'UNAVAILABLE';
  const newMcpKeyPath = getSettingsPath(SettingsPath.NewApiKey, undefined, {
    purpose: 'mcp',
  });
  const manageKeysPath = getSettingsPath(
    SettingsPath.ApiWebhooks,
    undefined,
    undefined,
    SETTINGS_API_WEBHOOKS_TABS.TABS_IDS.API,
  );

  return (
    <div>
      <H2Title
        title={t`Connection readiness`}
        description={t`Verify the endpoint, secure transport and workspace-scoped credentials before connecting an external AI.`}
      />
      <StyledStatusGrid>
        <Card rounded>
          <StyledStatusContent>
            <StyledStatusIcon status={endpointStatus}>
              {endpointStatus === 'READY' ? (
                <IconCheck size={16} />
              ) : endpointStatus === 'UNAVAILABLE' ? (
                <IconAlertTriangle size={16} />
              ) : (
                <IconServer size={16} />
              )}
            </StyledStatusIcon>
            <StyledStatusBody>
              <StyledStatusHeader>
                <StyledStatusTitle>{t`MCP endpoint`}</StyledStatusTitle>
                <Pill
                  label={
                    endpointStatus === 'READY'
                      ? t`Available`
                      : endpointStatus === 'UNAVAILABLE'
                        ? t`Unavailable`
                        : t`Checking`
                  }
                />
              </StyledStatusHeader>
              <StyledStatusDescription>
                {t`Live Streamable HTTP endpoint for this Diex CRM instance.`}
              </StyledStatusDescription>
              <StyledEndpoint>{mcpServerUrl}</StyledEndpoint>
            </StyledStatusBody>
          </StyledStatusContent>
        </Card>

        <Card rounded>
          <StyledStatusContent>
            <StyledStatusIcon status={transportStatus}>
              {transportStatus === 'READY' ? (
                <IconLock size={16} />
              ) : (
                <IconAlertTriangle size={16} />
              )}
            </StyledStatusIcon>
            <StyledStatusBody>
              <StyledStatusHeader>
                <StyledStatusTitle>{t`Secure transport`}</StyledStatusTitle>
                <Pill
                  label={
                    transportStatus === 'READY' ? t`HTTPS` : t`Action required`
                  }
                />
              </StyledStatusHeader>
              <StyledStatusDescription>
                {transportStatus === 'READY'
                  ? t`OAuth discovery and secret headers are protected in transit.`
                  : t`Use an HTTPS public URL before connecting an external client.`}
              </StyledStatusDescription>
            </StyledStatusBody>
          </StyledStatusContent>
        </Card>

        <Card rounded>
          <StyledStatusContent>
            <StyledStatusIcon status={keyStatus}>
              {keyStatus === 'READY' ? (
                <IconCheck size={16} />
              ) : (
                <IconKey size={16} />
              )}
            </StyledStatusIcon>
            <StyledStatusBody>
              <StyledStatusHeader>
                <StyledStatusTitle>{t`Scoped API key`}</StyledStatusTitle>
                <Pill
                  label={
                    apiKeysLoading
                      ? t`Checking`
                      : activeMcpKeys.length > 0
                        ? t`${activeMcpKeys.length} active`
                        : t`Optional`
                  }
                />
              </StyledStatusHeader>
              <StyledStatusDescription>
                {activeMcpKeys.length > 0
                  ? t`A non-revoked MCP key with an active expiration is available.`
                  : t`OAuth clients can sign in directly. Create a scoped key for clients that require a static bearer token.`}
              </StyledStatusDescription>
            </StyledStatusBody>
          </StyledStatusContent>
        </Card>
      </StyledStatusGrid>

      <StyledActions>
        <Button
          Icon={IconServer}
          title={t`Check endpoint again`}
          size="small"
          variant="secondary"
          onClick={() => setEndpointCheckNonce((current) => current + 1)}
        />
        <Button
          Icon={IconPlus}
          title={t`Create scoped MCP key`}
          size="small"
          to={newMcpKeyPath}
        />
        <Button
          Icon={IconKey}
          title={t`Manage API keys`}
          size="small"
          variant="secondary"
          to={manageKeysPath}
        />
      </StyledActions>
    </div>
  );
};
