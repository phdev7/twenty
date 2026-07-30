import { useCallback, useEffect, useRef, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import { WHATSAPP_CONNECTION_ROUTE } from 'src/modules/inbox/constants/whatsapp-connection.constants';
import { WHATSAPP_CONNECTION_POLL_INTERVAL_MS } from 'src/modules/onboarding/constants/onboarding.constants';
import {
  type DataFlowSummary,
  type WhatsappConnection,
  type WorkspaceContextRecord,
} from 'src/modules/onboarding/front-components/onboarding.types';
import { getRouteErrorMessage } from 'src/utils/route-error-message';

type WorkspaceContextQueryResult = {
  diexWorkspaceContexts?: {
    edges?: Array<{ node: WorkspaceContextRecord }>;
  };
};

type CountQueryResult = {
  inboxConversations?: { totalCount?: number };
  inboxMessages?: { totalCount?: number };
  people?: { totalCount?: number };
};

// Rich text resolves to an object, so every one of these must be selected as
// { markdown } — asking for the scalar returns null and makes a filled record
// look empty, which is the exact failure this page exists to reveal.
const richText = { markdown: true } as const;

export const useOnboarding = () => {
  const [workspaceContext, setWorkspaceContext] =
    useState<WorkspaceContextRecord | null>(null);
  const [dataFlow, setDataFlow] = useState<DataFlowSummary>({
    conversationCount: 0,
    messageCount: 0,
    peopleCount: 0,
  });
  const [connection, setConnection] = useState<WhatsappConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingContext, setIsCreatingContext] = useState(false);
  const [isActivatingContext, setIsActivatingContext] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(
    () => () => {
      isMountedRef.current = false;

      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    },
    [],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const client = new CoreApiClient();
      const [contextResult, countResult] = await Promise.all([
        client.query({
          diexWorkspaceContexts: {
            __args: { first: 1, orderBy: [{ createdAt: 'AscNullsLast' }] },
            edges: {
              node: {
                id: true,
                name: true,
                status: true,
                reviewedAt: true,
                businessDescription: richText,
                idealCustomerProfile: richText,
                toneOfVoice: richText,
                commercialRules: richText,
                objectionPlaybook: richText,
                competitiveLandscape: richText,
                forbiddenClaims: richText,
              },
            },
          },
        } as never),
        client.query({
          inboxConversations: { __args: { first: 0 }, totalCount: true },
          inboxMessages: { __args: { first: 0 }, totalCount: true },
          people: { __args: { first: 0 }, totalCount: true },
        } as never),
      ]);

      const counts = countResult as unknown as CountQueryResult;

      setWorkspaceContext(
        (contextResult as unknown as WorkspaceContextQueryResult)
          .diexWorkspaceContexts?.edges?.[0]?.node ?? null,
      );
      setDataFlow({
        conversationCount: counts.inboxConversations?.totalCount ?? 0,
        messageCount: counts.inboxMessages?.totalCount ?? 0,
        peopleCount: counts.people?.totalCount ?? 0,
      });
    } catch {
      setErrorMessage('Não foi possível carregar o estado do workspace.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const requestConnection = useCallback(
    async (options?: { isPoll?: boolean }): Promise<void> => {
      if (options?.isPoll !== true) {
        setIsConnecting(true);
      }

      try {
        const result = await new RestApiClient().post<WhatsappConnection>(
          `/s${WHATSAPP_CONNECTION_ROUTE}`,
          {},
        );

        if (!isMountedRef.current) {
          return;
        }

        setConnection(result);

        if (result.state === 'AWAITING_SCAN' || result.state === 'CONNECTING') {
          pollTimeoutRef.current = setTimeout(() => {
            void requestConnection({ isPoll: true });
          }, WHATSAPP_CONNECTION_POLL_INTERVAL_MS);
        }

        // Messages only start arriving once the scan lands, so the data-flow
        // step is stale until then.
        if (result.state === 'CONNECTED' && options?.isPoll === true) {
          await load();
        }
      } catch (error) {
        if (!isMountedRef.current) {
          return;
        }

        if (options?.isPoll !== true) {
          await enqueueSnackbar({
            message: getRouteErrorMessage(
              error,
              'Não foi possível falar com o serviço de WhatsApp.',
            ),
            variant: 'error',
          });
        }
      } finally {
        if (isMountedRef.current && options?.isPoll !== true) {
          setIsConnecting(false);
        }
      }
    },
    [load],
  );

  const createWorkspaceContext = useCallback(async (): Promise<void> => {
    setIsCreatingContext(true);

    try {
      const { createDiexWorkspaceContext } = await new CoreApiClient().mutation({
        createDiexWorkspaceContext: {
          __args: { data: { name: 'Contexto comercial' } },
          id: true,
        },
      } as never);
      const createdId = (createDiexWorkspaceContext as { id?: string })?.id;

      if (!createdId) {
        throw new Error('O contexto não foi criado.');
      }

      await load();
      await enqueueSnackbar({
        message: 'Contexto criado. Preencha os campos para orientar a IA.',
        variant: 'success',
      });
    } catch {
      await enqueueSnackbar({
        message: 'Não foi possível criar o contexto comercial.',
        variant: 'error',
      });
    } finally {
      setIsCreatingContext(false);
    }
  }, [load]);

  // A context sitting in DRAFT is invisible to every agent, so filling the
  // fields is only half the step: this is the switch that puts it in front of
  // the AI.
  const activateWorkspaceContext = useCallback(async (): Promise<void> => {
    if (!workspaceContext) {
      return;
    }

    setIsActivatingContext(true);

    try {
      await new CoreApiClient().mutation({
        updateDiexWorkspaceContext: {
          __args: {
            id: workspaceContext.id,
            data: { status: 'ACTIVE', reviewedAt: new Date().toISOString() },
          },
          id: true,
        },
      } as never);

      await load();
      await enqueueSnackbar({
        message: 'Contexto ativo. A IA já responde com a voz da sua empresa.',
        variant: 'success',
      });
    } catch {
      await enqueueSnackbar({
        message: 'Não foi possível ativar o contexto comercial.',
        variant: 'error',
      });
    } finally {
      setIsActivatingContext(false);
    }
  }, [load, workspaceContext]);

  return {
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
  };
};
