import { type ReactNode } from 'react';
import {
  SidePanelPages,
  enqueueSnackbar,
  openSidePanelPage,
} from 'twenty-sdk/front-component';
import {
  IconAlertTriangle,
  IconBriefcase,
  IconBuildingSkyscraper,
  IconCalendarDue,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconInbox,
  IconListCheck,
  IconPlug,
  IconTags,
  IconUser,
  IconUserPin,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import {
  type InboxConversation,
  type InboxLabel,
  type InboxRecordReference,
} from 'src/modules/inbox/front-components/types/inbox.types';
import {
  formatDateTime,
  getPriorityLabel,
  getRecordName,
  getTaskStatusLabel,
} from 'src/modules/inbox/front-components/utils/inbox-formatters';
import {
  getLabelChipStyle,
  inboxStyles,
} from 'src/modules/inbox/front-components/inbox.styles';

type CrmContextProps = {
  conversation: InboxConversation | null;
  labels: InboxLabel[];
  busyAction: string | null;
  onToggleLabel: (label: InboxLabel) => Promise<void>;
  onConfigureEvolution: () => Promise<void>;
};

type RecordCardProps = {
  icon: ReactNode;
  label: string;
  objectNameSingular: string;
  record?: InboxRecordReference | null;
  value?: string;
};

const openRecord = async (recordId: string, objectNameSingular: string) => {
  try {
    await openSidePanelPage({
      page: SidePanelPages.ViewRecord,
      recordId,
      objectNameSingular,
    });
  } catch {
    await enqueueSnackbar({
      message: 'Não foi possível abrir este registro.',
      variant: 'error',
    });
  }
};

const RecordCard = ({
  icon,
  label,
  objectNameSingular,
  record,
  value,
}: RecordCardProps) => {
  const recordName = value || getRecordName(record) || 'Não vinculado';
  const canOpen = Boolean(record?.id);

  return (
    <button
      type="button"
      disabled={!canOpen}
      style={{
        ...inboxStyles.contextCard,
        cursor: canOpen ? 'pointer' : 'default',
        fontFamily: themeCssVariables.font.family,
        opacity: canOpen ? 1 : 0.72,
        textAlign: 'left',
        width: '100%',
      }}
      onClick={() => {
        if (record?.id) {
          void openRecord(record.id, objectNameSingular);
        }
      }}
    >
      <span style={inboxStyles.contextCardIcon}>{icon}</span>
      <span style={inboxStyles.contextCardBody}>
        <span style={inboxStyles.contextCardLabel}>{label}</span>
        <span
          style={{
            ...inboxStyles.contextCardValue,
            display: 'block',
          }}
        >
          {recordName}
        </span>
      </span>
      {canOpen ? (
        <IconChevronRight
          size={themeCssVariables.icon.size.sm}
          stroke={themeCssVariables.icon.stroke.md}
        />
      ) : null}
    </button>
  );
};

type DeadlineCardProps = {
  icon: ReactNode;
  label: string;
  value?: string | null;
  danger?: boolean;
};

const DeadlineCard = ({
  icon,
  label,
  value,
  danger = false,
}: DeadlineCardProps) => (
  <div
    style={{
      ...inboxStyles.contextCard,
      ...(danger
        ? {
            background: themeCssVariables.background.transparent.danger,
            borderColor: themeCssVariables.border.color.danger,
          }
        : {}),
    }}
  >
    <span
      style={{
        ...inboxStyles.contextCardIcon,
        ...(danger
          ? {
              color: themeCssVariables.font.color.danger,
            }
          : {}),
      }}
    >
      {icon}
    </span>
    <span style={inboxStyles.contextCardBody}>
      <span style={inboxStyles.contextCardLabel}>{label}</span>
      <span
        style={{
          ...inboxStyles.contextCardValue,
          display: 'block',
        }}
      >
        {formatDateTime(value)}
      </span>
    </span>
  </div>
);

export const CrmContext = ({
  conversation,
  labels,
  busyAction,
  onToggleLabel,
  onConfigureEvolution,
}: CrmContextProps) => {
  if (conversation === null) {
    return (
      <aside
        style={{
          ...inboxStyles.panel,
          ...inboxStyles.rightPanel,
        }}
      >
        <header style={inboxStyles.sectionHeader}>
          <div style={inboxStyles.titleRow}>
            <div>
              <h2 style={inboxStyles.title}>Contexto comercial</h2>
              <p style={inboxStyles.subtitle}>Canal e dados do CRM</p>
            </div>
            <button
              type="button"
              aria-label="Configurar canal Evolution"
              title="Configurar canal Evolution com as credenciais seguras do servidor"
              disabled={busyAction !== null}
              style={{
                ...inboxStyles.iconButton,
                ...(busyAction !== null ? inboxStyles.disabledButton : {}),
              }}
              onClick={() => void onConfigureEvolution()}
            >
              <IconPlug
                size={themeCssVariables.icon.size.md}
                stroke={themeCssVariables.icon.stroke.md}
              />
            </button>
          </div>
        </header>
        <div style={inboxStyles.emptyState}>
          <IconBriefcase
            size={themeCssVariables.icon.size.xl}
            stroke={themeCssVariables.icon.stroke.sm}
          />
          O contexto comercial aparece após selecionar uma conversa.
        </div>
      </aside>
    );
  }

  const openTasks = conversation.tasks.filter(
    ({ status }) => status !== 'DONE',
  );
  const activeLabelIds = new Set(
    conversation.labelAssignments
      .filter(({ isActive }) => isActive)
      .map(({ label }) => label.id),
  );

  return (
    <aside
      style={{
        ...inboxStyles.panel,
        ...inboxStyles.rightPanel,
      }}
    >
      <header style={inboxStyles.sectionHeader}>
        <div style={inboxStyles.titleRow}>
          <div>
            <h2 style={inboxStyles.title}>Contexto comercial</h2>
            <p style={inboxStyles.subtitle}>Dados do CRM ligados à conversa</p>
          </div>
          <div style={inboxStyles.headerActions}>
            <button
              type="button"
              aria-label="Configurar canal Evolution"
              title="Configurar canal Evolution com as credenciais seguras do servidor"
              disabled={busyAction !== null}
              style={{
                ...inboxStyles.iconButton,
                ...(busyAction !== null ? inboxStyles.disabledButton : {}),
              }}
              onClick={() => void onConfigureEvolution()}
            >
              <IconPlug
                size={themeCssVariables.icon.size.md}
                stroke={themeCssVariables.icon.stroke.md}
              />
            </button>
            <button
              type="button"
              aria-label="Abrir registro da conversa"
              title="Abrir registro da conversa"
              style={inboxStyles.iconButton}
              onClick={() =>
                void openRecord(conversation.id, 'inboxConversation')
              }
            >
              <IconInbox
                size={themeCssVariables.icon.size.md}
                stroke={themeCssVariables.icon.stroke.md}
              />
            </button>
          </div>
        </div>
      </header>

      <div style={inboxStyles.contextScroll}>
        <section style={inboxStyles.contextSection}>
          <h3 style={inboxStyles.contextSectionTitle}>
            Etiquetas ({activeLabelIds.size})
          </h3>
          {labels.length === 0 ? (
            <div style={inboxStyles.contextCard}>
              <span style={inboxStyles.contextCardIcon}>
                <IconTags
                  size={themeCssVariables.icon.size.sm}
                  stroke={themeCssVariables.icon.stroke.md}
                />
              </span>
              <span style={inboxStyles.contextCardBody}>
                <span style={inboxStyles.contextCardValue}>
                  Cadastre etiquetas em Diex &gt; Etiquetas da inbox
                </span>
              </span>
            </div>
          ) : (
            <div style={inboxStyles.labelPicker}>
              {labels.map((label) => {
                const isActive = activeLabelIds.has(label.id);

                return (
                  <button
                    key={label.id}
                    type="button"
                    title={label.description ?? label.name}
                    disabled={busyAction !== null}
                    style={{
                      ...inboxStyles.labelToggle,
                      ...getLabelChipStyle(label.color, isActive),
                      ...(busyAction === `label:${label.id}`
                        ? inboxStyles.disabledButton
                        : {}),
                    }}
                    onClick={() => void onToggleLabel(label)}
                  >
                    {isActive ? '✓ ' : '+ '}
                    {label.name}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section style={inboxStyles.contextSection}>
          <h3 style={inboxStyles.contextSectionTitle}>Relacionamentos</h3>
          <RecordCard
            icon={
              <IconUser
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            }
            label="Pessoa"
            objectNameSingular="person"
            record={conversation.person}
          />
          <RecordCard
            icon={
              <IconBuildingSkyscraper
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            }
            label="Empresa"
            objectNameSingular="company"
            record={conversation.company}
          />
          <RecordCard
            icon={
              <IconBriefcase
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            }
            label="Oportunidade"
            objectNameSingular="opportunity"
            record={conversation.opportunity}
            value={
              conversation.opportunity
                ? `${getRecordName(conversation.opportunity)}${
                    conversation.opportunity.stage
                      ? ` · ${conversation.opportunity.stage}`
                      : ''
                  }`
                : undefined
            }
          />
          <RecordCard
            icon={
              <IconUserPin
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            }
            label="Responsável"
            objectNameSingular="workspaceMember"
            record={conversation.assignee}
          />
        </section>

        <section style={inboxStyles.contextSection}>
          <h3 style={inboxStyles.contextSectionTitle}>Operação</h3>
          <div style={inboxStyles.contextCard}>
            <span style={inboxStyles.contextCardIcon}>
              <IconAlertTriangle
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            </span>
            <span style={inboxStyles.contextCardBody}>
              <span style={inboxStyles.contextCardLabel}>Prioridade</span>
              <span
                style={{
                  ...inboxStyles.contextCardValue,
                  display: 'block',
                }}
              >
                {getPriorityLabel(conversation.priority)}
              </span>
            </span>
          </div>
          <DeadlineCard
            icon={
              <IconClock
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            }
            label="Primeira resposta até"
            value={conversation.firstResponseDueAt}
          />
          {conversation.firstRespondedAt ? (
            <DeadlineCard
              icon={
                <IconCheck
                  size={themeCssVariables.icon.size.sm}
                  stroke={themeCssVariables.icon.stroke.md}
                />
              }
              label="Primeira resposta em"
              value={conversation.firstRespondedAt}
            />
          ) : null}
          <DeadlineCard
            icon={
              <IconCalendarDue
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            }
            label="Próximo follow-up"
            value={conversation.followUpDueAt}
          />
          {conversation.snoozedUntil ? (
            <DeadlineCard
              icon={
                <IconClock
                  size={themeCssVariables.icon.size.sm}
                  stroke={themeCssVariables.icon.stroke.md}
                />
              }
              label="Adiada até"
              value={conversation.snoozedUntil}
            />
          ) : null}
          {conversation.slaBreachedAt ? (
            <DeadlineCard
              danger
              icon={
                <IconAlertTriangle
                  size={themeCssVariables.icon.size.sm}
                  stroke={themeCssVariables.icon.stroke.md}
                />
              }
              label="SLA estourado em"
              value={conversation.slaBreachedAt}
            />
          ) : null}
        </section>

        <section style={inboxStyles.contextSection}>
          <h3 style={inboxStyles.contextSectionTitle}>
            Próximas tarefas ({openTasks.length})
          </h3>
          {openTasks.length === 0 ? (
            <div style={inboxStyles.contextCard}>
              <span style={inboxStyles.contextCardIcon}>
                <IconListCheck
                  size={themeCssVariables.icon.size.sm}
                  stroke={themeCssVariables.icon.stroke.md}
                />
              </span>
              <span style={inboxStyles.contextCardBody}>
                <span style={inboxStyles.contextCardValue}>
                  Nenhuma tarefa aberta
                </span>
              </span>
            </div>
          ) : (
            openTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                style={{
                  ...inboxStyles.taskCard,
                  cursor: 'pointer',
                  fontFamily: themeCssVariables.font.family,
                  textAlign: 'left',
                  width: '100%',
                }}
                onClick={() => void openRecord(task.id, 'task')}
              >
                <IconListCheck
                  size={themeCssVariables.icon.size.sm}
                  stroke={themeCssVariables.icon.stroke.md}
                />
                <span style={inboxStyles.contextCardBody}>
                  <span
                    style={{
                      ...inboxStyles.taskTitle,
                      display: 'block',
                    }}
                  >
                    {task.title || 'Tarefa sem título'}
                  </span>
                  <span
                    style={{
                      ...inboxStyles.taskMeta,
                      display: 'block',
                    }}
                  >
                    {getTaskStatusLabel(task.status)} ·{' '}
                    {formatDateTime(task.dueAt)}
                  </span>
                </span>
                <IconChevronRight
                  size={themeCssVariables.icon.size.sm}
                  stroke={themeCssVariables.icon.stroke.md}
                />
              </button>
            ))
          )}
        </section>
      </div>
    </aside>
  );
};
