import { type ReactNode } from 'react';
import { styled } from '@linaria/react';
import { IconChevronRight } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type InboxRecordReference } from '@/inbox/types/inboxEntityTypes';
import { formatDateTime } from '@/inbox/utils/inboxFormatters';
import { getRecordName } from '@/inbox/utils/getRecordName';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';

export const StyledCard = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  margin-bottom: ${themeCssVariables.spacing[2]};
  min-height: 48px;
  padding: ${themeCssVariables.spacing[2]};
`;

export const StyledCardButton = styled.button<{ canOpen: boolean }>`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  cursor: ${({ canOpen }) => (canOpen ? 'pointer' : 'default')};
  display: flex;
  font-family: ${themeCssVariables.font.family};
  gap: ${themeCssVariables.spacing[2]};
  margin-bottom: ${themeCssVariables.spacing[2]};
  min-height: 48px;
  opacity: ${({ canOpen }) => (canOpen ? 1 : 0.72)};
  padding: ${themeCssVariables.spacing[2]};
  text-align: left;
  width: 100%;
`;

export const StyledCardIcon = styled.span<{ danger?: boolean }>`
  align-items: center;
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ danger }) =>
    danger
      ? themeCssVariables.font.color.danger
      : themeCssVariables.font.color.secondary};
  display: flex;
  flex-shrink: 0;
  height: ${themeCssVariables.spacing[8]};
  justify-content: center;
  width: ${themeCssVariables.spacing[8]};
`;

export const StyledCardBody = styled.span`
  flex: 1;
  min-width: 0;
`;

export const StyledCardLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
`;

export const StyledCardValue = styled.span`
  color: ${themeCssVariables.font.color.primary};
  display: block;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-top: ${themeCssVariables.spacing['0.5']};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type InboxRecordCardProps = {
  icon: ReactNode;
  label: string;
  objectNameSingular: string;
  record?: InboxRecordReference | null;
  value?: string;
};

export const InboxRecordCard = ({
  icon,
  label,
  objectNameSingular,
  record,
  value,
}: InboxRecordCardProps) => {
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const recordName = value || getRecordName(record) || 'Não vinculado';
  const canOpen = Boolean(record?.id);

  return (
    <StyledCardButton
      type="button"
      canOpen={canOpen}
      disabled={!canOpen}
      onClick={() => {
        if (record?.id) {
          openRecordInSidePanel({ recordId: record.id, objectNameSingular });
        }
      }}
    >
      <StyledCardIcon>{icon}</StyledCardIcon>
      <StyledCardBody>
        <StyledCardLabel>{label}</StyledCardLabel>
        <StyledCardValue>{recordName}</StyledCardValue>
      </StyledCardBody>
      {canOpen ? (
        <IconChevronRight
          size={themeCssVariables.icon.size.sm}
          stroke={themeCssVariables.icon.stroke.md}
        />
      ) : null}
    </StyledCardButton>
  );
};

type InboxDeadlineCardProps = {
  icon: ReactNode;
  label: string;
  value?: string | null;
  danger?: boolean;
};

export const InboxDeadlineCard = ({
  icon,
  label,
  value,
  danger = false,
}: InboxDeadlineCardProps) => (
  <StyledCard
    style={
      danger
        ? {
            background: themeCssVariables.background.transparent.danger,
            borderColor: themeCssVariables.border.color.danger,
          }
        : undefined
    }
  >
    <StyledCardIcon danger={danger}>{icon}</StyledCardIcon>
    <StyledCardBody>
      <StyledCardLabel>{label}</StyledCardLabel>
      <StyledCardValue>{formatDateTime(value)}</StyledCardValue>
    </StyledCardBody>
  </StyledCard>
);
