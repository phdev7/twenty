import { defineObject, FieldType } from 'twenty-sdk/define';

export enum AccessRequestStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  NEGOTIATING = 'NEGOTIATING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const ACCESS_REQUEST_UNIVERSAL_IDENTIFIER =
  'd1e17000-0000-4000-8000-000000000001';
export const ACCESS_REQUEST_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e17100-0000-4000-8000-000000000001';
export const ACCESS_REQUEST_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e17100-0000-4000-8000-000000000002';
export const ACCESS_REQUEST_CONTACT_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e17100-0000-4000-8000-000000000003';
export const ACCESS_REQUEST_EMAIL_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e17100-0000-4000-8000-000000000004';
export const ACCESS_REQUEST_WHATSAPP_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e17100-0000-4000-8000-000000000005';
export const ACCESS_REQUEST_TEAM_SIZE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e17100-0000-4000-8000-000000000006';
export const ACCESS_REQUEST_DESIRED_SUBDOMAIN_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e17100-0000-4000-8000-000000000007';
export const ACCESS_REQUEST_GOAL_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e17100-0000-4000-8000-000000000008';
export const ACCESS_REQUEST_REQUESTED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e17100-0000-4000-8000-000000000009';
export const ACCESS_REQUEST_REVIEWED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e17100-0000-4000-8000-00000000000a';
export const ACCESS_REQUEST_REVIEW_NOTES_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e17100-0000-4000-8000-00000000000b';
export const ACCESS_REQUEST_PROVISIONED_SUBDOMAIN_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e17100-0000-4000-8000-00000000000c';
export const ACCESS_REQUEST_SUBMISSION_COUNT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e17100-0000-4000-8000-00000000000d';

export default defineObject({
  universalIdentifier: ACCESS_REQUEST_UNIVERSAL_IDENTIFIER,
  nameSingular: 'diexAccessRequest',
  namePlural: 'diexAccessRequests',
  labelSingular: 'Solicitação de acesso',
  labelPlural: 'Solicitações de acesso',
  description:
    'Empresa que pediu acesso pelo site e ainda não tem workspace. Nada é provisionado até a aprovação: sem subdomínio, sem instância de WhatsApp, sem consumo de servidor.',
  icon: 'IconUserQuestion',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier:
    ACCESS_REQUEST_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: ACCESS_REQUEST_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Empresa',
      description: 'Nome da empresa que solicitou o acesso.',
      icon: 'IconBuilding',
    },
    {
      universalIdentifier: ACCESS_REQUEST_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${AccessRequestStatus.NEW}'`,
      options: [
        {
          id: 'd1e17110-0000-4000-8000-000000000001',
          value: AccessRequestStatus.NEW,
          label: 'Nova',
          position: 0,
          color: 'blue',
        },
        {
          id: 'd1e17110-0000-4000-8000-000000000002',
          value: AccessRequestStatus.CONTACTED,
          label: 'Contatada',
          position: 1,
          color: 'purple',
        },
        {
          id: 'd1e17110-0000-4000-8000-000000000003',
          value: AccessRequestStatus.NEGOTIATING,
          label: 'Em negociação',
          position: 2,
          color: 'yellow',
        },
        {
          id: 'd1e17110-0000-4000-8000-000000000004',
          value: AccessRequestStatus.APPROVED,
          label: 'Aprovada',
          position: 3,
          color: 'green',
        },
        {
          id: 'd1e17110-0000-4000-8000-000000000005',
          value: AccessRequestStatus.REJECTED,
          label: 'Recusada',
          position: 4,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier:
        ACCESS_REQUEST_CONTACT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'contactName',
      label: 'Quem pediu',
      description: 'Nome da pessoa responsável pelo contato.',
      icon: 'IconUser',
      isNullable: true,
    },
    {
      universalIdentifier: ACCESS_REQUEST_EMAIL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'email',
      label: 'E-mail',
      description:
        'Identifica a solicitação: um novo envio com o mesmo e-mail atualiza o registro existente em vez de duplicar.',
      icon: 'IconMail',
      isNullable: true,
    },
    {
      universalIdentifier: ACCESS_REQUEST_WHATSAPP_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'whatsapp',
      label: 'WhatsApp',
      description:
        'Número em E.164, no mesmo formato do contactHandle das conversas, para casar a solicitação com o atendimento na inbox.',
      icon: 'IconBrandWhatsapp',
      isNullable: true,
    },
    {
      universalIdentifier: ACCESS_REQUEST_TEAM_SIZE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'teamSize',
      label: 'Tamanho do time comercial',
      icon: 'IconUsers',
      isNullable: true,
    },
    {
      universalIdentifier:
        ACCESS_REQUEST_DESIRED_SUBDOMAIN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'desiredSubdomain',
      label: 'Subdomínio desejado',
      description:
        'Preferência declarada pelo solicitante. Nada é reservado enquanto a solicitação não for aprovada.',
      icon: 'IconWorldWww',
      isNullable: true,
    },
    {
      universalIdentifier: ACCESS_REQUEST_GOAL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'goal',
      label: 'O que quer resolver',
      icon: 'IconTargetArrow',
      isNullable: true,
    },
    {
      universalIdentifier:
        ACCESS_REQUEST_REQUESTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'requestedAt',
      label: 'Solicitado em',
      icon: 'IconCalendarPlus',
      isNullable: true,
    },
    {
      universalIdentifier:
        ACCESS_REQUEST_SUBMISSION_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'submissionCount',
      label: 'Envios',
      description:
        'Quantas vezes o mesmo e-mail enviou o formulário. Vários envios indicam interesse real ou um robô.',
      icon: 'IconRepeat',
      isNullable: true,
    },
    {
      universalIdentifier:
        ACCESS_REQUEST_REVIEWED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'reviewedAt',
      label: 'Decidido em',
      icon: 'IconCalendarCheck',
      isNullable: true,
    },
    {
      universalIdentifier:
        ACCESS_REQUEST_REVIEW_NOTES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'reviewNotes',
      label: 'Notas da negociação',
      icon: 'IconNotes',
      isNullable: true,
    },
    {
      universalIdentifier:
        ACCESS_REQUEST_PROVISIONED_SUBDOMAIN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'provisionedSubdomain',
      label: 'Subdomínio entregue',
      description:
        'Preenchido depois que o workspace é criado, para ligar a solicitação ao cliente ativo.',
      icon: 'IconCircleCheck',
      isNullable: true,
    },
  ],
});
