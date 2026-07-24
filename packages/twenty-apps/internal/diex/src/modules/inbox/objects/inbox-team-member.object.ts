import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  INBOX_TEAM_MEMBER_FIELD_IDS,
  INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
  INBOX_TEAM_OPTION_IDS,
} from 'src/modules/inbox/constants/inbox-team.constants';

export enum InboxTeamMemberRole {
  LEAD = 'LEAD',
  MEMBER = 'MEMBER',
}

export default defineObject({
  universalIdentifier: INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
  nameSingular: 'inboxTeamMember',
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
      type: FieldType.TEXT,
      name: 'name',
      label: 'Vínculo',
      description: 'Nome legível, como Vendas - Pedro.',
      icon: 'IconLink',
      isUnique: true,
    },
    {
      universalIdentifier: INBOX_TEAM_MEMBER_FIELD_IDS.role,
      type: FieldType.SELECT,
      name: 'role',
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
      type: FieldType.BOOLEAN,
      name: 'isActive',
      label: 'Ativo',
      icon: 'IconToggleRight',
      defaultValue: true,
    },
    {
      universalIdentifier: INBOX_TEAM_MEMBER_FIELD_IDS.joinedAt,
      type: FieldType.DATE_TIME,
      name: 'joinedAt',
      label: 'Entrou em',
      icon: 'IconClock',
      isNullable: true,
    },
  ],
});
