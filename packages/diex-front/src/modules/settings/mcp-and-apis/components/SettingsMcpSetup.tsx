import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { Fragment } from 'react';

import { LightCopyIconButton } from '@/object-record/record-field/ui/components/LightCopyIconButton';
import ModelContextProtocolLogo from '@/settings/mcp-and-apis/assets/model-context-protocol-logo.svg?react';
import { SettingsMcpReadiness } from '@/settings/mcp-and-apis/components/SettingsMcpReadiness';
import { SettingsMcpSetupCard } from '@/settings/mcp-and-apis/components/SettingsMcpSetupCard';
import { buildMcpSetupCategories } from '@/settings/mcp-and-apis/utils/buildMcpSetupCategories';
import {
  buildMcpConfig,
  buildMcpOAuthConfig,
  buildMcpServerUrl,
  isHttpsUrl,
} from '@/settings/mcp-and-apis/utils/mcpSetup';
import { CodeEditor, CoreEditorHeader } from 'diex-ui/input';
import { Section } from 'diex-ui/layout';
import { MOBILE_VIEWPORT, themeCssVariables } from 'diex-ui/theme-constants';
import { H2Title } from 'diex-ui/typography';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

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

const StyledMcpSetupContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[10]};
`;

const StyledCardsGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: 1fr;
  }
`;

export const SettingsMcpSetup = () => {
  const mcpServerUrl = buildMcpServerUrl(REACT_APP_SERVER_BASE_URL);
  const mcpConfig = buildMcpConfig(mcpServerUrl);
  const mcpOAuthConfig = buildMcpOAuthConfig(mcpServerUrl);
  const categories = buildMcpSetupCategories({
    isHttpsInstallLinkEnabled: isHttpsUrl(mcpServerUrl),
    mcpServerUrl,
  });

  return (
    <StyledMcpSetupContainer>
      <Section>
        <SettingsMcpReadiness mcpServerUrl={mcpServerUrl} />
      </Section>

      {categories.map((category) => (
        <Fragment key={category.title}>
          <Section>
            <H2Title
              title={category.title}
              description={category.description}
            />
            <StyledCardsGrid>
              {category.cards.map((card) => (
                <SettingsMcpSetupCard key={card.title} card={card} />
              ))}
            </StyledCardsGrid>
          </Section>

          {category.showManualConfigurationAfter && (
            <>
              <Section>
                <H2Title
                  title={t`OAuth configuration`}
                  description={t`Preferred for Claude, Codex and clients that support browser sign-in. No secret is stored in the configuration file.`}
                />
                <CoreEditorHeader
                  leftNodes={[
                    <StyledMcpEditorHeaderTitle key="mcp-oauth-editor-title">
                      <StyledMcpIcon aria-hidden />
                      <span>{t`Diex CRM with OAuth`}</span>
                    </StyledMcpEditorHeaderTitle>,
                  ]}
                  rightNodes={[
                    <LightCopyIconButton
                      key="mcp-oauth-config-copy-button"
                      copyText={mcpOAuthConfig}
                    />,
                  ]}
                />
                <CodeEditor
                  value={mcpOAuthConfig}
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

              <Section>
                <H2Title
                  title={t`API key configuration`}
                  description={t`Use this mode only for clients without OAuth. Create a scoped MCP key above to receive a ready-to-copy configuration; this template shows the required shape.`}
                />
                <CoreEditorHeader
                  leftNodes={[
                    <StyledMcpEditorHeaderTitle key="mcp-key-editor-title">
                      <StyledMcpIcon aria-hidden />
                      <span>{t`Diex CRM with API key`}</span>
                    </StyledMcpEditorHeaderTitle>,
                  ]}
                  rightNodes={[
                    <LightCopyIconButton
                      key="mcp-key-config-copy-button"
                      copyText={mcpConfig}
                    />,
                  ]}
                />
                <CodeEditor
                  value={mcpConfig}
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
            </>
          )}
        </Fragment>
      ))}
    </StyledMcpSetupContainer>
  );
};
