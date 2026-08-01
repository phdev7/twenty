import { type ObjectManifest } from 'twenty-shared/application';
import { FieldMetadataType } from 'twenty-shared/types';

import {
  INBOX_TEAM_MEMBER_FIELD_IDS,
  INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
  INBOX_TEAM_OPTION_IDS,
} from 'src/modules/inbox/constants/inbox-team.constants';

export enum InboxTeamMemberRole {
  LEAD = 'LEAD',
  MEMBER = 'MEMBER',
}

export const InboxTeamMemberStandardObjectDefinition = {
  universalIdentifier: INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
  nameSingular: 'inboxTeamMember' as const,
  namePlural: 'inboxTeamMembers',
  labelSingular: 'Membro de equipe',
  labelPlural: 'Membros das equipes',
  description:
    'Vínculo operacional entre um usuário do workspace e uma fila da Inbox.',
  icon: 'IconUserPlus',
  labelIdentifierFieldMetadataUniversalIdentifier:
    INBOX_TEAM_MEMBER_FIELD_IDS.name,
  fields: [
    {
      universalIdentifier: INBOX_TEAM_MEMBER_FIELD_IDS.name,
      type: FieldMetadataType.TEXT,
      name: 'name',
      label: 'Vínculo',
      description: 'Nome legível, como Vendas - Pedro.',
      icon: 'IconLink',
      isUnique: true,
    },
    {
      universalIdentifier: INBOX_TEAM_MEMBER_FIELD_IDS.role,
      type: FieldMetadataType.SELECT,
      name: 'memberRole',
      label: 'Papel',
      icon: 'IconUserShield',
      defaultValue: `'${InboxTeamMemberRole.MEMBER}'`,
      options: [
        {
          id: INBOX_TEAM_OPTION_IDS.memberRole.lead,
          value: InboxTeamMemberRole.LEAD,
          label: 'Líder',
          position: 0,
          color: 'blue',
        },
        {
          id: INBOX_TEAM_OPTION_IDS.memberRole.member,
          value: InboxTeamMemberRole.MEMBER,
          label: 'Membro',
          position: 1,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: INBOX_TEAM_MEMBER_FIELD_IDS.isActive,
      type: FieldMetadataType.BOOLEAN,
      name: 'isActive',
      label: 'Ativo',
      icon: 'IconToggleRight',
      defaultValue: true,
    },
    {
      universalIdentifier: INBOX_TEAM_MEMBER_FIELD_IDS.joinedAt,
      type: FieldMetadataType.DATE_TIME,
      name: 'joinedAt',
      label: 'Entrou em',
      icon: 'IconClock',
      isNullable: true,
    },
  ],
} satisfies ObjectManifest;
