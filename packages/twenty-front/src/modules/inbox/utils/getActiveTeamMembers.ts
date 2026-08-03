import { isDefined } from 'twenty-shared/utils';

import {
  type InboxTeam,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';

export const getActiveTeamMembers = (
  team?: InboxTeam | null,
): InboxWorkspaceMember[] => {
  if (!isDefined(team) || !isDefined(team.memberships)) {
    return [];
  }

  return team.memberships
    .filter(
      ({ isActive, workspaceMember }) => isActive && isDefined(workspaceMember),
    )
    .flatMap(({ workspaceMember }) =>
      isDefined(workspaceMember) ? [workspaceMember] : [],
    );
};
