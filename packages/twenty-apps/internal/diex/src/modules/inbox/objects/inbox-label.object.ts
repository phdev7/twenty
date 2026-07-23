import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  INBOX_LABEL_FIELD_IDS,
  INBOX_LABEL_OPTION_IDS,
  INBOX_LABEL_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-label.constants';

export enum InboxLabelStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum InboxLabelColor {
  BLUE = 'BLUE',
  GREEN = 'GREEN',
  ORANGE = 'ORANGE',
  RED = 'RED',
  TURQUOISE = 'TURQUOISE',
  YELLOW = 'YELLOW',
  GRAY = 'GRAY',
}

export default defineObject({
  universalIdentifier: INBOX_LABEL_UNIVERSAL_IDENTIFIER,
  nameSingular: 'inboxLabel',
  namePlural: 'inboxLabels',
  labelSingular: 'Etiqueta da inbox',
  labelPlural: 'Etiquetas da inbox',
  description:
    'Etiquetas configuráveis para organizar conversas por intenção, temperatura, objeção e etapa comercial.',
  icon: 'IconTags',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: INBOX_LABEL_FIELD_IDS.name,
  fields: [
    {
      universalIdentifier: INBOX_LABEL_FIELD_IDS.name,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Nome',
      icon: 'IconTag',
    },
    {
      universalIdentifier: INBOX_LABEL_FIELD_IDS.slug,
      type: FieldType.TEXT,
      name: 'slug',
      label: 'Chave',
      description:
        'Identificador estável e único. Exemplo: lead-quente, proposta ou objecao-preco.',
      icon: 'IconHash',
      isUnique: true,
    },
    {
      universalIdentifier: INBOX_LABEL_FIELD_IDS.color,
      type: FieldType.SELECT,
      name: 'color',
      label: 'Cor',
      icon: 'IconPalette',
      defaultValue: `'${InboxLabelColor.BLUE}'`,
      options: [
        {
          id: INBOX_LABEL_OPTION_IDS.color.blue,
          value: InboxLabelColor.BLUE,
          label: 'Azul',
          position: 0,
          color: 'blue',
        },
        {
          id: INBOX_LABEL_OPTION_IDS.color.green,
          value: InboxLabelColor.GREEN,
          label: 'Verde',
          position: 1,
          color: 'green',
        },
        {
          id: INBOX_LABEL_OPTION_IDS.color.orange,
          value: InboxLabelColor.ORANGE,
          label: 'Laranja',
          position: 2,
          color: 'orange',
        },
        {
          id: INBOX_LABEL_OPTION_IDS.color.red,
          value: InboxLabelColor.RED,
          label: 'Vermelho',
          position: 3,
          color: 'red',
        },
        {
          id: INBOX_LABEL_OPTION_IDS.color.turquoise,
          value: InboxLabelColor.TURQUOISE,
          label: 'Turquesa',
          position: 4,
          color: 'turquoise',
        },
        {
          id: INBOX_LABEL_OPTION_IDS.color.yellow,
          value: InboxLabelColor.YELLOW,
          label: 'Amarelo',
          position: 5,
          color: 'yellow',
        },
        {
          id: INBOX_LABEL_OPTION_IDS.color.gray,
          value: InboxLabelColor.GRAY,
          label: 'Cinza',
          position: 6,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: INBOX_LABEL_FIELD_IDS.description,
      type: FieldType.TEXT,
      name: 'description',
      label: 'Descrição',
      description: 'Regra objetiva de quando a etiqueta deve ser aplicada.',
      icon: 'IconAlignLeft',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_LABEL_FIELD_IDS.status,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${InboxLabelStatus.ACTIVE}'`,
      options: [
        {
          id: INBOX_LABEL_OPTION_IDS.status.active,
          value: InboxLabelStatus.ACTIVE,
          label: 'Ativa',
          position: 0,
          color: 'green',
        },
        {
          id: INBOX_LABEL_OPTION_IDS.status.inactive,
          value: InboxLabelStatus.INACTIVE,
          label: 'Inativa',
          position: 1,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: INBOX_LABEL_FIELD_IDS.usageCount,
      type: FieldType.NUMBER,
      name: 'usageCount',
      label: 'Aplicações',
      icon: 'IconChartBar',
      defaultValue: 0,
    },
  ],
});
