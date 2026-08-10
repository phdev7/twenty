import { getTokenPair } from '@/apollo/utils/getTokenPair';
import { type DiexAccessRequestRecord } from '@/diex-access-requests/types/diexAccessRequestTypes';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

type GraphqlResponse<TData> = {
  data?: TData | null;
  errors?: Array<{ message?: string }>;
};

type ProvisionedWorkspace = {
  workspaceUrl: string;
  subdomain: string;
  invitationMessage: string;
};

type InvitationRetryResult = {
  invitationReady: boolean;
  message: string;
};

export class DiexAccessRequestProvisioningError extends Error {}

const APPROVE_ACCESS_REQUEST_MUTATION = `
  mutation ApproveDiexAccessRequest($input: ApproveDiexAccessRequestInput!) {
    approveDiexAccessRequest(input: $input) {
      workspaceUrl
      subdomain
      invitationMessage
    }
  }
`;

const RETRY_ACCESS_REQUEST_INVITATION_MUTATION = `
  mutation RetryDiexAccessRequestInvitation($input: RetryDiexAccessRequestInvitationInput!) {
    retryDiexAccessRequestInvitation(input: $input) {
      invitationReady
      message
    }
  }
`;

export const provisionDiexAccessRequestWorkspace = async ({
  request,
  subdomain,
}: {
  request: DiexAccessRequestRecord;
  subdomain: string;
}): Promise<ProvisionedWorkspace> => {
  const token = getTokenPair()?.accessOrWorkspaceAgnosticToken?.token;

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
    body: JSON.stringify({
      query: APPROVE_ACCESS_REQUEST_MUTATION,
      variables: {
        input: { requestId: request.id, subdomain },
      },
    }),
  });

  if (!response.ok) {
    throw new DiexAccessRequestProvisioningError(
      'O servidor recusou a aprovação. Atualize a fila antes de tentar novamente.',
    );
  }

  const result = (await response.json()) as GraphqlResponse<{
    approveDiexAccessRequest?: ProvisionedWorkspace;
  }>;
  const provisioned = result.data?.approveDiexAccessRequest;

  if (!provisioned) {
    throw new DiexAccessRequestProvisioningError(
      result.errors?.[0]?.message?.trim() ||
        'O workspace não pôde ser provisionado.',
    );
  }

  return provisioned;
};

export const retryDiexAccessRequestInvitation = async ({
  requestId,
}: {
  requestId: string;
}): Promise<InvitationRetryResult> => {
  const token = getTokenPair()?.accessOrWorkspaceAgnosticToken?.token;

  if (!token) {
    throw new DiexAccessRequestProvisioningError(
      'Sua sessão expirou. Entre novamente antes de enviar o convite.',
    );
  }

  const response = await fetch(`${REACT_APP_SERVER_BASE_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: RETRY_ACCESS_REQUEST_INVITATION_MUTATION,
      variables: { input: { requestId } },
    }),
  });

  if (!response.ok) {
    throw new DiexAccessRequestProvisioningError(
      'O servidor recusou o envio do convite. Atualize a fila antes de tentar novamente.',
    );
  }

  const result = (await response.json()) as GraphqlResponse<{
    retryDiexAccessRequestInvitation?: InvitationRetryResult;
  }>;
  const invitation = result.data?.retryDiexAccessRequestInvitation;

  if (!invitation) {
    throw new DiexAccessRequestProvisioningError(
      result.errors?.[0]?.message?.trim() ||
        'O convite não pôde ser processado.',
    );
  }

  return invitation;
};
