import { useCallback, useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import {
  type AccessRequestRecord,
  type ApprovalOutcome,
} from 'src/modules/access-requests/front-components/access-requests.types';
import { AccessRequestStatus } from 'src/modules/access-requests/objects/access-request.object';

type AccessRequestsQueryResult = {
  diexAccessRequests?: {
    edges?: Array<{ node: AccessRequestRecord }>;
  };
};

type GraphqlResponse<TData> = {
  data?: TData | null;
  errors?: Array<{ message?: string }>;
};

const readGraphqlError = (
  response: GraphqlResponse<unknown>,
  fallback: string,
): string => response.errors?.[0]?.message?.trim() || fallback;

// The app talks to core auth through plain GraphQL because these operations
// have no generated client: they are not workspace records.
const callGraphql = async <TData,>(
  query: string,
  variables: Record<string, unknown>,
  accessToken?: string,
): Promise<GraphqlResponse<TData>> =>
  new RestApiClient().post<GraphqlResponse<TData>>(
    '/graphql',
    { query, variables },
    accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  );

const SUBDOMAIN_AVAILABILITY_QUERY = `
  query GetSubdomainAvailability($subdomain: String!) {
    getSubdomainAvailability(subdomain: $subdomain) { isAvailable }
  }
`;

const SIGN_UP_IN_NEW_WORKSPACE_MUTATION = `
  mutation SignUpInNewWorkspace($input: SignUpInNewWorkspaceInput) {
    signUpInNewWorkspace(input: $input) {
      loginToken { token }
      workspace { id workspaceUrls { subdomainUrl } }
    }
  }
`;

const AUTH_TOKENS_FROM_LOGIN_TOKEN_MUTATION = `
  mutation GetAuthTokensFromLoginToken($loginToken: String!, $origin: String!) {
    getAuthTokensFromLoginToken(loginToken: $loginToken, origin: $origin) {
      tokens { accessOrWorkspaceAgnosticToken { token } }
    }
  }
`;

const SEND_INVITATIONS_MUTATION = `
  mutation SendInvitations($emails: [String!]!) {
    sendInvitations(emails: $emails) { success errors }
  }
`;

export const useAccessRequests = () => {
  const [requests, setRequests] = useState<AccessRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, ApprovalOutcome>>({});

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = (await new CoreApiClient().query({
        diexAccessRequests: {
          __args: { first: 100, orderBy: [{ requestedAt: 'DescNullsLast' }] },
          edges: {
            node: {
              id: true,
              name: true,
              status: true,
              contactName: true,
              email: true,
              whatsapp: true,
              teamSize: true,
              desiredSubdomain: true,
              goal: true,
              requestedAt: true,
              reviewedAt: true,
              submissionCount: true,
              provisionedSubdomain: true,
            },
          },
        },
      } as never)) as unknown as AccessRequestsQueryResult;

      setRequests(
        result.diexAccessRequests?.edges?.map(({ node }) => node) ?? [],
      );
    } catch {
      setErrorMessage('Não foi possível carregar as solicitações.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateRequest = useCallback(
    async (id: string, data: Record<string, unknown>): Promise<void> => {
      await new CoreApiClient().mutation({
        updateDiexAccessRequest: { __args: { id, data }, id: true },
      } as never);
    },
    [],
  );

  const setStatus = useCallback(
    async (id: string, status: AccessRequestStatus): Promise<void> => {
      setBusyRequestId(id);

      try {
        await updateRequest(id, {
          status,
          ...(status === AccessRequestStatus.REJECTED
            ? { reviewedAt: new Date().toISOString() }
            : {}),
        });
        await load();
      } catch {
        await enqueueSnackbar({
          message: 'Não foi possível atualizar a solicitação.',
          variant: 'error',
        });
      } finally {
        setBusyRequestId(null);
      }
    },
    [load, updateRequest],
  );

  const approve = useCallback(
    async (request: AccessRequestRecord, subdomain: string): Promise<void> => {
      // Creating a second workspace for the same lead would burn one of the
      // five slots and leave two live subdomains for one customer.
      if (request.provisionedSubdomain) {
        await enqueueSnackbar({
          message: `Esta solicitação já recebeu o endereço ${request.provisionedSubdomain}.`,
          variant: 'warning',
        });

        return;
      }

      const normalizedSubdomain = subdomain.trim().toLowerCase();

      if (normalizedSubdomain.length < 3) {
        await enqueueSnackbar({
          message: 'Informe um endereço com pelo menos 3 caracteres.',
          variant: 'error',
        });

        return;
      }

      setBusyRequestId(request.id);

      try {
        const availability = await callGraphql<{
          getSubdomainAvailability?: { isAvailable?: boolean };
        }>(SUBDOMAIN_AVAILABILITY_QUERY, { subdomain: normalizedSubdomain });

        if (availability.data?.getSubdomainAvailability?.isAvailable !== true) {
          await enqueueSnackbar({
            message: `O endereço ${normalizedSubdomain} não está disponível. Escolha outro.`,
            variant: 'error',
          });

          return;
        }

        const creation = await callGraphql<{
          signUpInNewWorkspace?: {
            loginToken?: { token?: string };
            workspace?: {
              id?: string;
              workspaceUrls?: { subdomainUrl?: string };
            };
          };
        }>(SIGN_UP_IN_NEW_WORKSPACE_MUTATION, {
          input: {
            displayName: request.name ?? normalizedSubdomain,
            subdomain: normalizedSubdomain,
          },
        });
        const created = creation.data?.signUpInNewWorkspace;
        const workspaceUrl = created?.workspace?.workspaceUrls?.subdomainUrl;
        const loginToken = created?.loginToken?.token;

        if (!workspaceUrl) {
          await enqueueSnackbar({
            message: readGraphqlError(
              creation,
              'O workspace não pôde ser criado.',
            ),
            variant: 'error',
          });

          return;
        }

        const origin = workspaceUrl.replace(/\/+$/, '');
        let wasInvitationSent = false;
        let invitationMessage =
          'Workspace criado, mas o convite não foi enviado. Convide o cliente por Membros dentro do novo workspace.';

        // From here the workspace exists. Nothing below is allowed to abort the
        // record update, or the operator would lose track of a live workspace.
        if (loginToken && request.email) {
          try {
            const exchange = await callGraphql<{
              getAuthTokensFromLoginToken?: {
                tokens?: {
                  accessOrWorkspaceAgnosticToken?: { token?: string };
                };
              };
            }>(AUTH_TOKENS_FROM_LOGIN_TOKEN_MUTATION, { loginToken, origin });
            const accessToken =
              exchange.data?.getAuthTokensFromLoginToken?.tokens
                ?.accessOrWorkspaceAgnosticToken?.token;

            if (accessToken) {
              const invitation = await callGraphql<{
                sendInvitations?: { success?: boolean; errors?: string[] };
              }>(
                SEND_INVITATIONS_MUTATION,
                { emails: [request.email] },
                accessToken,
              );

              if (invitation.data?.sendInvitations?.success === true) {
                wasInvitationSent = true;
                invitationMessage = `Convite enviado para ${request.email}.`;
              }
            }
          } catch {
            // Falls through to the manual-invite message above.
          }
        }

        await updateRequest(request.id, {
          status: AccessRequestStatus.APPROVED,
          provisionedSubdomain: normalizedSubdomain,
          reviewedAt: new Date().toISOString(),
        });

        setOutcomes((current) => ({
          ...current,
          [request.id]: {
            workspaceUrl: origin,
            subdomain: normalizedSubdomain,
            wasInvitationSent,
            invitationMessage,
          },
        }));

        await load();
        await enqueueSnackbar({
          message: wasInvitationSent
            ? `Workspace ${normalizedSubdomain} criado e convite enviado.`
            : `Workspace ${normalizedSubdomain} criado. Falta convidar o cliente.`,
          variant: wasInvitationSent ? 'success' : 'warning',
        });
      } catch {
        await enqueueSnackbar({
          message:
            'Falha ao aprovar. Confira em Workspaces se algum foi criado antes de tentar de novo.',
          variant: 'error',
        });
      } finally {
        setBusyRequestId(null);
      }
    },
    [load, updateRequest],
  );

  return {
    requests,
    isLoading,
    busyRequestId,
    errorMessage,
    outcomes,
    load,
    setStatus,
    approve,
  };
};
