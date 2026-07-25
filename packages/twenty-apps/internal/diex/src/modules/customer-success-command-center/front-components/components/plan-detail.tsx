import {
  IconCheck,
  IconExternalLink,
  IconRobot,
  IconTarget,
  IconUsers,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { MilestoneBoard } from 'src/modules/customer-success-command-center/front-components/components/milestone-board';
import { customerSuccessCommandCenterStyles as styles } from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.styles';
import {
  type CustomerSuccessMilestone,
  type CustomerSuccessMilestoneActionDraft,
  type CustomerSuccessMilestoneActionPreviewResult,
  type CustomerSuccessPlan,
  type CustomerSuccessReviewResult,
} from 'src/modules/customer-success-command-center/front-components/customer-success-command-center.types';
import {
  formatDate,
  formatPlanMoney,
  getDatePressureLabel,
  getHealthLabel,
  getHealthTone,
  getLifecycleLabel,
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
  Progress,
} from 'src/ui/shadcn-twenty';

type PlanDetailProps = {
  selectedPlan: CustomerSuccessPlan | null;
  selectedReview: CustomerSuccessReviewResult | undefined;
  selectedMilestones: CustomerSuccessMilestone[];
  selectedMilestone: CustomerSuccessMilestone | null;
  milestoneActionDraft: CustomerSuccessMilestoneActionDraft;
  milestoneActionPreview: CustomerSuccessMilestoneActionPreviewResult | null;
  busyMilestoneAction: {
    milestoneId: string;
    mode: 'PREVIEW' | 'APPLY';
  } | null;
  busyReview: { planId: string; mode: 'PREVIEW' | 'APPLY' } | null;
  onSelectMilestone: (milestoneId: string) => void;
  onMilestoneDraftChange: (
    patch: Partial<CustomerSuccessMilestoneActionDraft>,
  ) => void;
  onMilestonePreview: (
    milestoneId: string,
    draft: CustomerSuccessMilestoneActionDraft,
  ) => Promise<boolean>;
  onMilestoneConfirm: (
    milestoneId: string,
    draft: CustomerSuccessMilestoneActionDraft,
    confirmationToken: string,
  ) => Promise<boolean>;
  onReviewPlan: (
    successPlanId: string,
    mode: 'PREVIEW' | 'APPLY',
  ) => Promise<CustomerSuccessReviewResult | null>;
  isLoading: boolean;
};

export const PlanDetail = ({
  selectedPlan,
  selectedReview,
  selectedMilestones,
  selectedMilestone,
  milestoneActionDraft,
  milestoneActionPreview,
  busyMilestoneAction,
  busyReview,
  onSelectMilestone: setSelectedMilestoneId,
  onMilestoneDraftChange: updateMilestoneActionDraft,
  onMilestonePreview: previewMilestoneAction,
  onMilestoneConfirm: confirmMilestoneAction,
  onReviewPlan: reviewPlan,
  isLoading,
}: PlanDetailProps) => (
  <Card style={styles.detailCard}>
    {selectedPlan === null ? (
      <div style={styles.empty}>
        Selecione um plano para abrir a operação de Customer Success.
      </div>
    ) : (
      <>
        <CardHeader style={styles.detailHeader}>
          <div style={styles.planTop}>
            <div>
              <div style={styles.filterRow}>
                <Badge tone={getHealthTone(selectedPlan.health)}>
                  {getHealthLabel(selectedPlan.health)}
                </Badge>
                <Badge tone="blue">
                  {getLifecycleLabel(selectedPlan.lifecycle)}
                </Badge>
                {selectedPlan.expansionSignal ? (
                  <Badge tone="turquoise">Expansão validada</Badge>
                ) : null}
              </div>
              <CardTitle
                style={{
                  fontSize: themeCssVariables.font.size.lg,
                  marginTop: themeCssVariables.spacing[2],
                }}
              >
                {selectedPlan.name}
              </CardTitle>
              <CardDescription>
                {getRecordName(selectedPlan.company) ||
                  'Empresa não vinculada'}
              </CardDescription>
            </div>
            <div style={styles.filterRow}>
              {selectedPlan.opportunity ? (
                <Button
                  variant="ghost"
                  onClick={() =>
                    void openRecord(
                      selectedPlan.opportunity?.id as string,
                      'opportunity',
                    )
                  }
                >
                  <IconTarget
                    size={themeCssVariables.icon.size.sm}
                    stroke={themeCssVariables.icon.stroke.md}
                  />
                  Venda de origem
                </Button>
              ) : null}
              <Button
                variant="outline"
                onClick={() =>
                  void openRecord(selectedPlan.id, 'successPlan')
                }
              >
                <IconExternalLink
                  size={themeCssVariables.icon.size.sm}
                  stroke={themeCssVariables.icon.stroke.md}
                />
                Abrir plano
              </Button>
            </div>
          </div>
        </CardHeader>

        <div style={styles.detailBody}>
          <div style={styles.detailColumn}>
            <div style={styles.factGrid}>
              <div style={styles.fact}>
                <p style={styles.metricLabel}>Receita recorrente</p>
                <p style={styles.factValue}>
                  {formatPlanMoney(selectedPlan.recurringRevenue, false)}
                </p>
              </div>
              <div style={styles.fact}>
                <p style={styles.metricLabel}>Renovação</p>
                <p style={styles.factValue}>
                  {formatDate(selectedPlan.renewalDate)} ·{' '}
                  {getDatePressureLabel(selectedPlan.renewalDate)}
                </p>
              </div>
              <div style={styles.fact}>
                <p style={styles.metricLabel}>Responsável de CS</p>
                <p style={styles.factValue}>
                  {getRecordName(selectedPlan.owner) || 'Não definido'}
                </p>
              </div>
              <div style={styles.fact}>
                <p style={styles.metricLabel}>Próxima revisão</p>
                <p style={styles.factValue}>
                  {formatDate(selectedPlan.nextReviewAt)} ·{' '}
                  {getDatePressureLabel(selectedPlan.nextReviewAt)}
                </p>
              </div>
            </div>

            <Card variant="muted">
              <CardHeader>
                <CardTitle>Valor reconhecido e riscos</CardTitle>
              </CardHeader>
              <CardContent>
                <p style={styles.narrative}>
                  {selectedPlan.executiveSummary?.markdown ||
                    selectedPlan.objectives?.markdown ||
                    'O resumo executivo ainda não foi construído. Rode a prévia de IA para consolidar os fatos do plano, marcos, sinais e conversas.'}
                </p>
                {selectedPlan.risks?.markdown ? (
                  <div
                    style={{
                      ...styles.reviewBlock,
                      borderLeftColor:
                        themeCssVariables.border.color.danger,
                      marginTop: themeCssVariables.spacing[3],
                    }}
                  >
                    <p style={styles.metricLabel}>Riscos registrados</p>
                    <p style={styles.narrative}>
                      {selectedPlan.risks.markdown}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <MilestoneBoard
              milestones={selectedMilestones}
              selectedMilestone={selectedMilestone}
              milestoneActionDraft={milestoneActionDraft}
              milestoneActionPreview={milestoneActionPreview}
              busyMilestoneAction={busyMilestoneAction}
              onSelectMilestone={setSelectedMilestoneId}
              onDraftChange={updateMilestoneActionDraft}
              onPreview={previewMilestoneAction}
              onConfirm={confirmMilestoneAction}
            />
          </div>

          <aside style={styles.detailColumn}>
            <Card
              variant={
                selectedPlan.health === 'CRITICAL' ? 'danger' : 'accent'
              }
            >
              <CardHeader>
                <div style={styles.planTop}>
                  <div>
                    <CardTitle>Revisão inteligente de CS</CardTitle>
                    <CardDescription>
                      Usa plano, marcos, sinais e conversas do cliente.
                    </CardDescription>
                  </div>
                  <IconRobot
                    size={themeCssVariables.icon.size.md}
                    stroke={themeCssVariables.icon.stroke.md}
                  />
                </div>
              </CardHeader>
              <CardContent style={styles.reviewCard}>
                {selectedReview ? (
                  <>
                    <div style={styles.planTop}>
                      <Badge
                        tone={getHealthTone(selectedReview.health.health)}
                      >
                        {getHealthLabel(selectedReview.health.health)} ·{' '}
                        {selectedReview.health.score}/100
                      </Badge>
                      <Badge tone="blue">
                        {Math.round(selectedReview.confidence)}% confiança
                      </Badge>
                    </div>
                    <div style={styles.reviewBlock}>
                      <p style={styles.metricLabel}>Síntese</p>
                      <p style={styles.narrative}>
                        {selectedReview.summary}
                      </p>
                    </div>
                    <div style={styles.reviewBlock}>
                      <p style={styles.metricLabel}>
                        Intervenção recomendada
                      </p>
                      <p style={styles.narrative}>
                        {selectedReview.intervention}
                      </p>
                    </div>
                    {selectedReview.gaps ? (
                      <div style={styles.reviewBlock}>
                        <p style={styles.metricLabel}>Lacunas</p>
                        <p style={styles.narrative}>
                          {selectedReview.gaps}
                        </p>
                      </div>
                    ) : null}
                    {selectedReview.mode === 'APPLY' ? (
                      <Card
                        variant={
                          selectedReview.successPlanUpdated
                            ? 'muted'
                            : 'danger'
                        }
                      >
                        <CardContent
                          style={{
                            paddingTop: themeCssVariables.spacing[3],
                          }}
                        >
                          <p style={styles.narrative}>
                            {selectedReview.successPlanUpdated
                              ? 'Saúde, resumo executivo e próxima revisão foram atualizados.'
                              : 'A revisão foi concluída, mas o plano não confirmou a atualização.'}
                          </p>
                          {selectedReview.aiActionId ? (
                            <Button
                              variant="ghost"
                              style={{
                                marginTop: themeCssVariables.spacing[2],
                              }}
                              onClick={() =>
                                void openRecord(
                                  selectedReview.aiActionId as string,
                                  'aiAction',
                                )
                              }
                            >
                              <IconExternalLink
                                size={themeCssVariables.icon.size.sm}
                                stroke={themeCssVariables.icon.stroke.md}
                              />
                              Abrir proposta governada
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    ) : null}
                  </>
                ) : (
                  <p style={styles.narrative}>
                    A prévia é somente leitura. Ela não altera a saúde,
                    não cria tarefa e não envia mensagem.
                  </p>
                )}

                <div style={styles.reviewActions}>
                  <Button
                    variant="outline"
                    disabled={
                      busyReview?.planId === selectedPlan.id || isLoading
                    }
                    onClick={() =>
                      void reviewPlan(selectedPlan.id, 'PREVIEW')
                    }
                  >
                    <IconTarget
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />
                    {busyReview?.planId === selectedPlan.id &&
                    busyReview.mode === 'PREVIEW'
                      ? 'Analisando'
                      : 'Gerar prévia'}
                  </Button>
                  {selectedReview &&
                  (selectedReview.mode !== 'APPLY' ||
                    !selectedReview.successPlanUpdated) ? (
                    <Button
                      disabled={
                        busyReview?.planId === selectedPlan.id ||
                        isLoading
                      }
                      onClick={() =>
                        void reviewPlan(selectedPlan.id, 'APPLY')
                      }
                    >
                      <IconCheck
                        size={themeCssVariables.icon.size.sm}
                        stroke={themeCssVariables.icon.stroke.md}
                      />
                      {busyReview?.planId === selectedPlan.id &&
                      busyReview.mode === 'APPLY'
                        ? 'Aplicando'
                        : 'Aplicar revisão e governar ação'}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card variant="muted">
              <CardHeader>
                <CardTitle>Prontidão do plano</CardTitle>
                <CardDescription>
                  Dados que sustentam retenção e expansão.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {[
                  [
                    'Adoção ativa',
                    selectedPlan.activeUseRating
                      ? selectedPlan.activeUseRating.replace(
                          'RATING_',
                          '',
                        )
                      : '0',
                  ],
                  [
                    'Evidência de valor',
                    selectedPlan.valueEvidenceRating
                      ? selectedPlan.valueEvidenceRating.replace(
                          'RATING_',
                          '',
                        )
                      : '0',
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      marginBottom: themeCssVariables.spacing[3],
                    }}
                  >
                    <div style={styles.planTop}>
                      <p style={styles.metricLabel}>{label}</p>
                      <span style={styles.smallMuted}>{value}/5</span>
                    </div>
                    <Progress
                      value={Number(value) * 20}
                      tone={Number(value) >= 4 ? 'green' : 'orange'}
                    />
                  </div>
                ))}
                <div style={styles.planMeta}>
                  <span>
                    <IconUsers
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />{' '}
                    {getRecordName(selectedPlan.primaryContact) ||
                      'contato principal ausente'}
                  </span>
                  <span>
                    {
                      selectedPlan.aiActions.filter(
                        ({ status }) =>
                          status === 'PENDING_APPROVAL' ||
                          status === 'APPROVED',
                      ).length
                    }{' '}
                    ações abertas
                  </span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </>
    )}
  </Card>
);
