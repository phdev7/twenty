import {
  type InboxConversation,
  type InboxTeam,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';
import { getActiveTeamMembers } from '@/inbox/utils/getActiveTeamMembers';

export const getLeastLoadedTeamMember = ({
  team,
  conversations,
  excludedConversationId,
}: {
  team: InboxTeam;
  conversations: InboxConversation[];
  excludedConversationId: string;
}): InboxWorkspaceMember | null => {
  const activeMembers = getActiveTeamMembers(team);

  if (activeMembers.length === 0) {
    return null;
  }

  const loadByMemberId = new Map(
    activeMembers.map((workspaceMember) => [workspaceMember.id, 0]),
  );

  for (const conversation of conversations) {
    if (
      conversation.id === excludedConversationId ||
      conversation.status === 'RESOLVED' ||
      conversation.inboxTeam?.id !== team.id ||
      !conversation.assignee?.id ||
      !loadByMemberId.has(conversation.assignee.id)
    ) {
      continue;
    }

    loadByMemberId.set(
      conversation.assignee.id,
      (loadByMemberId.get(conversation.assignee.id) ?? 0) + 1,
    );
  }

  return [...activeMembers].sort((left, right) => {
    const loadDifference =
      (loadByMemberId.get(left.id) ?? 0) - (loadByMemberId.get(right.id) ?? 0);

    return loadDifference !== 0
      ? loadDifference
      : left.id.localeCompare(right.id);
  })[0];
};
