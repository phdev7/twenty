import { getTokenPair } from '@/apollo/utils/getTokenPair';
import { type DiexAccessRequestRecord } from '@/diex-access-requests/types/diexAccessRequestTypes';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

type GraphqlResponse<TData> = {
  data?: TData | null;
  errors?: Array<{ message?: string }>;
};

type ProvisionedWorkspace = {
  workspaceUrl: string;
  wasInvitationSent: boolean;
  invitationMessage: string;
};

export class DiexAccessRequestProvisioningError extends Error {}

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

const callCoreGraphql = async <TData>(
  query: string,
  variables: Record<string, unknown>,
  accessToken?: string,
): Promise<GraphqlResponse<TData>> => {
  const token =
    accessToken ?? getTokenPair()?.accessOrWorkspaceAgnosticToken?.token;

  if (!token) {
    throw new DiexAccessRequestProvisioningError(
      'Sua sessão expirou. Entre novamente antes de aprovar a solicitação.',
    );
  }

  const response = await fetch(`${REACT_APP_SERVER_BASE_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new DiexAccessRequestProvisioningError(
      'O servidor recusou a operação. Confira os workspaces antes de tentar novamente.',
    );
  }

  return (await response.json()) as GraphqlResponse<TData>;
};

const readGraphqlError = (
  response: GraphqlResponse<unknown>,
  fallback: string,
): string => response.errors?.[0]?.message?.trim() || fallback;

export const provisionDiexAccessRequestWorkspace = async ({
  request,
  subdomain,
}: {
  request: DiexAccessRequestRecord;
  subdomain: string;
}): Promise<ProvisionedWorkspace> => {
  const availability = await callCoreGraphql<{
    getSubdomainAvailability?: { isAvailable?: boolean };
  }>(SUBDOMAIN_AVAILABILITY_QUERY, { subdomain });

  if (availability.data?.getSubdomainAvailability?.isAvailable !== true) {
    throw new DiexAccessRequestProvisioningError(
      `O endereço ${subdomain} não está disponível. Escolha outro.`,
    );
  }

  const creation = await callCoreGraphql<{
    signUpInNewWorkspace?: {
      loginToken?: { token?: string };
      workspace?: { workspaceUrls?: { subdomainUrl?: string } };
    };
  }>(SIGN_UP_IN_NEW_WORKSPACE_MUTATION, {
    input: {
      displayName: request.name ?? subdomain,
      subdomain,
    },
  });
  const created = creation.data?.signUpInNewWorkspace;
  const workspaceUrl = created?.workspace?.workspaceUrls?.subdomainUrl;
  const loginToken = created?.loginToken?.token;

  if (!workspaceUrl) {
    throw new DiexAccessRequestProvisioningError(
      readGraphqlError(creation, 'O workspace não pôde ser criado.'),
    );
  }

  const origin = workspaceUrl.replace(/\/+$/, '');
  let wasInvitationSent = false;
  let invitationMessage =
    'Workspace criado, mas o convite não foi enviado. Convide o cliente por Membros dentro do novo workspace.';

  // The workspace is already live. Invitation failures intentionally fall
  // through so the request can still record its provisioned subdomain.
  if (loginToken && request.email) {
    try {
      const exchange = await callCoreGraphql<{
        getAuthTokensFromLoginToken?: {
          tokens?: { accessOrWorkspaceAgnosticToken?: { token?: string } };
        };
      }>(AUTH_TOKENS_FROM_LOGIN_TOKEN_MUTATION, { loginToken, origin });
      const accessToken =
        exchange.data?.getAuthTokensFromLoginToken?.tokens
          ?.accessOrWorkspaceAgnosticToken?.token;

      if (accessToken) {
        const invitation = await callCoreGraphql<{
          sendInvitations?: { success?: boolean };
        }>(SEND_INVITATIONS_MUTATION, { emails: [request.email] }, accessToken);

        if (invitation.data?.sendInvitations?.success === true) {
          wasInvitationSent = true;
          invitationMessage = `Convite enviado para ${request.email}.`;
        }
      }
    } catch {
      // The manual-invitation message above is the safe recoverable outcome.
    }
  }

  return { workspaceUrl: origin, wasInvitationSent, invitationMessage };
};
