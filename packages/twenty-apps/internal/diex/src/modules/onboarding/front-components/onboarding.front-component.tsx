import { useEffect, useMemo } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  SidePanelPages,
  enqueueSnackbar,
  openSidePanelPage,
} from 'twenty-sdk/front-component';
import { IconCheck, IconRefresh } from 'twenty-ui/icon';

import { ONBOARDING_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/modules/onboarding/constants/onboarding.constants';
import { onboardingStyles as styles } from 'src/modules/onboarding/front-components/onboarding.styles';
import {
  type ContextField,
  type ContextFieldKey,
  type WhatsappConnection,
  type WorkspaceContextRecord,
} from 'src/modules/onboarding/front-components/onboarding.types';
import { useOnboarding } from 'src/modules/onboarding/front-components/use-onboarding';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Skeleton,
} from 'src/ui/shadcn-twenty';

const CONTEXT_FIELDS: Array<{
  key: ContextFieldKey;
  label: string;
  hint: string;
  isRequiredForActivation: boolean;
}> = [
  {
    key: 'businessDescription',
    label: 'O que a empresa faz',
    hint: 'Atividade, mercado e como gera receita.',
    isRequiredForActivation: true,
  },
  {
    key: 'idealCustomerProfile',
    label: 'Cliente ideal',
    hint: 'Porte, segmento, dor e gatilho de compra.',
    isRequiredForActivation: true,
  },
  {
    key: 'toneOfVoice',
    label: 'Tom de voz',
    hint: 'Como a empresa fala com o cliente.',
    isRequiredForActivation: true,
  },
  {
    key: 'commercialRules',
    label: 'Regras comerciais',
    hint: 'Descontos, prazos e o que exige aprovação.',
    isRequiredForActivation: false,
  },
  {
    key: 'objectionPlaybook',
    label: 'Objeções e respostas',
    hint: 'O que ouvem muito e a resposta certa.',
    isRequiredForActivation: false,
  },
  {
    key: 'competitiveLandscape',
    label: 'Concorrência',
    hint: 'Concorrentes e o posicionamento de vocês.',
    isRequiredForActivation: false,
  },
  {
    key: 'forbiddenClaims',
    label: 'O que nunca afirmar',
    hint: 'Promessas que a IA não pode fazer.',
    isRequiredForActivation: false,
  },
];

const CONTEXT_STATUS: Record<
  string,
  { label: string; tone: 'green' | 'gray' | 'orange' }
> = {
  ACTIVE: { label: 'Ativo para a IA', tone: 'green' },
  DRAFT: { label: 'Rascunho, a IA não lê', tone: 'orange' },
  ARCHIVED: { label: 'Arquivado', tone: 'gray' },
};

const CONNECTION_TONE: Record<
  WhatsappConnection['state'],
  { label: string; tone: 'green' | 'blue' | 'orange' | 'red' | 'gray' }
> = {
  CONNECTED: { label: 'Conectado', tone: 'green' },
  AWAITING_SCAN: { label: 'Aguardando leitura', tone: 'blue' },
  CONNECTING: { label: 'Conectando', tone: 'blue' },
  NOT_PROVISIONED: { label: 'Não configurado', tone: 'gray' },
  UNAVAILABLE: { label: 'Indisponível', tone: 'red' },
};

const isFieldFilled = (
  record: WorkspaceContextRecord | null,
  key: ContextFieldKey,
): boolean => (record?.[key]?.markdown ?? '').trim().length > 0;

const StepMarker = ({
  index,
  isDone,
}: {
  index: number;
  isDone: boolean;
}) => (
  <div
    style={{
      ...styles.stepMarker,
      ...(isDone ? styles.stepMarkerDone : styles.stepMarkerPending),
    }}
  >
    {isDone ? <IconCheck size={14} /> : index}
  </div>
);

