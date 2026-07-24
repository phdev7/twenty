import { useCallback, useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import {
  type CommercialOpportunity,
  type CommercialSignal,
} from 'src/modules/commercial-intelligence/front-components/commercial-intelligence.types';

type CommercialSignalsQueryResult = {
  commercialSignals?: {
    edges?: Array<{
      node: CommercialSignal;
    }>;
  };
};

type OpportunitiesQueryResult = {
  opportunities?: {
    edges?: Array<{
      node: CommercialOpportunity;
    }>;
  };
};

export const useCommercialIntelligence = () => {
  const [signals, setSignals] = useState<CommercialSignal[]>([]);
  const [opportunities, setOpportunities] = useState<CommercialOpportunity[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [busySignalId, setBusySignalId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const client = new CoreApiClient();
      const [signalsResult, opportunitiesResult] = await Promise.all([
        client.query({
          commercialSignals: {
            __args: {
              first: 100,
              orderBy: [{ capturedAt: 'DescNullsLast' }],
            },
            edges: {
              node: {
                id: true,
                name: true,
                type: true,
                source: true,
                status: true,
                strength: true,
                confidence: true,
                capturedAt: true,
                validUntil: true,
                recommendedAction: {
                  markdown: true,
                },
                opportunity: {
                  id: true,
                  name: true,
                },
                company: {
                  id: true,
                  name: true,
                },
                person: {
                  id: true,
                  name: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        } as never),
        client.query({
          opportunities: {
            __args: {
              first: 100,
              orderBy: [{ commercialScore: 'DescNullsLast' }],
            },
            edges: {
              node: {
                id: true,
                name: true,
                stage: true,
                amount: {
                  amountMicros: true,
                  currencyCode: true,
                },
                commercialScore: true,
                dealRisk: true,
                nextCommercialAction: true,
                nextCommercialActionAt: true,
                company: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        } as never),
      ]);

      setSignals(
        (
          signalsResult as unknown as CommercialSignalsQueryResult
        ).commercialSignals?.edges?.map(({ node }) => node) ?? [],
      );
      setOpportunities(
        (
          opportunitiesResult as unknown as OpportunitiesQueryResult
        ).opportunities?.edges?.map(({ node }) => node) ?? [],
      );
    } catch {
      setErrorMessage(
        'Não foi possível carregar o cockpit de inteligência comercial.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateSignalStatus = useCallback(
    async (signalId: string, status: 'IN_REVIEW' | 'ACTIONED') => {
      setBusySignalId(signalId);

      try {
        await new CoreApiClient().mutation({
          updateCommercialSignal: {
            __args: {
              id: signalId,
              data: {
                status,
              },
            },
            id: true,
          },
        } as never);

        setSignals((current) =>
          current.map((signal) =>
            signal.id === signalId ? { ...signal, status } : signal,
          ),
        );

        await enqueueSnackbar({
          message:
            status === 'IN_REVIEW'
              ? 'Sinal movido para análise.'
              : 'Sinal marcado como tratado.',
          variant: 'success',
        });
      } catch {
        await enqueueSnackbar({
          message: 'Não foi possível atualizar o sinal comercial.',
          variant: 'error',
        });
      } finally {
        setBusySignalId(null);
      }
    },
    [],
  );

  return {
    signals,
    opportunities,
    isLoading,
    busySignalId,
    errorMessage,
    load,
    updateSignalStatus,
  };
};
