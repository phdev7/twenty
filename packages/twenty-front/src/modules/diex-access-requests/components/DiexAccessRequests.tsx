import { useEffect, useMemo, useState } from 'react';
import { styled } from '@linaria/react';
import { IconRefresh } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { DiexAccessRequestCard } from '@/diex-access-requests/components/DiexAccessRequestCard';
import { useDiexAccessRequests } from '@/diex-access-requests/hooks/useDiexAccessRequests';
import { DiexAccessRequestStatus } from '@/diex-access-requests/types/diexAccessRequestTypes';
import { slugifyDiexAccessRequestSubdomain } from '@/diex-access-requests/utils/diexAccessRequestFormatters';

const StyledRoot = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledHeader = styled.section`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: grid;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(0, 1fr) auto;
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[5]};
`;

const StyledHeaderTitle = styled.h1`
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledHeaderSubtitle = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: ${themeCssVariables.spacing[1]} 0 0;
  max-width: 72ch;
`;

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledSkeleton = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.lg};
  height: 160px;
`;

const StyledNotice = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.lg};
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[5]};
  text-align: center;
`;

const StyledError = styled(StyledNotice)`
  background: ${themeCssVariables.background.transparent.danger};
  border-color: ${themeCssVariables.border.color.danger};
  color: ${themeCssVariables.font.color.danger};
  text-align: left;
`;

export const DiexAccessRequests = () => {
  const {
    requests,
    isLoading,
    busyRequestId,
    errorMessage,
    outcomes,
    load,
    setStatus,
    approve,
    retryInvitation,
  } = useDiexAccessRequests();
  const [subdomainDrafts, setSubdomainDrafts] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    setSubdomainDrafts((current) => {
      const next = { ...current };

      requests.forEach((request) => {
        if (next[request.id] === undefined) {
          next[request.id] =
            request.desiredSubdomain ??
            slugifyDiexAccessRequestSubdomain(request.name ?? '');
        }
      });

      return next;
    });
  }, [requests]);

  const pendingCount = useMemo(
    () =>
      requests.filter(
        ({ status }) =>
          status !== DiexAccessRequestStatus.APPROVED &&
          status !== DiexAccessRequestStatus.REJECTED,
      ).length,
    [requests],
  );

  return (
    <StyledRoot>
      <StyledHeader>
        <div>
          <StyledHeaderTitle>Solicitações de acesso</StyledHeaderTitle>
          <StyledHeaderSubtitle>
            Empresas que pediram acesso pelo site. Nenhuma consome servidor: só
            existe workspace, subdomínio e instância de WhatsApp depois que você
            aprova. {pendingCount} aguardando decisão.
          </StyledHeaderSubtitle>
        </div>
        <Button
          variant="secondary"
          Icon={IconRefresh}
          title="Atualizar"
          onClick={() => void load()}
        />
      </StyledHeader>

      {errorMessage ? <StyledError>{errorMessage}</StyledError> : null}

      <StyledList>
        {isLoading && requests.length === 0 ? (
          <StyledSkeleton />
        ) : requests.length === 0 ? (
          <StyledNotice>
            Nenhuma solicitação ainda. O formulário está em crm.bydiex.com.
          </StyledNotice>
        ) : (
          requests.map((request) => (
            <DiexAccessRequestCard
              key={request.id}
              request={request}
              isBusy={busyRequestId === request.id}
              subdomainDraft={subdomainDrafts[request.id] ?? ''}
              outcome={outcomes[request.id]}
              onSubdomainChange={(value) =>
                setSubdomainDrafts((current) => ({
                  ...current,
                  [request.id]: value,
                }))
              }
              onApprove={() =>
                void approve(request, subdomainDrafts[request.id] ?? '')
              }
              onRetryInvitation={() => void retryInvitation(request)}
              onSetStatus={(status) => void setStatus(request.id, status)}
            />
          ))
        )}
      </StyledList>
    </StyledRoot>
  );
};
