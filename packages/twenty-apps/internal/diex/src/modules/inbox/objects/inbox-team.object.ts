import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  INBOX_TEAM_FIELD_IDS,
  INBOX_TEAM_OPTION_IDS,
  INBOX_TEAM_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-team.constants';

export enum InboxTeamStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum InboxTeamRoutingStrategy {
  MANUAL = 'MANUAL',
  BALANCED = 'BALANCED',
}

export default defineObject({
  universalIdentifier: INBOX_TEAM_UNIVERSAL_IDENTIFIER,
  nameSingular: 'inboxTeam',
  namePlural: 'inboxTeams',
  labelSingular: 'Equipe da inbox',
  labelPlural: 'Equipes da inbox',
  description:
    'Filas comerciais responsáveis por receber, distribuir e responder conversas dentro do SLA.',
  icon: 'IconUsersGroup',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: INBOX_TEAM_FIELD_IDS.name,
  fields: [
    {
      universalIdentifier: INBOX_TEAM_FIELD_IDS.name,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Nome',
      icon: 'IconUsersGroup',
    },
    {
      universalIdentifier: INBOX_TEAM_FIELD_IDS.key,
      type: FieldType.TEXT,
      name: 'key',
      label: 'Chave',
      description: 'Identificador único, como vendas, cs ou renovacoes.',
      icon: 'IconHash',
      isUnique: true,
    },
    {
      universalIdentifier: INBOX_TEAM_FIELD_IDS.description,
      type: FieldType.TEXT,
      name: 'description',
      label: 'Responsabilidade',
      description: 'Escopo objetivo das conversas que entram nesta equipe.',
      icon: 'IconAlignLeft',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_TEAM_FIELD_IDS.status,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${InboxTeamStatus.ACTIVE}'`,
      options: [
        {
          id: INBOX_TEAM_OPTION_IDS.status.active,
          value: InboxTeamStatus.ACTIVE,
          label: 'Ativa',
          position: 0,
          color: 'green',
        },
        {
          id: INBOX_TEAM_OPTION_IDS.status.inactive,
          value: InboxTeamStatus.INACTIVE,
          label: 'Inativa',
          position: 1,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: INBOX_TEAM_FIELD_IDS.routingStrategy,
      type: FieldType.SELECT,
      name: 'routingStrategy',
      label: 'Distribuição',
      icon: 'IconArrowsShuffle',
      defaultValue: `'${InboxTeamRoutingStrategy.MANUAL}'`,
      options: [
        {
          id: INBOX_TEAM_OPTION_IDS.routingStrategy.manual,
          value: InboxTeamRoutingStrategy.MANUAL,
          label: 'Manual',
          position: 0,
          color: 'gray',
        },
        {
          id: INBOX_TEAM_OPTION_IDS.routingStrategy.balanced,
          value: InboxTeamRoutingStrategy.BALANCED,
          label: 'Menor carga',
          position: 1,
          color: 'blue',
        },
      ],
    },
    {
      universalIdentifier: INBOX_TEAM_FIELD_IDS.defaultResponseSlaMinutes,
      type: FieldType.NUMBER,
      name: 'defaultResponseSlaMinutes',
      label: 'SLA padrão em minutos',
      icon: 'IconClock',
      defaultValue: 60,
    },
    {
      universalIdentifier: INBOX_TEAM_FIELD_IDS.isDefault,
      type: FieldType.BOOLEAN,
      name: 'isDefault',
      label: 'Fila padrão',
      description:
        'A primeira equipe padrão ativa recebe novas conversas sem outra regra.',
      icon: 'IconRoute',
      defaultValue: false,
    },
  ],
});
