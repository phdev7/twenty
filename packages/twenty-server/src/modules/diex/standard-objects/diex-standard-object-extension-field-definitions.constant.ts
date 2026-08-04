import { type FieldManifest } from 'twenty-shared/application';
import { FieldMetadataType, type TagColor } from 'twenty-shared/types';

const STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS = {
  company: '20202020-b374-4779-a561-80086cb2e17f',
  note: '20202020-0b00-45cd-b6f6-6cd806fc6804',
  opportunity: '20202020-9549-49dd-b2b2-883999db8938',
  person: '20202020-e674-48e5-a542-72570eee7213',
  task: '20202020-1ba1-48ba-bc83-ef7e5990ed10',
} as const;

// Badges are deliberately MULTI_SELECT: a record is in exactly one lifecycle
// stage (diexLifecycle) but can carry several badges at once, and operators
// add their own values in Settings without a release.
const BADGE_OPTIONS: { value: string; label: string; color: TagColor }[] = [
  { value: 'PROSPECT', label: 'Prospect', color: 'gray' },
  { value: 'MQL', label: 'MQL', color: 'blue' },
  { value: 'SQL', label: 'SQL', color: 'sky' },
  { value: 'CUSTOMER', label: 'Cliente', color: 'green' },
  { value: 'AT_RISK', label: 'Em risco', color: 'red' },
  { value: 'CANCELLED', label: 'Cancelado', color: 'orange' },
];

