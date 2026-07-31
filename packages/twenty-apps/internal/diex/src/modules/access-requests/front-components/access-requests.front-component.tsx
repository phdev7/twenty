import { useEffect, useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { IconRefresh } from 'twenty-ui/icon';

import { ACCESS_REQUESTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/modules/access-requests/constants/access-request.constants';
import { accessRequestsStyles as styles } from 'src/modules/access-requests/front-components/access-requests.styles';
import { type AccessRequestRecord } from 'src/modules/access-requests/front-components/access-requests.types';
import { useAccessRequests } from 'src/modules/access-requests/front-components/use-access-requests';
import { AccessRequestStatus } from 'src/modules/access-requests/objects/access-request.object';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Skeleton,
} from 'src/ui/shadcn-twenty';

const STATUS_LABEL: Record<
  string,
  { label: string; tone: 'blue' | 'green' | 'gray' | 'yellow' | 'turquoise' }
> = {
  NEW: { label: 'Nova', tone: 'blue' },
  CONTACTED: { label: 'Contatada', tone: 'turquoise' },
  NEGOTIATING: { label: 'Em negociação', tone: 'yellow' },
  APPROVED: { label: 'Aprovada', tone: 'green' },
  REJECTED: { label: 'Recusada', tone: 'gray' },
};

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
};

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div style={styles.detailLabel}>{label}</div>
    <div style={styles.detailValue}>{value}</div>
  </div>
);

export const AccessRequestsFrontComponent = () => {
  const {
    requests,
    isLoading,
    busyRequestId,
    errorMessage,
    outcomes,
    load,
    setStatus,
    approve,
  } = useAccessRequests();
  const [subdomainDrafts, setSubdomainDrafts] = useState<
    Record<string, string>
  >({});

  // The suggestion follows what the lead asked for, falling back to their
  // company name, but stays editable: the operator is the one who decides the
  // address a customer keeps forever.
  useEffect(() => {
    setSubdomainDrafts((current) => {
      const next = { ...current };

      requests.forEach((request) => {
        if (next[request.id] === undefined) {
          next[request.id] =
            request.desiredSubdomain ?? slugify(request.name ?? '');
        }
      });

      return next;
    });
  }, [requests]);

  const pendingCount = useMemo(
    () =>
      requests.filter(
        ({ status }) =>
          status !== AccessRequestStatus.APPROVED &&
          status !== AccessRequestStatus.REJECTED,
      ).length,
    [requests],
  );

  const renderRequest = (request: AccessRequestRecord) => {
    const isBusy = busyRequestId === request.id;
    const isDecided =
      request.status === AccessRequestStatus.APPROVED ||
      request.status === AccessRequestStatus.REJECTED;
    const status = STATUS_LABEL[request.status ?? 'NEW'] ?? STATUS_LABEL.NEW;
    const outcome = outcomes[request.id];

    return (
      <Card key={request.id}>
        <CardContent style={styles.card}>
          <div style={styles.cardHead}>
            <h2 style={styles.company}>{request.name ?? 'Sem nome'}</h2>
            <div style={styles.actions}>
              {(request.submissionCount ?? 1) > 1 ? (
                <Badge tone="gray">{request.submissionCount} envios</Badge>
              ) : null}
              <Badge tone={status.tone}>{status.label}</Badge>
              <span style={styles.meta}>
                {formatDateTime(request.requestedAt)}
              </span>
            </div>
          </div>

          <div style={styles.detailGrid}>
            <Detail label="WhatsApp" value={request.whatsapp ?? '—'} />
            <Detail label="E-mail" value={request.email ?? '—'} />
            <Detail label="Quem pediu" value={request.contactName ?? '—'} />
            <Detail label="Time comercial" value={request.teamSize ?? '—'} />
          </div>

          {request.goal ? <p style={styles.goal}>{request.goal}</p> : null}

          {request.provisionedSubdomain ? (
            <div style={styles.outcome}>
              Workspace entregue em {request.provisionedSubdomain}
              .crm.bydiex.com
              {outcome && !outcome.wasInvitationSent
                ? ` — ${outcome.invitationMessage}`
                : ''}
            </div>
          ) : null}

          {outcome && !outcome.wasInvitationSent && !request.provisionedSubdomain ? (
            <div style={styles.warning}>{outcome.invitationMessage}</div>
          ) : null}

          {isDecided ? null : (
            <div style={styles.actions}>
              <div style={styles.subdomainField}>
                <input
                  style={styles.input}
                  value={subdomainDrafts[request.id] ?? ''}
                  placeholder="endereco"
                  onChange={(event) =>
                    setSubdomainDrafts((current) => ({
                      ...current,
                      [request.id]: event.target.value,
                    }))
                  }
                />
                <span style={styles.suffix}>.crm.bydiex.com</span>
              </div>
              <Button
                onClick={() =>
                  void approve(request, subdomainDrafts[request.id] ?? '')
                }
                disabled={isBusy}
              >
                {isBusy ? 'Criando...' : 'Aprovar e criar workspace'}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  void setStatus(request.id, AccessRequestStatus.CONTACTED)
                }
                disabled={isBusy}
              >
                Marcar como contatada
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  void setStatus(request.id, AccessRequestStatus.REJECTED)
                }
                disabled={isBusy}
              >
                Recusar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div style={styles.root}>
      <section style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Solicitações de acesso</h1>
          <p style={styles.headerSubtitle}>
            Empresas que pediram acesso pelo site. Nenhuma consome servidor: só
            existe workspace, subdomínio e instância de WhatsApp depois que você
            aprova. {pendingCount} aguardando decisão.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          <IconRefresh size={14} /> Atualizar
        </Button>
      </section>

      {errorMessage ? <div style={styles.error}>{errorMessage}</div> : null}

      <div style={styles.list}>
        {isLoading ? (
          <Skeleton style={{ height: '160px' }} />
        ) : requests.length === 0 ? (
          <Card>
            <div style={styles.empty}>
              Nenhuma solicitação ainda. O formulário está em
              crm.bydiex.com.
            </div>
          </Card>
        ) : (
          requests.map(renderRequest)
        )}
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: ACCESS_REQUESTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'diex-access-requests',
  description:
    'Fila de solicitações de acesso com aprovação que cria o workspace do cliente e envia o convite.',
  component: AccessRequestsFrontComponent,
});
