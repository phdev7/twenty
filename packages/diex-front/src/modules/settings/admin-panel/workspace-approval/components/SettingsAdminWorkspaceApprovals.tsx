import { APPROVE_WORKSPACE_CREATION } from '@/settings/admin-panel/workspace-approval/graphql/mutations/approveWorkspaceCreation';
import { PENDING_WORKSPACE_APPROVALS } from '@/settings/admin-panel/workspace-approval/graphql/queries/pendingWorkspaceApprovals';
import { SettingsSectionSkeletonLoader } from '@/settings/components/SettingsSectionSkeletonLoader';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'diex-shared/utils';
import { Button } from 'diex-ui/input';
import { Section } from 'diex-ui/layout';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { H2Title } from 'diex-ui/typography';

type PendingWorkspaceApproval = {
  workspaceId: string;
  displayName: string | null;
  subdomain: string;
  createdAt: string;
  requesterEmail: string | null;
  requesterName: string | null;
  memberCount: number;
  whatsapp: string | null;
  companyDescription: string | null;
  idealCustomerProfile: string | null;
  toneOfVoice: string | null;
  primaryGoal: string | null;
  companySize: string | null;
  currentProcess: string | null;
};

type PendingWorkspaceApprovalsData = {
  pendingWorkspaceApprovals: PendingWorkspaceApproval[];
};

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[4]} 0;
`;

const StyledApprovalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledApprovalCard = styled.article`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledCardHeader = styled.div`
  align-items: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledWorkspaceName = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledSecondaryText = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledMetadataGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
`;

const StyledField = styled.div`
  min-width: 0;
`;

const StyledFieldLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  margin-bottom: ${themeCssVariables.spacing[1]};
  text-transform: uppercase;
`;

const StyledFieldValue = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

const StyledOperationalContext = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  padding-top: ${themeCssVariables.spacing[4]};
`;

const fieldValue = (value: string | null) => value?.trim() || 'Não informado';

export const SettingsAdminWorkspaceApprovals = () => {
  const { t } = useLingui();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [approvingWorkspaceId, setApprovingWorkspaceId] = useState<
    string | null
  >(null);

  const { data, loading, refetch } = useQuery<PendingWorkspaceApprovalsData>(
    PENDING_WORKSPACE_APPROVALS,
    { fetchPolicy: 'cache-and-network' },
  );

  const [approveWorkspaceCreation] = useMutation(APPROVE_WORKSPACE_CREATION);

  const pendingApprovals = data?.pendingWorkspaceApprovals ?? [];

  const handleApprove = async (approval: PendingWorkspaceApproval) => {
    setApprovingWorkspaceId(approval.workspaceId);

    try {
      await approveWorkspaceCreation({
        variables: { input: { workspaceId: approval.workspaceId } },
      });

      enqueueSuccessSnackBar({
        message: t`Workspace approved.`,
      });

      await refetch();
    } catch (error) {
      // The server reason is what makes an approval failure actionable: a
      // blanket message once hid a metadata build error behind "could not
      // approve", which read as a permission problem for days.
      const reason = error instanceof Error ? error.message : String(error);

      enqueueErrorSnackBar({
        message: t`Could not approve this workspace: ${reason}`,
      });
    } finally {
      setApprovingWorkspaceId(null);
    }
  };

  if (loading && pendingApprovals.length === 0) {
    return <SettingsSectionSkeletonLoader />;
  }

  return (
    <Section>
      <H2Title
        title={t`Pending workspace approvals`}
        description={t`Workspaces created at sign-up that cannot be reached until you approve them. Approving builds the workspace and lets the requester finish onboarding.`}
      />
      {pendingApprovals.length === 0 ? (
        <StyledEmptyState>
          <Trans>No workspace is waiting for approval.</Trans>
        </StyledEmptyState>
      ) : (
        <StyledApprovalList>
          {pendingApprovals.map((approval) => (
            <StyledApprovalCard key={approval.workspaceId}>
              <StyledCardHeader>
                <div>
                  <StyledWorkspaceName>
                    {approval.displayName ?? approval.subdomain}
                  </StyledWorkspaceName>
                  <StyledSecondaryText>
                    {approval.subdomain} · solicitado em{' '}
                    {new Date(approval.createdAt).toLocaleDateString('pt-BR')}
                  </StyledSecondaryText>
                </div>
                <Button
                  title={
                    approvingWorkspaceId === approval.workspaceId
                      ? 'Aprovando...'
                      : 'Aprovar e liberar'
                  }
                  accent="blue"
                  size="small"
                  disabled={approvingWorkspaceId === approval.workspaceId}
                  onClick={() => {
                    void handleApprove(approval);
                  }}
                />
              </StyledCardHeader>

              <StyledMetadataGrid>
                <StyledField>
                  <StyledFieldLabel>Responsável</StyledFieldLabel>
                  <StyledFieldValue>
                    {isDefined(approval.requesterName)
                      ? approval.requesterName
                      : 'Não informado'}
                  </StyledFieldValue>
                  <StyledSecondaryText>
                    {approval.requesterEmail ?? 'E-mail não informado'}
                  </StyledSecondaryText>
                </StyledField>
                <StyledField>
                  <StyledFieldLabel>WhatsApp</StyledFieldLabel>
                  <StyledFieldValue>
                    {fieldValue(approval.whatsapp)}
                  </StyledFieldValue>
                </StyledField>
                <StyledField>
                  <StyledFieldLabel>Tamanho da operação</StyledFieldLabel>
                  <StyledFieldValue>
                    {fieldValue(approval.companySize)}
                  </StyledFieldValue>
                </StyledField>
                <StyledField>
                  <StyledFieldLabel>Tom de voz</StyledFieldLabel>
                  <StyledFieldValue>
                    {fieldValue(approval.toneOfVoice)}
                  </StyledFieldValue>
                </StyledField>
              </StyledMetadataGrid>

              <StyledOperationalContext>
                <StyledField>
                  <StyledFieldLabel>O que a empresa faz</StyledFieldLabel>
                  <StyledFieldValue>
                    {fieldValue(approval.companyDescription)}
                  </StyledFieldValue>
                </StyledField>
                <StyledField>
                  <StyledFieldLabel>Cliente ideal</StyledFieldLabel>
                  <StyledFieldValue>
                    {fieldValue(approval.idealCustomerProfile)}
                  </StyledFieldValue>
                </StyledField>
                <StyledField>
                  <StyledFieldLabel>Objetivo principal</StyledFieldLabel>
                  <StyledFieldValue>
                    {fieldValue(approval.primaryGoal)}
                  </StyledFieldValue>
                </StyledField>
                <StyledField>
                  <StyledFieldLabel>Processo atual e gargalos</StyledFieldLabel>
                  <StyledFieldValue>
                    {fieldValue(approval.currentProcess)}
                  </StyledFieldValue>
                </StyledField>
              </StyledOperationalContext>
            </StyledApprovalCard>
          ))}
        </StyledApprovalList>
      )}
    </Section>
  );
};
