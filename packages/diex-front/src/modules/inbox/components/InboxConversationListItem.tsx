import { styled } from '@linaria/react';
import {
  IconArrowDown,
  IconArrowUpRight,
  IconAt,
  IconMail,
  IconMessage,
} from 'diex-ui/icon';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { type InboxConversation } from '@/inbox/types/inboxEntityTypes';
import {
  formatRelativeTime,
  getConversationStatusLabel,
  getInitials,
  getPriorityLabel,
} from '@/inbox/utils/inboxFormatters';

const StyledButton = styled.button<{ isSelected: boolean }>`
  align-items: flex-start;
  background: ${({ isSelected }) =>
    isSelected ? themeCssVariables.background.transparent.blue : 'transparent'};
  border: 0;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]};
  text-align: left;
  transition: background ${themeCssVariables.animation.duration.fast}s ease;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledAvatar = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.rounded};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  height: ${themeCssVariables.spacing[9]};
  justify-content: center;
  width: ${themeCssVariables.spacing[9]};
`;

const StyledBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledTopLine = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledTime = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  white-space: nowrap;
`;

const StyledPreviewRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  margin-top: ${themeCssVariables.spacing[1]};
`;

const StyledPreview = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  flex: 1;
  font-size: ${themeCssVariables.font.size.xs};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledUnreadBadge = styled.span`
  align-items: center;
  background: ${themeCssVariables.color.green};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.inverted};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  height: ${themeCssVariables.spacing[4]};
  justify-content: center;
  min-width: ${themeCssVariables.spacing[4]};
  padding: 0 ${themeCssVariables.spacing[1]};
`;

const StyledMetadataRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledChip = styled.span<{ background: string; color: string }>`
  background: ${({ background }) => background};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${({ color }) => color};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.medium};
  max-width: 100%;
  overflow: hidden;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledMentionBadge = styled.span`
  align-items: center;
  background: ${themeCssVariables.tag.background.blue};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.tag.text.blue};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing['0.5']};
  padding: ${themeCssVariables.spacing['0.5']} ${themeCssVariables.spacing[1]};
`;

const statusChipPalette: Record<string, { background: string; color: string }> =
  {
    OPEN: {
      background: themeCssVariables.tag.background.green,
      color: themeCssVariables.tag.text.green,
    },
    PENDING: {
      background: themeCssVariables.tag.background.orange,
      color: themeCssVariables.tag.text.orange,
    },
    SNOOZED: {
      background: themeCssVariables.tag.background.blue,
      color: themeCssVariables.tag.text.blue,
    },
    RESOLVED: {
      background: themeCssVariables.tag.background.gray,
      color: themeCssVariables.tag.text.gray,
    },
  };

const priorityChipPalette: Record<
  string,
  { background: string; color: string }
> = {
  HIGH: {
    background: themeCssVariables.tag.background.orange,
    color: themeCssVariables.tag.text.orange,
  },
  URGENT: {
    background: themeCssVariables.tag.background.red,
    color: themeCssVariables.tag.text.red,
  },
};

const labelChipPalette: Record<string, { background: string; color: string }> =
  {
    BLUE: {
      background: themeCssVariables.tag.background.blue,
      color: themeCssVariables.tag.text.blue,
    },
    GREEN: {
      background: themeCssVariables.tag.background.green,
      color: themeCssVariables.tag.text.green,
    },
    ORANGE: {
      background: themeCssVariables.tag.background.orange,
      color: themeCssVariables.tag.text.orange,
    },
    RED: {
      background: themeCssVariables.tag.background.red,
      color: themeCssVariables.tag.text.red,
    },
    TURQUOISE: {
      background: themeCssVariables.tag.background.turquoise,
      color: themeCssVariables.tag.text.turquoise,
    },
    YELLOW: {
      background: themeCssVariables.tag.background.yellow,
      color: themeCssVariables.tag.text.yellow,
    },
    GRAY: {
      background: themeCssVariables.tag.background.gray,
      color: themeCssVariables.tag.text.gray,
    },
  };

const getPalette = (
  palette: Record<string, { background: string; color: string }>,
  key: string,
) =>
  palette[key.toUpperCase()] ??
  palette.GRAY ?? {
    background: themeCssVariables.tag.background.gray,
    color: themeCssVariables.tag.text.gray,
  };

type InboxConversationListItemProps = {
  conversation: InboxConversation;
  isSelected: boolean;
  pendingMentionCount: number;
  onSelect: (conversationId: string) => void;
};

export const InboxConversationListItem = ({
  conversation,
  isSelected,
  pendingMentionCount,
  onSelect,
}: InboxConversationListItemProps) => {
  const isOutbound = conversation.lastMessageDirection === 'OUTBOUND';
  const statusPalette = getPalette(statusChipPalette, conversation.status);

  return (
    <StyledButton
      type="button"
      isSelected={isSelected}
      onClick={() => onSelect(conversation.id)}
    >
      <StyledAvatar>{getInitials(conversation.name)}</StyledAvatar>
      <StyledBody>
        <StyledTopLine>
          <StyledName>{conversation.name}</StyledName>
          <StyledTime>
            {formatRelativeTime(conversation.lastMessageAt)}
          </StyledTime>
        </StyledTopLine>

        <StyledPreviewRow>
          {isOutbound ? (
            <IconArrowUpRight
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.sm}
            />
          ) : (
            <IconArrowDown
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.sm}
            />
          )}
          <StyledPreview>
            {conversation.lastMessagePreview ||
              'Conversa aguardando primeira mensagem'}
          </StyledPreview>
          {conversation.unreadCount > 0 ? (
            <StyledUnreadBadge>
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </StyledUnreadBadge>
          ) : null}
        </StyledPreviewRow>

        <StyledMetadataRow>
          {conversation.channel === 'EMAIL' ? (
            <IconMail
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.sm}
            />
          ) : (
            <IconMessage
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.sm}
            />
          )}
          <StyledChip
            background={statusPalette.background}
            color={statusPalette.color}
          >
            {getConversationStatusLabel(conversation.status)}
          </StyledChip>
          {pendingMentionCount > 0 ? (
            <StyledMentionBadge
              title={`${pendingMentionCount} menção ${pendingMentionCount === 1 ? 'pendente' : 'pendentes'}`}
            >
              <IconAt
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
              {pendingMentionCount > 99 ? '99+' : pendingMentionCount}
            </StyledMentionBadge>
          ) : null}
          {conversation.priority === 'HIGH' ||
          conversation.priority === 'URGENT' ? (
            <StyledChip
              background={
                getPalette(priorityChipPalette, conversation.priority)
                  .background
              }
              color={
                getPalette(priorityChipPalette, conversation.priority).color
              }
            >
              {getPriorityLabel(conversation.priority)}
            </StyledChip>
          ) : null}
          {conversation.inboxTeam ? (
            <StyledChip
              background={getPalette(labelChipPalette, 'BLUE').background}
              color={getPalette(labelChipPalette, 'BLUE').color}
            >
              {conversation.inboxTeam.name}
            </StyledChip>
          ) : null}
          {conversation.labelAssignments
            .filter(({ isActive }) => isActive)
            .slice(0, 2)
            .map(({ id, inboxLabel }) => (
              <StyledChip
                key={id}
                background={
                  getPalette(labelChipPalette, inboxLabel.color).background
                }
                color={getPalette(labelChipPalette, inboxLabel.color).color}
              >
                {inboxLabel.name}
              </StyledChip>
            ))}
        </StyledMetadataRow>
      </StyledBody>
    </StyledButton>
  );
};
