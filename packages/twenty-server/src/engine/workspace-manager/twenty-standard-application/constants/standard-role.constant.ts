import { v5 } from 'uuid';

import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { SystemPermissionFlag } from 'twenty-shared/constants';

export const STANDARD_ROLE = {
  admin: { universalIdentifier: '20202020-02c2-43f2-b94d-cab1f2b532eb' },
  defaultFunction: {
    universalIdentifier: 'd1e09000-0000-4000-8000-000000000001',
  },
} as const satisfies Record<string, { universalIdentifier: string }>;

export const ROLE_OBJECT_PERMISSION_UUID_NAMESPACE =
  'b403ec59-4d80-4f22-85e6-717a192dc9cb';

export const ROLE_PERMISSION_FLAG_UUID_NAMESPACE =
  'b9a3b3b3-58a3-4f6c-9c1f-3a4f6c9c1f3a';

const DEFAULT_FUNCTION_READ_WRITE_OBJECT_NAMES = [
  'person',
  'company',
  'opportunity',
  'task',
  'taskTarget',
  'note',
  'noteTarget',
  'inboxConversation',
  'inboxConversationEvent',
  'inboxMessage',
  'inboxSavedReply',
  'inboxLabel',
  'inboxConversationLabel',
  'inboxTeam',
  'inboxTeamMember',
  'inboxMention',
  'inboxMacro',
  'inboxAutomation',
  'commercialSignal',
  'successPlan',
  'successMilestone',
  'customerRenewal',
  'customerRenewalEvent',
  'aiAction',
  'offer',
] as const;

const DEFAULT_FUNCTION_READ_ONLY_OBJECT_NAMES = [
  'workspaceMember',
  'diexWorkspaceContext',
  'workspaceArchitectureArtifact',
] as const;

export const STANDARD_ROLE_OBJECT_PERMISSION_DEFINITIONS = [
  ...DEFAULT_FUNCTION_READ_WRITE_OBJECT_NAMES.map((objectName) => ({
    objectUniversalIdentifier: STANDARD_OBJECTS[objectName].universalIdentifier,
    canReadObjectRecords: true,
    canUpdateObjectRecords: true,
    canSoftDeleteObjectRecords: false,
    canDestroyObjectRecords: false,
  })),
  ...DEFAULT_FUNCTION_READ_ONLY_OBJECT_NAMES.map((objectName) => ({
    objectUniversalIdentifier: STANDARD_OBJECTS[objectName].universalIdentifier,
    canReadObjectRecords: true,
    canUpdateObjectRecords: false,
    canSoftDeleteObjectRecords: false,
    canDestroyObjectRecords: false,
  })),
] as const;

export const STANDARD_ROLE_PERMISSION_FLAG_UNIVERSAL_IDENTIFIERS = [
  SystemPermissionFlag.AI,
] as const;

export const getStandardRoleObjectPermissionUniversalIdentifier = ({
  roleUniversalIdentifier,
  objectUniversalIdentifier,
}: {
  roleUniversalIdentifier: string;
  objectUniversalIdentifier: string;
}) =>
  v5(
    `${roleUniversalIdentifier}:${objectUniversalIdentifier}`,
    ROLE_OBJECT_PERMISSION_UUID_NAMESPACE,
  );

export const getStandardRolePermissionFlagUniversalIdentifier = ({
  roleUniversalIdentifier,
  permissionFlagUniversalIdentifier,
}: {
  roleUniversalIdentifier: string;
  permissionFlagUniversalIdentifier: string;
}) =>
  v5(
    `${roleUniversalIdentifier}:${permissionFlagUniversalIdentifier}`,
    ROLE_PERMISSION_FLAG_UUID_NAMESPACE,
  );
