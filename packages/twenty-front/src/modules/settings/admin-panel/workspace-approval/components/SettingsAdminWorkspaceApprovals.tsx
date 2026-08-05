import { APPROVE_WORKSPACE_CREATION } from '@/settings/admin-panel/workspace-approval/graphql/mutations/approveWorkspaceCreation';
import { PENDING_WORKSPACE_APPROVALS } from '@/settings/admin-panel/workspace-approval/graphql/queries/pendingWorkspaceApprovals';
import { SettingsSectionSkeletonLoader } from '@/settings/components/SettingsSectionSkeletonLoader';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Table } from '@/ui/layout/table/components/Table';
import { TableBody } from '@/ui/layout/table/components/TableBody';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { Button } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { H2Title } from 'twenty-ui/typography';

type PendingWorkspaceApproval = {
  workspaceId: string;
  displayName: string | null;
  subdomain: string;
  createdAt: string;
  requesterEmail: string | null;
  requesterName: string | null;
  memberCount: number;
};

type PendingWorkspaceApprovalsData = {
  pendingWorkspaceApprovals: PendingWorkspaceApproval[];
};

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[4]} 0;
`;

const StyledRequester = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledActionCell = styled(TableCell)`
  justify-content: flex-end;
`;

const GRID_COLUMNS = '2fr 2fr 1fr 120px';

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
    } catch {
      enqueueErrorSnackBar({
        message: t`Could not approve this workspace.`,
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
        <Table>
          <TableRow gridAutoColumns={GRID_COLUMNS}>
            <TableHeader>
              <Trans>Workspace</Trans>
            </TableHeader>
            <TableHeader>
              <Trans>Requested by</Trans>
            </TableHeader>
            <TableHeader>
              <Trans>Requested on</Trans>
            </TableHeader>
            <TableHeader align="right">
              <Trans>Action</Trans>
            </TableHeader>
          </TableRow>
          <TableBody>
            {pendingApprovals.map((approval) => (
              <TableRow
                key={approval.workspaceId}
                gridAutoColumns={GRID_COLUMNS}
              >
                <TableCell>
                  <div>
                    <div>{approval.displayName ?? approval.subdomain}</div>
                    <StyledRequester>{approval.subdomain}</StyledRequester>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div>{approval.requesterEmail ?? '—'}</div>
                    {isDefined(approval.requesterName) && (
                      <StyledRequester>
                        {approval.requesterName}
                      </StyledRequester>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(approval.createdAt).toLocaleDateString()}
                </TableCell>
                <StyledActionCell>
                  <Button
                    title={t`Approve`}
                    accent="blue"
                    size="small"
                    disabled={approvingWorkspaceId === approval.workspaceId}
                    onClick={() => {
                      void handleApprove(approval);
                    }}
                  />
                </StyledActionCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Section>
  );
};
