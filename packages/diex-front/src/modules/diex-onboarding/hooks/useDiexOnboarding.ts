import { useCallback, useEffect, useRef, useState } from 'react';

import { useDiexOnboardingDataFlow } from '@/diex-onboarding/hooks/useDiexOnboardingDataFlow';
import { useDiexOnboardingWhatsappConnection } from '@/diex-onboarding/hooks/useDiexOnboardingWhatsappConnection';
import { useDiexWorkspaceContext } from '@/diex-onboarding/hooks/useDiexWorkspaceContext';
import {
  type DiexCommercialReadiness,
  type DiexArchitectureState,
  type DiexFirstCommercialFlowResult,
  type DiexPageUpdateInput,
} from '@/diex-onboarding/types/diexOnboardingTypes';
import {
  getDiexOnboardingRoute,
  postDiexOnboardingRoute,
} from '@/diex-onboarding/utils/diexOnboardingApi';

export const useDiexOnboarding = () => {
  const { dataFlow, refetchDataFlow } = useDiexOnboardingDataFlow();
  const [readiness, setReadiness] = useState<DiexCommercialReadiness | null>(
    null,
  );
  const [architecture, setArchitecture] =
    useState<DiexArchitectureState | null>(null);
  const [isLoadingCommercialData, setIsLoadingCommercialData] = useState(true);
  const [isUpdatingArchitecture, setIsUpdatingArchitecture] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isSavingPrimaryChannel, setIsSavingPrimaryChannel] = useState(false);
  const [isExecutingFirstFlow, setIsExecutingFirstFlow] = useState(false);
  const [commercialError, setCommercialError] = useState<string | null>(null);
  const [isReadinessReadConfirmed, setIsReadinessReadConfirmed] =
    useState(false);
  const [isArchitectureReadConfirmed, setIsArchitectureReadConfirmed] =
    useState(false);
  const [isPageCatalogReadConfirmed, setIsPageCatalogReadConfirmed] =
    useState(false);
  // Id de requisição para descartar resposta obsoleta; renderizar a cada
  // incremento anularia o propósito.
  // oxlint-disable-next-line diex/no-state-useref
  const refreshRequestIdRef = useRef(0);
  const {
    workspaceContext,
    workspaceContextReadState,
    isLoadingWorkspaceContext,
    isCreatingContext,
    isSavingContext,
    isActivatingContext,
    refetchWorkspaceContext,
    createWorkspaceContext,
    saveWorkspaceContext,
    activateWorkspaceContext,
  } = useDiexWorkspaceContext();
  const refreshCommercialData = useCallback(async (): Promise<void> => {
    const requestId = refreshRequestIdRef.current + 1;

    refreshRequestIdRef.current = requestId;
    setIsLoadingCommercialData(true);
    setIsReadinessReadConfirmed(false);
    setIsArchitectureReadConfirmed(false);
    setIsPageCatalogReadConfirmed(false);

    try {
      const [readinessResult, architectureResult, pageCatalogResult] =
        await Promise.allSettled([
          getDiexOnboardingRoute<DiexCommercialReadiness>(
            '/rest/diex/onboarding/readiness',
          ),
          getDiexOnboardingRoute<DiexArchitectureState>(
            '/rest/diex/onboarding/architecture',
          ),
          getDiexOnboardingRoute<
            NonNullable<DiexArchitectureState['pageCatalog']>
          >('/rest/diex/onboarding/pages'),
        ]);
      const nextReadiness =
        readinessResult.status === 'fulfilled' ? readinessResult.value : null;
      const nextArchitecture =
        architectureResult.status === 'fulfilled'
          ? architectureResult.value
          : null;
      const nextPageCatalog =
        pageCatalogResult.status === 'fulfilled'
          ? pageCatalogResult.value
          : null;
      const failedSources = [
        readinessResult.status === 'rejected' ? 'prontidão' : null,
        architectureResult.status === 'rejected' ? 'arquitetura' : null,
        pageCatalogResult.status === 'rejected' ? 'páginas e menu' : null,
      ].filter((source): source is string => source !== null);

      if (requestId !== refreshRequestIdRef.current) {
        return;
      }

      setIsReadinessReadConfirmed(readinessResult.status === 'fulfilled');
      setIsArchitectureReadConfirmed(architectureResult.status === 'fulfilled');
      setIsPageCatalogReadConfirmed(pageCatalogResult.status === 'fulfilled');

      if (!nextReadiness && !nextArchitecture && !nextPageCatalog) {
        throw new Error('Não foi possível carregar a ativação da operação.');
      }

      if (nextReadiness) {
        setReadiness(nextReadiness);
      }

      if (nextArchitecture) {
        setArchitecture({
          ...nextArchitecture,
          pageCatalog:
            nextPageCatalog ?? nextArchitecture.pageCatalog ?? undefined,
        });
      } else if (nextPageCatalog) {
        setArchitecture((current) => ({
          profile: current?.profile ?? null,
          blueprint: current?.blueprint ?? null,
          changeSet: current?.changeSet ?? null,
          pageCatalog: nextPageCatalog,
        }));
      }
      setCommercialError(
        failedSources.length > 0
          ? `Atualização parcial: não foi possível confirmar ${failedSources.join(
              ', ',
            )}. Os últimos dados válidos foram preservados.`
          : null,
      );
    } catch (error) {
      if (requestId !== refreshRequestIdRef.current) {
        return;
      }

      setCommercialError(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar a prontidão da operação.',
      );
    } finally {
      if (requestId === refreshRequestIdRef.current) {
        setIsLoadingCommercialData(false);
      }
    }
  }, []);

  const handleWhatsappConnected = useCallback(() => {
    void Promise.all([refetchDataFlow(), refreshCommercialData()]);
  }, [refetchDataFlow, refreshCommercialData]);
  const { connection, errorMessage, isConnecting, requestConnection } =
    useDiexOnboardingWhatsappConnection({
      onConnected: handleWhatsappConnected,
      enabled:
        (readiness?.evidence.primaryChannel ??
          readiness?.readinessPack?.primaryChannel) === 'WHATSAPP',
    });

  const load = useCallback(async (): Promise<void> => {
    await Promise.all([
      refetchWorkspaceContext(),
      refetchDataFlow(),
      refreshCommercialData(),
    ]);
  }, [refetchDataFlow, refetchWorkspaceContext, refreshCommercialData]);

  useEffect(() => {
    void refreshCommercialData();
  }, [refreshCommercialData]);

  const approveArchitecture = useCallback(async (): Promise<void> => {
    if (!isArchitectureReadConfirmed) {
      setCommercialError(
        'A arquitetura atual não foi confirmada. Atualize antes de aprovar.',
      );
      return;
    }

    const reviewedVersion = architecture?.changeSet?.version;

    if (typeof reviewedVersion !== 'number') {
      setCommercialError(
        'O pacote de mudanças não foi confirmado. Recalcule a arquitetura antes de aprovar.',
      );
      return;
    }

    setIsUpdatingArchitecture(true);

    try {
      await postDiexOnboardingRoute(
        '/rest/diex/onboarding/architecture/approve',
        { version: reviewedVersion },
      );
      await refreshCommercialData();
    } catch (error) {
      setCommercialError(
        error instanceof Error
          ? error.message
          : 'Não foi possível aprovar a arquitetura.',
      );
    } finally {
      setIsUpdatingArchitecture(false);
    }
  }, [architecture, isArchitectureReadConfirmed, refreshCommercialData]);

  const applyArchitecture = useCallback(async (): Promise<void> => {
    if (!isArchitectureReadConfirmed) {
      setCommercialError(
        'A arquitetura aprovada não foi confirmada. Atualize antes de publicar.',
      );
      return;
    }

    const approvedVersion = architecture?.changeSet?.version;

    if (typeof approvedVersion !== 'number') {
      setCommercialError(
        'A versão aprovada não foi confirmada. Atualize antes de publicar.',
      );
      return;
    }

    setIsUpdatingArchitecture(true);

    try {
      await postDiexOnboardingRoute(
        '/rest/diex/onboarding/architecture/apply',
        {
          version: approvedVersion,
        },
      );
      await refreshCommercialData();
    } catch (error) {
      setCommercialError(
        error instanceof Error
          ? error.message
          : 'Não foi possível publicar a arquitetura.',
      );
    } finally {
      setIsUpdatingArchitecture(false);
    }
  }, [architecture, isArchitectureReadConfirmed, refreshCommercialData]);

  const regenerateArchitecture = useCallback(async (): Promise<void> => {
    if (!isArchitectureReadConfirmed) {
      setCommercialError(
        'O estado atual da arquitetura não foi confirmado. Atualize antes de recalcular.',
      );
      return;
    }

    setIsUpdatingArchitecture(true);

    try {
      await postDiexOnboardingRoute(
        '/rest/diex/onboarding/architecture/regenerate',
      );
      await refreshCommercialData();
    } catch (error) {
      setCommercialError(
        error instanceof Error
          ? error.message
          : 'Não foi possível recalcular a arquitetura com o contexto revisado.',
      );
    } finally {
      setIsUpdatingArchitecture(false);
    }
  }, [isArchitectureReadConfirmed, refreshCommercialData]);

  const createPage = useCallback(
    async (label: string, description: string): Promise<boolean> => {
      if (!isPageCatalogReadConfirmed) {
        setCommercialError(
          'O catálogo atual não foi confirmado. Atualize antes de criar uma página.',
        );
        return false;
      }

      setIsUpdatingArchitecture(true);

      try {
        await postDiexOnboardingRoute('/rest/diex/onboarding/pages', {
          action: 'CREATE',
          label,
          description,
          aiGenerated: false,
        });
        await refreshCommercialData();
        return true;
      } catch (error) {
        setCommercialError(
          error instanceof Error
            ? error.message
            : 'Não foi possível criar a página operacional.',
        );
        return false;
      } finally {
        setIsUpdatingArchitecture(false);
      }
    },
    [isPageCatalogReadConfirmed, refreshCommercialData],
  );

  const archivePage = useCallback(
    async (key: string): Promise<void> => {
      if (!isPageCatalogReadConfirmed) {
        setCommercialError(
          'O catálogo atual não foi confirmado. Atualize antes de arquivar uma página.',
        );
        return;
      }

      setIsUpdatingArchitecture(true);

      try {
        await postDiexOnboardingRoute('/rest/diex/onboarding/pages', {
          action: 'ARCHIVE',
          key,
        });
        await refreshCommercialData();
      } catch (error) {
        setCommercialError(
          error instanceof Error
            ? error.message
            : 'Não foi possível arquivar a página operacional.',
        );
      } finally {
        setIsUpdatingArchitecture(false);
      }
    },
    [isPageCatalogReadConfirmed, refreshCommercialData],
  );

  const restorePage = useCallback(
    async (key: string): Promise<void> => {
      if (!isPageCatalogReadConfirmed) {
        setCommercialError(
          'O catálogo atual não foi confirmado. Atualize antes de restaurar uma página.',
        );
        return;
      }

      setIsUpdatingArchitecture(true);

      try {
        await postDiexOnboardingRoute('/rest/diex/onboarding/pages', {
          action: 'RESTORE',
          key,
        });
        await refreshCommercialData();
      } catch (error) {
        setCommercialError(
          error instanceof Error
            ? error.message
            : 'Não foi possível restaurar a página operacional.',
        );
      } finally {
        setIsUpdatingArchitecture(false);
      }
    },
    [isPageCatalogReadConfirmed, refreshCommercialData],
  );

  const togglePageNavigation = useCallback(
    async (
      page: NonNullable<DiexArchitectureState['pageCatalog']>['items'][number],
    ): Promise<void> => {
      if (!isPageCatalogReadConfirmed) {
        setCommercialError(
          'O catálogo atual não foi confirmado. Atualize antes de mudar o menu.',
        );
        return;
      }

      setIsUpdatingArchitecture(true);

      try {
        await postDiexOnboardingRoute('/rest/diex/onboarding/pages', {
          action: 'UPDATE',
          key: page.key,
          showInNavigation: !page.showInNavigation,
        });
        await refreshCommercialData();
      } catch (error) {
        setCommercialError(
          error instanceof Error
            ? error.message
            : 'Não foi possível atualizar o menu operacional.',
        );
      } finally {
        setIsUpdatingArchitecture(false);
      }
    },
    [isPageCatalogReadConfirmed, refreshCommercialData],
  );

  const updatePage = useCallback(
    async (page: DiexPageUpdateInput): Promise<boolean> => {
      if (!isPageCatalogReadConfirmed) {
        setCommercialError(
          'O catálogo atual não foi confirmado. Atualize antes de adaptar a página.',
        );
        return false;
      }

      setIsUpdatingArchitecture(true);

      try {
        await postDiexOnboardingRoute('/rest/diex/onboarding/pages', {
          action: 'UPDATE',
          ...page,
        });
        await refreshCommercialData();
        return true;
      } catch (error) {
        setCommercialError(
          error instanceof Error
            ? error.message
            : 'Não foi possível adaptar a página operacional.',
        );
        return false;
      } finally {
        setIsUpdatingArchitecture(false);
      }
    },
    [isPageCatalogReadConfirmed, refreshCommercialData],
  );

  const setCommercialGoal = useCallback(
    async (goal: string): Promise<void> => {
      setIsSavingGoal(true);

      try {
        await postDiexOnboardingRoute('/rest/diex/onboarding/goal', { goal });
        await refreshCommercialData();
      } catch (error) {
        setCommercialError(
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar o objetivo da operação.',
        );
      } finally {
        setIsSavingGoal(false);
      }
    },
    [refreshCommercialData],
  );

  const setPrimaryChannel = useCallback(
    async (primaryChannel: string): Promise<void> => {
      setIsSavingPrimaryChannel(true);

      try {
        await postDiexOnboardingRoute('/rest/diex/onboarding/primary-channel', {
          primaryChannel,
        });
        await refreshCommercialData();
      } catch (error) {
        setCommercialError(
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar a forma principal de entrada.',
        );
      } finally {
        setIsSavingPrimaryChannel(false);
      }
    },
    [refreshCommercialData],
  );

  const executeFirstCommercialFlow =
    useCallback(async (): Promise<DiexFirstCommercialFlowResult> => {
      if (!isReadinessReadConfirmed) {
        throw new Error(
          'A prontidão atual não foi confirmada. Atualize antes de executar o primeiro fluxo.',
        );
      }

      setIsExecutingFirstFlow(true);

      try {
        const result =
          await postDiexOnboardingRoute<DiexFirstCommercialFlowResult>(
            '/rest/diex/onboarding/first-commercial-flow',
          );
        await Promise.all([refetchDataFlow(), refreshCommercialData()]);

        return result;
      } finally {
        setIsExecutingFirstFlow(false);
      }
    }, [isReadinessReadConfirmed, refetchDataFlow, refreshCommercialData]);

  const completeCommercialOnboarding = useCallback(async (): Promise<void> => {
    if (!isReadinessReadConfirmed || readiness?.ready !== true) {
      throw new Error(
        'A prontidão final não foi confirmada. Atualize antes de concluir.',
      );
    }

    await postDiexOnboardingRoute('/rest/diex/onboarding/complete');
  }, [isReadinessReadConfirmed, readiness?.ready]);

  return {
    workspaceContext,
    workspaceContextReadState,
    dataFlow,
    readiness,
    architecture,
    isLoadingCommercialData,
    isUpdatingArchitecture,
    isSavingGoal,
    isSavingPrimaryChannel,
    isExecutingFirstFlow,
    commercialError,
    isReadinessReadConfirmed,
    isArchitectureReadConfirmed,
    isPageCatalogReadConfirmed,
    connection,
    errorMessage,
    isLoading: isLoadingWorkspaceContext,
    isConnecting,
    isCreatingContext,
    isSavingContext,
    isActivatingContext,
    load,
    refreshCommercialData,
    approveArchitecture,
    applyArchitecture,
    regenerateArchitecture,
    createPage,
    archivePage,
    restorePage,
    togglePageNavigation,
    updatePage,
    setCommercialGoal,
    setPrimaryChannel,
    executeFirstCommercialFlow,
    completeCommercialOnboarding,
    requestConnection,
    createWorkspaceContext,
    saveWorkspaceContext,
    activateWorkspaceContext,
  };
};