const buildBadgesFieldDefinition = ({
  objectUniversalIdentifier,
  universalIdentifier,
  optionIdPrefix,
}: {
  objectUniversalIdentifier: string;
  universalIdentifier: string;
  optionIdPrefix: string;
}): FieldManifest<FieldMetadataType.MULTI_SELECT> => ({
  universalIdentifier,
  objectUniversalIdentifier,
  type: FieldMetadataType.MULTI_SELECT,
  name: 'diexBadges',
  label: 'Badges',
  description:
    'Marcadores comerciais acumuláveis do registro. As opções são editáveis pelo próprio operador.',
  icon: 'IconTags',
  isNullable: true,
  options: BADGE_OPTIONS.map((option, index) => ({
    id: `${optionIdPrefix}-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    value: option.value,
    label: option.label,
    position: index,
    color: option.color,
  })),
});

const buildLegacyDiexIdFieldDefinition = ({
  objectUniversalIdentifier,
  universalIdentifier,
}: {
  objectUniversalIdentifier: string;
  universalIdentifier: string;
}): FieldManifest<FieldMetadataType.TEXT> => ({
  universalIdentifier,
  objectUniversalIdentifier,
  type: FieldMetadataType.TEXT,
  name: 'legacyDiexId',
  label: 'ID legado Diex',
  description:
    'Identificador técnico usado para migração idempotente do CRM anterior.',
  icon: 'IconDatabaseImport',
  isNullable: true,
  isUnique: true,
});

export const DIEX_STANDARD_OBJECT_EXTENSION_FIELD_DEFINITIONS = [
  buildBadgesFieldDefinition({
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
    universalIdentifier: 'd1e05700-0000-4000-8000-000000000001',
    optionIdPrefix: 'd1e05710',
  }),
  buildBadgesFieldDefinition({
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
    universalIdentifier: 'd1e05700-0000-4000-8000-000000000002',
    optionIdPrefix: 'd1e05720',
  }),
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000013',
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
    type: FieldMetadataType.TEXT,
    name: 'diexAnnualRevenueRange',
    label: 'Faixa de faturamento anual',
    description:
      'Faixa declarada, mantida como contexto de qualificação e não como receita confirmada.',
    icon: 'IconCash',
    isNullable: true,
  },
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000014',
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
    type: FieldMetadataType.TEXT,
    name: 'diexEmployeeRange',
    label: 'Faixa de colaboradores',
    description: 'Porte declarado usado para ICP e desenho da oferta.',
    icon: 'IconUsers',
    isNullable: true,
  },
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000001',
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
    type: FieldMetadataType.SELECT,
    name: 'diexLifecycle',
    label: 'Jornada Diex',
    description: 'Situação comercial e pós-venda consolidada da conta.',
    icon: 'IconRoute',
    isNullable: true,
    options: [
      {
        id: 'd1e05510-0000-4000-8000-000000000001',
        value: 'PROSPECT',
        label: 'Prospect',
        position: 0,
        color: 'gray',
      },
      {
        id: 'd1e05510-0000-4000-8000-000000000002',
        value: 'QUALIFIED',
        label: 'Qualificada',
        position: 1,
        color: 'blue',
      },
      {
        id: 'd1e05510-0000-4000-8000-000000000003',
        value: 'CUSTOMER',
        label: 'Cliente',
        position: 2,
        color: 'green',
      },
      {
        id: 'd1e05510-0000-4000-8000-000000000004',
        value: 'EXPANSION',
        label: 'Expansão',
        position: 3,
        color: 'purple',
      },
      {
        id: 'd1e05510-0000-4000-8000-000000000005',
        value: 'AT_RISK',
        label: 'Em risco',
        position: 4,
        color: 'red',
      },
      {
        id: 'd1e05510-0000-4000-8000-000000000006',
        value: 'CHURNED',
        label: 'Churn',
        position: 5,
        color: 'orange',
      },
    ],
  },
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000012',
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
    type: FieldMetadataType.TEXT,
    name: 'diexNiche',
    label: 'Nicho',
    description:
      'Nicho específico da conta para abordagem comercial contextual.',
    icon: 'IconTargetArrow',
    isNullable: true,
  },
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000011',
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
    type: FieldMetadataType.TEXT,
    name: 'diexSegment',
    label: 'Segmento',
    description:
      'Segmento comercial usado para aderência ao ICP e priorização.',
    icon: 'IconCategory',
    isNullable: true,
  },
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000002',
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
    type: FieldMetadataType.RATING,
    name: 'icpFit',
    label: 'Aderência ao ICP',
    description: 'Quanto esta empresa combina com o perfil de cliente ideal.',
    icon: 'IconTargetArrow',
    isNullable: true,
    options: [
      {
        id: 'd1e05520-0000-4000-8000-000000000001',
        value: 'RATING_1',
        label: '1',
        position: 0,
      },
      {
        id: 'd1e05520-0000-4000-8000-000000000002',
        value: 'RATING_2',
        label: '2',
        position: 1,
      },
      {
        id: 'd1e05520-0000-4000-8000-000000000003',
        value: 'RATING_3',
        label: '3',
        position: 2,
      },
      {
        id: 'd1e05520-0000-4000-8000-000000000004',
        value: 'RATING_4',
        label: '4',
        position: 3,
      },
      {
        id: 'd1e05520-0000-4000-8000-000000000005',
        value: 'RATING_5',
        label: '5',
        position: 4,
      },
    ],
  },
  buildLegacyDiexIdFieldDefinition({
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
    universalIdentifier: 'd1e05500-0000-4000-8000-00000000000d',
  }),
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-00000000000a',
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
    type: FieldMetadataType.BOOLEAN,
    name: 'budgetConfirmed',
    label: 'Orçamento confirmado',
    description:
      'Confirma que existe orçamento ou fonte de verba validada para a compra.',
    icon: 'IconCashBanknote',
    isNullable: true,
  },
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000005',
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
    type: FieldMetadataType.NUMBER,
    name: 'commercialScore',
    label: 'Score comercial',
    description: 'Pontuação de 0 a 100 para priorização da oportunidade.',
    icon: 'IconChartBar',
    isNullable: true,
  },
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000008',
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
    type: FieldMetadataType.SELECT,
    name: 'dealRisk',
    label: 'Risco do negócio',
    description: 'Risco consolidado de perda ou estagnação.',
    icon: 'IconAlertTriangle',
    isNullable: true,
    options: [
      {
        id: 'd1e05550-0000-4000-8000-000000000001',
        value: 'LOW',
        label: 'Baixo',
        position: 0,
        color: 'green',
      },
      {
        id: 'd1e05550-0000-4000-8000-000000000002',
        value: 'MEDIUM',
        label: 'Médio',
        position: 1,
        color: 'orange',
      },
      {
        id: 'd1e05550-0000-4000-8000-000000000003',
        value: 'HIGH',
        label: 'Alto',
        position: 2,
        color: 'red',
      },
      {
        id: 'd1e05550-0000-4000-8000-000000000004',
        value: 'UNKNOWN',
        label: 'Não avaliado',
        position: 3,
        color: 'gray',
      },
    ],
  },
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000009',
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
    type: FieldMetadataType.BOOLEAN,
    name: 'decisionAccessConfirmed',
    label: 'Acesso ao decisor',
    description:
      'Confirma que a equipe possui acesso direto ou validado à pessoa que decide a compra.',
    icon: 'IconUserCheck',
    isNullable: true,
  },
  buildLegacyDiexIdFieldDefinition({
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
    universalIdentifier: 'd1e05500-0000-4000-8000-00000000000f',
  }),
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-00000000000b',
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
    type: FieldMetadataType.BOOLEAN,
    name: 'needConfirmed',
    label: 'Necessidade confirmada',
    description:
      'Confirma que o problema, impacto e necessidade de mudança foram validados.',
    icon: 'IconCircleCheck',
    isNullable: true,
  },
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000006',
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
    type: FieldMetadataType.TEXT,
    name: 'nextCommercialAction',
    label: 'Próxima ação',
    description: 'Próximo passo objetivo que move a venda.',
    icon: 'IconArrowRight',
    isNullable: true,
  },
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000007',
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
    type: FieldMetadataType.DATE_TIME,
    name: 'nextCommercialActionAt',
    label: 'Executar próxima ação em',
    description: 'Data de compromisso do próximo passo comercial.',
    icon: 'IconCalendarDue',
    isNullable: true,
  },
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-00000000000c',
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
    type: FieldMetadataType.BOOLEAN,
    name: 'timingConfirmed',
    label: 'Prazo confirmado',
    description:
      'Confirma que o prazo de decisão ou implantação foi validado com o cliente.',
    icon: 'IconCalendarCheck',
    isNullable: true,
  },
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000004',
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
    type: FieldMetadataType.RATING,
    name: 'buyingIntent',
    label: 'Intenção de compra',
    description: 'Intensidade atual do interesse comercial.',
    icon: 'IconFlame',
    isNullable: true,
    options: [
      {
        id: 'd1e05540-0000-4000-8000-000000000001',
        value: 'RATING_1',
        label: '1',
        position: 0,
      },
      {
        id: 'd1e05540-0000-4000-8000-000000000002',
        value: 'RATING_2',
        label: '2',
        position: 1,
      },
      {
        id: 'd1e05540-0000-4000-8000-000000000003',
        value: 'RATING_3',
        label: '3',
        position: 2,
      },
      {
        id: 'd1e05540-0000-4000-8000-000000000004',
        value: 'RATING_4',
        label: '4',
        position: 3,
      },
      {
        id: 'd1e05540-0000-4000-8000-000000000005',
        value: 'RATING_5',
        label: '5',
        position: 4,
      },
    ],
  },
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000003',
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
    type: FieldMetadataType.SELECT,
    name: 'buyingRole',
    label: 'Papel na compra',
    description: 'Influência desta pessoa na decisão comercial.',
    icon: 'IconUsersGroup',
    isNullable: true,
    options: [
      {
        id: 'd1e05530-0000-4000-8000-000000000001',
        value: 'DECISION_MAKER',
        label: 'Decisor',
        position: 0,
        color: 'purple',
      },
      {
        id: 'd1e05530-0000-4000-8000-000000000002',
        value: 'CHAMPION',
        label: 'Campeão interno',
        position: 1,
        color: 'green',
      },
      {
        id: 'd1e05530-0000-4000-8000-000000000003',
        value: 'INFLUENCER',
        label: 'Influenciador',
        position: 2,
        color: 'blue',
      },
      {
        id: 'd1e05530-0000-4000-8000-000000000004',
        value: 'USER',
        label: 'Usuário',
        position: 3,
        color: 'sky',
      },
      {
        id: 'd1e05530-0000-4000-8000-000000000005',
        value: 'BLOCKER',
        label: 'Bloqueador',
        position: 4,
        color: 'red',
      },
      {
        id: 'd1e05530-0000-4000-8000-000000000006',
        value: 'UNKNOWN',
        label: 'Não identificado',
        position: 5,
        color: 'gray',
      },
    ],
  },
  {
    universalIdentifier: 'd1e05600-0000-4000-8000-000000000004',
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
    type: FieldMetadataType.BOOLEAN,
    name: 'doNotContact',
    label: 'Não contatar',
    description:
      'Bloqueio operacional prioritário para mensagens e cadências externas.',
    icon: 'IconUserOff',
    defaultValue: false,
  },
  buildLegacyDiexIdFieldDefinition({
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
    universalIdentifier: 'd1e05500-0000-4000-8000-00000000000e',
  }),
  {
    universalIdentifier: 'd1e05600-0000-4000-8000-000000000003',
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
    type: FieldMetadataType.DATE_TIME,
    name: 'whatsappConsentAt',
    label: 'Consentimento registrado em',
    description:
      'Momento em que a autorização ou recusa mais recente foi registrada.',
    icon: 'IconCalendarCheck',
    isNullable: true,
  },
  {
    universalIdentifier: 'd1e05600-0000-4000-8000-000000000002',
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
    type: FieldMetadataType.SELECT,
    name: 'whatsappConsentStatus',
    label: 'Consentimento WhatsApp',
    description:
      'Base factual para permitir ou bloquear contato ativo pelo WhatsApp.',
    icon: 'IconShieldCheck',
    defaultValue: "'UNKNOWN'",
    options: [
      {
        id: 'd1e05610-0000-4000-8000-000000000001',
        value: 'UNKNOWN',
        label: 'Não confirmado',
        position: 0,
        color: 'gray',
      },
      {
        id: 'd1e05610-0000-4000-8000-000000000002',
        value: 'OPTED_IN',
        label: 'Autorizado',
        position: 1,
        color: 'green',
      },
      {
        id: 'd1e05610-0000-4000-8000-000000000003',
        value: 'OPTED_OUT',
        label: 'Recusado',
        position: 2,
        color: 'red',
      },
    ],
  },
  {
    universalIdentifier: 'd1e05600-0000-4000-8000-000000000001',
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
    type: FieldMetadataType.TEXT,
    name: 'whatsappNormalizedPhone',
    label: 'WhatsApp normalizado',
    description:
      'Número somente com dígitos usado para relacionar mensagens recebidas sem depender da formatação visual.',
    icon: 'IconBrandWhatsapp',
    isNullable: true,
    isUnique: true,
  },
  buildLegacyDiexIdFieldDefinition({
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note,
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000015',
  }),
  {
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000016',
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
    type: FieldMetadataType.SELECT,
    name: 'taskCategory',
    label: 'Frente',
    description:
      'Separa o trabalho comercial, que persegue receita nova, do operacional, que entrega e sustenta o valor já vendido.',
    icon: 'IconRoute',
    isNullable: true,
    defaultValue: "'COMMERCIAL'",
    options: [
      {
        id: 'd1e05560-0000-4000-8000-000000000001',
        value: 'COMMERCIAL',
        label: 'Comercial',
        position: 0,
        color: 'blue',
      },
      {
        id: 'd1e05560-0000-4000-8000-000000000002',
        value: 'OPERATIONAL',
        label: 'Operacional',
        position: 1,
        color: 'turquoise',
      },
    ],
  },
  buildLegacyDiexIdFieldDefinition({
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
    universalIdentifier: 'd1e05500-0000-4000-8000-000000000010',
  }),
] as const satisfies readonly FieldManifest[];
