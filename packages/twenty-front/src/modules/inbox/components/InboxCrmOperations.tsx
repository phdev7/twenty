import { useEffect, useState } from 'react';
import { styled } from '@linaria/react';
import {
  IconAlertTriangle,
  IconCalendarDue,
  IconCheck,
  IconClock,
} from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import {
  InboxDeadlineCard,
  StyledCard,
  StyledCardBody,
  StyledCardIcon,
  StyledCardLabel,
} from '@/inbox/components/InboxRecordCard';
import { type InboxConversation } from '@/inbox/types/inboxEntityTypes';
import { getPriorityLabel } from '@/inbox/utils/inboxFormatters';

const StyledSection = styled.section`
  margin-bottom: ${themeCssVariables.spacing[4]};
`;

const StyledSectionTitle = styled.h3`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.08em;
  margin: 0 0 ${themeCssVariables.spacing[2]};
  text-transform: uppercase;
`;

const StyledSelect = styled.select`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.primary};
  display: block;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-top: ${themeCssVariables.spacing['0.5']};
  max-width: 100%;
  outline: none;
  padding: 0;
  width: 100%;
`;

const StyledPresetSelect = styled.select`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  display: block;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xxs};
  height: ${themeCssVariables.spacing[7]};
  margin-top: ${themeCssVariables.spacing[1]};
  max-width: 100%;
  outline: none;
  padding: 0 ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledActionRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  margin-top: ${themeCssVariables.spacing[1]};
`;

const StyledDateInput = styled.input`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xxs};
  min-width: 0;
  outline: none;
  padding: 0;
`;

type SnoozePreset = 'ONE_HOUR' | 'FOUR_HOURS' | 'TOMORROW' | 'NEXT_MONDAY';

const getSnoozedUntil = (preset: SnoozePreset): string => {
  const target = new Date();

  if (preset === 'ONE_HOUR') {
    target.setHours(target.getHours() + 1);
  } else if (preset === 'FOUR_HOURS') {
    target.setHours(target.getHours() + 4);
  } else if (preset === 'TOMORROW') {
    target.setDate(target.getDate() + 1);
    target.setHours(9, 0, 0, 0);
  } else {
    const daysUntilNextMonday = (8 - target.getDay()) % 7 || 7;

    target.setDate(target.getDate() + daysUntilNextMonday);
    target.setHours(9, 0, 0, 0);
  }

  return target.toISOString();
};

const toLocalDateTimeInputValue = (value: string): string => {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return '';
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
};

type InboxCrmOperationsProps = {
  conversation: InboxConversation;
  busyAction: string | null;
  onSnooze: (snoozedUntil: string) => void;
  onPriorityChange: (priority: string) => void;
};

export const InboxCrmOperations = ({
  conversation,
  busyAction,
  onSnooze,
  onPriorityChange,
}: InboxCrmOperationsProps) => {
  const [customSnoozeUntil, setCustomSnoozeUntil] = useState('');

  useEffect(() => {
    const defaultTarget =
      conversation.snoozedUntil ??
      new Date(Date.now() + 24 * 60 * 60_000).toISOString();

    setCustomSnoozeUntil(toLocalDateTimeInputValue(defaultTarget));
  }, [conversation.id, conversation.snoozedUntil]);

  return (
    <StyledSection>
      <StyledSectionTitle>Operação</StyledSectionTitle>
      <StyledCard>
        <StyledCardIcon>
          <IconClock
            size={themeCssVariables.icon.size.sm}
            stroke={themeCssVariables.icon.stroke.md}
          />
        </StyledCardIcon>
        <StyledCardBody>
          <StyledCardLabel>Adiar conversa até</StyledCardLabel>
          <StyledPresetSelect
            aria-label="Prazo rápido para adiar a conversa"
            disabled={busyAction !== null}
            value=""
            onChange={(event) => {
              const preset = event.target.value as SnoozePreset;

              if (preset) {
                onSnooze(getSnoozedUntil(preset));
              }
            }}
          >
            <option value="">Escolher prazo rápido...</option>
            <option value="ONE_HOUR">Por 1 hora</option>
            <option value="FOUR_HOURS">Por 4 horas</option>
            <option value="TOMORROW">Até amanhã, 9h</option>
            <option value="NEXT_MONDAY">Até segunda, 9h</option>
          </StyledPresetSelect>
          <StyledActionRow>
            <StyledDateInput
              aria-label="Data e hora para reabrir a conversa"
              type="datetime-local"
              min={toLocalDateTimeInputValue(
                new Date(Date.now() + 60_000).toISOString(),
              )}
              value={customSnoozeUntil}
              onChange={(event) => setCustomSnoozeUntil(event.target.value)}
            />
            <Button
              variant="primary"
              size="small"
              title="Adiar"
              disabled={busyAction !== null || customSnoozeUntil.length === 0}
              onClick={() => {
                const target = new Date(customSnoozeUntil);

                if (Number.isFinite(target.getTime())) {
                  onSnooze(target.toISOString());
                }
              }}
            />
          </StyledActionRow>
        </StyledCardBody>
      </StyledCard>
      <StyledCard>
        <StyledCardIcon>
          <IconAlertTriangle
            size={themeCssVariables.icon.size.sm}
            stroke={themeCssVariables.icon.stroke.md}
          />
        </StyledCardIcon>
        <StyledCardBody>
          <StyledCardLabel>Prioridade</StyledCardLabel>
          <StyledSelect
            aria-label="Prioridade da conversa"
            disabled={busyAction !== null}
            value={conversation.priority}
            onChange={(event) => onPriorityChange(event.target.value)}
          >
            <option value="LOW">{getPriorityLabel('LOW')}</option>
            <option value="NORMAL">{getPriorityLabel('NORMAL')}</option>
            <option value="HIGH">{getPriorityLabel('HIGH')}</option>
            <option value="URGENT">{getPriorityLabel('URGENT')}</option>
          </StyledSelect>
        </StyledCardBody>
      </StyledCard>
      <InboxDeadlineCard
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
        <InboxDeadlineCard
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
      <InboxDeadlineCard
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
        <InboxDeadlineCard
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
        <InboxDeadlineCard
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
    </StyledSection>
  );
};
