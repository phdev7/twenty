import {
  IconCheck,
  IconExternalLink,
  IconTarget,
  IconUsers,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { customerSuccessCommandCenterStyles as styles } from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.styles';
import {
  type CustomerSuccessHandoffDraft,
  type CustomerSuccessHandoffOpportunity,
  type CustomerSuccessHandoffPreviewResult,
  type CustomerSuccessWorkspaceMember,
} from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.types';
import {
  formatDate,
  formatMoney,
  formatPlanMoney,
  getRecordName,
  openRecord,
} from 'src/modules/customer-success-command-center/front-components/utils/customer-success-formatters';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/ui/shadcn-twenty';

type HandoffPanelProps = {
  opportunities: CustomerSuccessHandoffOpportunity[];
  selectedOpportunity: CustomerSuccessHandoffOpportunity | null;
  draft: CustomerSuccessHandoffDraft | null;
  preview: CustomerSuccessHandoffPreviewResult | null;
  workspaceMembers: CustomerSuccessWorkspaceMember[];
  busyHandoff: {
    opportunityId: string;
    mode: 'PREVIEW' | 'APPLY';
  } | null;
  onSelectOpportunity: (opportunityId: string) => void;
  onDraftChange: (patch: Partial<CustomerSuccessHandoffDraft>) => void;
  onPreview: (
    opportunityId: string,
    draft: CustomerSuccessHandoffDraft,
  ) => Promise<boolean>;
  onConfirm: (
    opportunityId: string,
    draft: CustomerSuccessHandoffDraft,
    confirmationToken: string,
  ) => Promise<string | null>;
};

export const HandoffPanel = ({
  opportunities: handoffOpportunities,
  selectedOpportunity: selectedHandoffOpportunity,
  draft: handoffDraft,
  preview: handoffPreview,
  workspaceMembers,
  busyHandoff,
  onSelectOpportunity: setSelectedHandoffOpportunityId,
  onDraftChange: updateHandoffDraft,
  onPreview: previewHandoff,
  onConfirm: confirmHandoff,
}: HandoffPanelProps) => (
  <Card style={styles.handoffCard}>
    <CardHeader style={styles.handoffHeader}>
      <div style={styles.sectionHeading}>
        <div>
          <CardTitle>Entrada de novos clientes</CardTitle>
          <CardDescription>
            Converta negócios ganhos em operação de CS com origem,
            responsável, receita, renovação, marcos e kickoff.
          </CardDescription>
        </div>
        <Badge tone={handoffOpportunities.length > 0 ? 'orange' : 'green'}>
          {handoffOpportunities.length} aguardando handoff
        </Badge>
      </div>
    </CardHeader>
    {handoffOpportunities.length === 0 ? (
      <div style={{ ...styles.empty, minHeight: 92 }}>
        Nenhuma oportunidade em Fechado ganho está sem plano de sucesso.
      </div>
    ) : (
      <CardContent style={styles.handoffGrid}>
        <div style={styles.handoffQueue}>
          <p style={styles.metricLabel}>Negócios ganhos</p>
          <div style={styles.handoffQueueList}>
            {handoffOpportunities.map((opportunity) => (
              <button
                key={opportunity.id}
                type="button"
                style={{
                  ...styles.handoffOpportunity,
                  ...(selectedHandoffOpportunity?.id === opportunity.id
                    ? styles.handoffOpportunitySelected
                    : {}),
                }}
                onClick={() =>
                  setSelectedHandoffOpportunityId(opportunity.id)
                }
              >
                <span style={styles.planName}>
                  {opportunity.name || 'Oportunidade sem nome'}
                </span>
                <span style={styles.smallMuted}>
                  {getRecordName(opportunity.company) ||
                    'Empresa não vinculada'}
                </span>
                <span style={styles.planMeta}>
                  <span>{formatPlanMoney(opportunity.amount, false)}</span>
                  {!opportunity.company?.id ? (
                    <Badge tone="red">sem empresa</Badge>
                  ) : !opportunity.pointOfContact?.id ? (
                    <Badge tone="orange">sem contato</Badge>
                  ) : (
                    <Badge tone="green">pronto</Badge>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedHandoffOpportunity && handoffDraft ? (
          <div style={styles.handoffForm}>
            <div style={styles.planTop}>
              <div>
                <p style={styles.metricLabel}>Configuração do contrato</p>
                <p style={styles.planName}>
                  {selectedHandoffOpportunity.name ||
                    'Oportunidade sem nome'}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() =>
                  void openRecord(
                    selectedHandoffOpportunity.id,
                    'opportunity',
                  )
                }
              >
                <IconExternalLink
                  size={themeCssVariables.icon.size.sm}
                  stroke={themeCssVariables.icon.stroke.md}
                />
                Venda
              </Button>
            </div>

            <label style={styles.handoffField}>
              <span style={styles.metricLabel}>Responsável de CS</span>
              <select
                aria-label="Responsável de Customer Success"
                value={handoffDraft.ownerId}
                style={styles.handoffInput}
                onChange={(event) =>
                  updateHandoffDraft({ ownerId: event.target.value })
                }
              >
                <option value="">Selecione um responsável</option>
                {[...workspaceMembers]
                  .sort((left, right) =>
                    getRecordName(left).localeCompare(
                      getRecordName(right),
                      'pt-BR',
                    ),
                  )
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {getRecordName(member) || member.id}
                    </option>
                  ))}
              </select>
            </label>

            <div style={styles.handoffFieldGrid}>
              <label style={styles.handoffField}>
                <span style={styles.metricLabel}>Renovação</span>
                <input
                  aria-label="Data de renovação"
                  type="date"
                  value={handoffDraft.renewalDate}
                  style={styles.handoffInput}
                  onChange={(event) =>
                    updateHandoffDraft({
                      renewalDate: event.target.value,
                    })
                  }
                />
              </label>
              <label style={styles.handoffField}>
                <span style={styles.metricLabel}>Moeda</span>
                <input
                  aria-label="Moeda da receita recorrente"
                  type="text"
                  maxLength={3}
                  value={handoffDraft.currencyCode}
                  style={styles.handoffInput}
                  onChange={(event) =>
                    updateHandoffDraft({
                      currencyCode: event.target.value.toUpperCase(),
                    })
                  }
                />
              </label>
              <label
                style={{
                  ...styles.handoffField,
                  gridColumn: '1 / -1',
                }}
              >
                <span style={styles.metricLabel}>Receita recorrente</span>
                <input
                  aria-label="Receita recorrente"
                  type="number"
                  min={0}
                  step="0.01"
                  value={handoffDraft.recurringRevenueMicros / 1_000_000}
                  style={styles.handoffInput}
                  onChange={(event) =>
                    updateHandoffDraft({
                      recurringRevenueMicros: Math.max(
                        0,
                        Math.round(
                          (Number(event.target.value) || 0) * 1_000_000,
                        ),
                      ),
                    })
                  }
                />
              </label>
            </div>

            <label style={styles.handoffField}>
              <span style={styles.metricLabel}>Objetivos do cliente</span>
              <textarea
                aria-label="Objetivos do cliente"
                value={handoffDraft.objectives}
                style={styles.handoffTextarea}
                onChange={(event) =>
                  updateHandoffDraft({ objectives: event.target.value })
                }
              />
            </label>
            <label style={styles.handoffField}>
              <span style={styles.metricLabel}>Critérios de sucesso</span>
              <textarea
                aria-label="Critérios de sucesso"
                value={handoffDraft.successCriteria}
                style={styles.handoffTextarea}
                onChange={(event) =>
                  updateHandoffDraft({
                    successCriteria: event.target.value,
                  })
                }
              />
            </label>

            <Button
              variant={handoffPreview === null ? 'default' : 'outline'}
              disabled={
                busyHandoff?.opportunityId === selectedHandoffOpportunity.id
              }
              onClick={() =>
                void previewHandoff(
                  selectedHandoffOpportunity.id,
                  handoffDraft,
                )
              }
            >
              <IconTarget
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
              {handoffPreview === null
                ? 'Gerar prévia do handoff'
                : 'Atualizar prévia'}
            </Button>
          </div>
        ) : null}

        <div style={styles.handoffPreview}>
          <p style={styles.metricLabel}>Prévia operacional</p>
          {handoffPreview?.supported === false ? (
            <Card variant="danger">
              <CardContent
                style={{ paddingTop: themeCssVariables.spacing[3] }}
              >
                <p style={styles.narrative}>
                  {handoffPreview.blockedReason}
                </p>
                {handoffPreview.existingPlanId ? (
                  <Button
                    variant="ghost"
                    style={{ marginTop: themeCssVariables.spacing[2] }}
                    onClick={() =>
                      void openRecord(
                        handoffPreview.existingPlanId as string,
                        'successPlan',
                      )
                    }
                  >
                    Abrir plano existente
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : handoffPreview?.supported === true ? (
            <>
              <div style={styles.handoffPlanSummary}>
                <div>
                  <p style={styles.planName}>
                    {handoffPreview.preview.plan.name}
                  </p>
                  <p style={styles.smallMuted}>
                    {formatMoney(
                      handoffPreview.preview.plan.recurringRevenueMicros /
                        1_000_000,
                      handoffPreview.preview.plan.currencyCode,
                      false,
                    )}{' '}
                    · renovação{' '}
                    {formatDate(handoffPreview.preview.plan.renewalDate)}
                  </p>
                </div>
                <Badge tone="blue">5 marcos</Badge>
              </div>
              <div style={styles.handoffMilestones}>
                {handoffPreview.preview.milestones.map(
                  (milestone, index) => (
                    <div key={milestone.id} style={styles.handoffMilestone}>
                      <span style={styles.handoffMilestoneIndex}>
                        {index + 1}
                      </span>
                      <span>
                        <strong>{milestone.name}</strong>
                        <br />
                        <span style={styles.smallMuted}>
                          {formatDate(milestone.dueAt)}
                        </span>
                      </span>
                    </div>
                  ),
                )}
              </div>
              <div style={styles.handoffTask}>
                <IconCheck
                  size={themeCssVariables.icon.size.sm}
                  stroke={themeCssVariables.icon.stroke.md}
                />
                <span>
                  <strong>{handoffPreview.preview.task.title}</strong>
                  <br />
                  <span style={styles.smallMuted}>
                    tarefa até{' '}
                    {formatDate(handoffPreview.preview.task.dueAt)}
                  </span>
                </span>
              </div>
              {handoffPreview.preview.warnings.map((warning) => (
                <p key={warning} style={styles.handoffWarning}>
                  {warning}
                </p>
              ))}
              <p style={styles.smallMuted}>
                Confirmação válida até{' '}
                {new Date(handoffPreview.expiresAt).toLocaleTimeString(
                  'pt-BR',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )}
                . Nenhuma mensagem será enviada.
              </p>
              <Button
                disabled={
                  !handoffDraft ||
                  busyHandoff?.opportunityId ===
                    handoffPreview.opportunityId
                }
                onClick={() => {
                  if (!handoffDraft) {
                    return;
                  }

                  void confirmHandoff(
                    handoffPreview.opportunityId,
                    handoffDraft,
                    handoffPreview.confirmationToken,
                  ).then((successPlanId) => {
                    if (successPlanId) {
                      void openRecord(successPlanId, 'successPlan');
                    }
                  });
                }}
              >
                <IconCheck
                  size={themeCssVariables.icon.size.sm}
                  stroke={themeCssVariables.icon.stroke.md}
                />
                Confirmar entrada no CS
              </Button>
            </>
          ) : (
            <div style={styles.handoffGuardrail}>
              <IconUsers
                size={themeCssVariables.icon.size.lg}
                stroke={themeCssVariables.icon.stroke.md}
              />
              <p style={styles.narrative}>
                A prévia não cria registros. A confirmação gera um plano,
                cinco marcos e uma tarefa de kickoff vinculada ao CRM.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    )}
  </Card>
);