export const OnboardingFrontComponent = () => {
  const {
    workspaceContext,
    dataFlow,
    connection,
    isLoading,
    isConnecting,
    isCreatingContext,
    isActivatingContext,
    errorMessage,
    load,
    requestConnection,
    createWorkspaceContext,
    activateWorkspaceContext,
  } = useOnboarding();

  // Asking the connection route on open is what makes the QR appear without a
  // click; the route is idempotent and provisions the instance if missing.
  useEffect(() => {
    void requestConnection();
  }, [requestConnection]);

  const contextFields: ContextField[] = useMemo(
    () =>
      CONTEXT_FIELDS.map((field) => ({
        ...field,
        isFilled: isFieldFilled(workspaceContext, field.key),
      })),
    [workspaceContext],
  );

  const filledCount = contextFields.filter(({ isFilled }) => isFilled).length;
  const canActivateContext = contextFields
    .filter(({ isRequiredForActivation }) => isRequiredForActivation)
    .every(({ isFilled }) => isFilled);
  const isWhatsappDone = connection?.state === 'CONNECTED';
  const isContextDone = workspaceContext?.status === 'ACTIVE';
  const isDataFlowing = dataFlow.messageCount > 0;
  const doneCount = [isWhatsappDone, isContextDone, isDataFlowing].filter(
    Boolean,
  ).length;

  const openContextRecord = async () => {
    if (!workspaceContext) {
      return;
    }

    try {
      await openSidePanelPage({
        page: SidePanelPages.ViewRecord,
        recordId: workspaceContext.id,
        objectNameSingular: 'diexWorkspaceContext',
      });
    } catch {
      await enqueueSnackbar({
        message: 'Não foi possível abrir o contexto comercial.',
        variant: 'error',
      });
    }
  };

  return (
    <div style={styles.root}>
      <section style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Primeiros passos</h1>
          <p style={styles.headerSubtitle}>
            Três coisas separam este workspace de um CRM que trabalha sozinho:
            o número de WhatsApp conectado, o contexto que a IA usa para falar
            como a sua empresa, e a primeira conversa entrando.
          </p>
          <div style={styles.progressLine}>
            {doneCount} de 3 concluídos
          </div>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          <IconRefresh size={14} /> Atualizar
        </Button>
      </section>

      {errorMessage ? <div style={styles.error}>{errorMessage}</div> : null}

      <div style={styles.steps}>
        <Card>
          <CardContent style={styles.step}>
            <StepMarker index={1} isDone={isWhatsappDone} />
            <div style={styles.stepBody}>
              <div style={styles.stepHeadline}>
                <h2 style={styles.stepTitle}>Conectar o WhatsApp</h2>
                {connection ? (
                  <Badge tone={CONNECTION_TONE[connection.state].tone}>
                    {CONNECTION_TONE[connection.state].label}
                  </Badge>
                ) : null}
              </div>
              <p style={styles.stepText}>
                {connection?.message ??
                  'Preparando a instância deste workspace.'}
              </p>

              {connection?.qrCodeDataUri ? (
                <div style={styles.qrPanel}>
                  <img
                    src={connection.qrCodeDataUri}
                    alt="QR Code para conectar o WhatsApp"
                    style={styles.qrImage}
                  />
                  <p style={styles.qrCaption}>
                    WhatsApp → Aparelhos conectados → Conectar aparelho
                  </p>
                </div>
              ) : null}

              {isWhatsappDone && connection?.phone ? (
                <p style={styles.stepText}>Número conectado: {connection.phone}</p>
              ) : null}

              <div style={styles.stepActions}>
                <Button
                  onClick={() => void requestConnection()}
                  disabled={isConnecting}
                >
                  {isConnecting
                    ? 'Falando com a Evolution...'
                    : isWhatsappDone
                      ? 'Verificar de novo'
                      : 'Gerar QR Code'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={styles.step}>
            <StepMarker index={2} isDone={isContextDone} />
            <div style={styles.stepBody}>
              <div style={styles.stepHeadline}>
                <h2 style={styles.stepTitle}>
                  Descrever a empresa para a IA
                </h2>
                <div style={styles.stepActions}>
                  <Badge tone="gray">
                    {filledCount} de {CONTEXT_FIELDS.length} campos
                  </Badge>
                  {workspaceContext ? (
                    <Badge
                      tone={
                        CONTEXT_STATUS[workspaceContext.status ?? 'DRAFT']
                          ?.tone ?? 'gray'
                      }
                    >
                      {CONTEXT_STATUS[workspaceContext.status ?? 'DRAFT']
                        ?.label ?? 'Sem status'}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <p style={styles.stepText}>
                Sem isto a IA escreve genérico e não sabe o que sua empresa não
                pode prometer. Preencha os três campos marcados, ative, e o
                contexto passa a valer em toda triagem, rascunho e análise.
              </p>

              {isLoading ? (
                <Skeleton style={{ height: '72px' }} />
              ) : workspaceContext ? (
                <>
                  <div style={styles.fieldGrid}>
                    {contextFields.map(
                      ({
                        key,
                        label,
                        hint,
                        isFilled,
                        isRequiredForActivation,
                      }) => (
                        <div key={key} style={styles.field}>
                          <div>
                            <div style={styles.fieldLabel}>
                              {label}
                              {isRequiredForActivation ? ' *' : ''}
                            </div>
                            <div style={styles.metricLabel}>{hint}</div>
                          </div>
                          <Badge tone={isFilled ? 'green' : 'gray'}>
                            {isFilled ? 'ok' : 'vazio'}
                          </Badge>
                        </div>
                      ),
                    )}
                  </div>
                  <div style={styles.stepActions}>
                    <Button
                      variant={isContextDone ? 'outline' : 'default'}
                      onClick={() => void openContextRecord()}
                    >
                      Abrir e preencher
                    </Button>
                    {isContextDone ? null : (
                      <Button
                        onClick={() => void activateWorkspaceContext()}
                        disabled={!canActivateContext || isActivatingContext}
                      >
                        {isActivatingContext
                          ? 'Ativando...'
                          : 'Ativar para a IA'}
                      </Button>
                    )}
                  </div>
                  {isContextDone || canActivateContext ? null : (
                    <p style={styles.hint}>
                      Preencha os três campos marcados com * para poder ativar.
                    </p>
                  )}
                </>
              ) : (
                <div style={styles.stepActions}>
                  <Button
                    onClick={() => void createWorkspaceContext()}
                    disabled={isCreatingContext}
                  >
                    {isCreatingContext ? 'Criando...' : 'Criar contexto'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={styles.step}>
            <StepMarker index={3} isDone={isDataFlowing} />
            <div style={styles.stepBody}>
              <div style={styles.stepHeadline}>
                <h2 style={styles.stepTitle}>Ver a primeira conversa entrar</h2>
                <Badge tone={isDataFlowing ? 'green' : 'gray'}>
                  {isDataFlowing ? 'Recebendo' : 'Sem tráfego'}
                </Badge>
              </div>
              <p style={styles.stepText}>
                {isDataFlowing
                  ? 'As mensagens estão chegando e virando contato e histórico sozinhas.'
                  : 'Depois de conectar, mande uma mensagem de outro celular para o número comercial. Ela deve aparecer aqui em segundos.'}
              </p>
              <div style={styles.metrics}>
                <div style={styles.metric}>
                  <div style={styles.metricValue}>
                    {dataFlow.conversationCount}
                  </div>
                  <div style={styles.metricLabel}>Conversas</div>
                </div>
                <div style={styles.metric}>
                  <div style={styles.metricValue}>{dataFlow.messageCount}</div>
                  <div style={styles.metricLabel}>Mensagens</div>
                </div>
                <div style={styles.metric}>
                  <div style={styles.metricValue}>{dataFlow.peopleCount}</div>
                  <div style={styles.metricLabel}>Contatos</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: ONBOARDING_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'diex-onboarding',
  description:
    'Primeiros passos de um workspace novo: conectar o WhatsApp, preencher o contexto comercial e confirmar que as mensagens estão entrando.',
  component: OnboardingFrontComponent,
});
