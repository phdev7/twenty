import { useCallback, useEffect, useState } from 'react';

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
  const [isLoadingCommercialData, setIsLoadingCommercialData] =
    useState(true);
  const [isUpdatingArchitecture, setIsUpdatingArchitecture] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isExecutingFirstFlow, setIsExecutingFirstFlow] = useState(false);
  const [commercialError, setCommercialError] = useState<string | null>(null);
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
    setIsLoadingCommercialData(true);

    try {
      const [nextReadiness, nextArchitecture, nextPageCatalog] =
        await Promise.all([
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
      setReadiness(nextReadiness);
      setArchitecture({
        ...nextArchitecture,
        pageCatalog: nextPageCatalog,
      });
      setCommercialError(null);
    } catch (error) {
      setCommercialError(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar a prontidão comercial.',
      );
    } finally {
      setIsLoadingCommercialData(false);
    }
  }, []);

  const handleWhatsappConnected = useCallback(() => {
    void Promise.all([refetchDataFlow(), refreshCommercialData()]);
  }, [refetchDataFlow, refreshCommercialData]);
  const { connection, errorMessage, isConnecting, requestConnection } =
    useDiexOnboardingWhatsappConnection({
      onConnected: handleWhatsappConnected,
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
    setIsUpdatingArchitecture(true);

    try {
      await postDiexOnboardingRoute('/rest/diex/onboarding/architecture/approve');
      await refreshCommercialData();
    } catch (error) {
      setCommercialError(
        error instanceof Error ? error.message : 'Não foi possível aprovar a arquitetura.',
      );
    } finally {
      setIsUpdatingArchitecture(false);
    }
  }, [refreshCommercialData]);

  const applyArchitecture = useCallback(async (): Promise<void> => {
    setIsUpdatingArchitecture(true);

    try {
      await postDiexOnboardingRoute('/rest/diex/onboarding/architecture/apply');
      await refreshCommercialData();
    } catch (error) {
      setCommercialError(
        error instanceof Error ? error.message : 'Não foi possível publicar a arquitetura.',
      );
    } finally {
      setIsUpdatingArchitecture(false);
    }
  }, [refreshCommercialData]);

  const regenerateArchitecture = useCallback(async (): Promise<void> => {
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
  }, [refreshCommercialData]);

  const createPage = useCallback(
    async (label: string, description: string): Promise<void> => {
      setIsUpdatingArchitecture(true);

      try {
        await postDiexOnboardingRoute('/rest/diex/onboarding/pages', {
          action: 'CREATE',
          label,
          description,
          aiGenerated: false,
        });
        await refreshCommercialData();
      } catch (error) {
        setCommercialError(
          error instanceof Error
            ? error.message
            : 'Não foi possível criar a página operacional.',
        );
      } finally {
        setIsUpdatingArchitecture(false);
      }
    },
    [refreshCommercialData],
  );

  const archivePage = useCallback(
    async (key: string): Promise<void> => {
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
    [refreshCommercialData],
  );

  const restorePage = useCallback(
    async (key: string): Promise<void> => {
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
    [refreshCommercialData],
  );

  const togglePageNavigation = useCallback(
    async (page: NonNullable<DiexArchitectureState['pageCatalog']>['items'][number]): Promise<void> => {
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
    [refreshCommercialData],
  );

  const updatePage = useCallback(
    async (page: DiexPageUpdateInput): Promise<void> => {
      setIsUpdatingArchitecture(true);

      try {
        await postDiexOnboardingRoute('/rest/diex/onboarding/pages', {
          action: 'UPDATE',
          ...page,
        });
        await refreshCommercialData();
      } catch (error) {
        setCommercialError(
          error instanceof Error
            ? error.message
            : 'Não foi possível adaptar a página operacional.',
        );
      } finally {
        setIsUpdatingArchitecture(false);
      }
    },
    [refreshCommercialData],
  );

  const setCommercialGoal = useCallback(
    async (goal: string): Promise<void> => {
      setIsSavingGoal(true);

      try {
        await postDiexOnboardingRoute('/rest/diex/onboarding/goal', { goal });
        await refreshCommercialData();
      } catch (error) {
        setCommercialError(
          error instanceof Error ? error.message : 'Não foi possível salvar o objetivo comercial.',
        );
      } finally {
        setIsSavingGoal(false);
      }
    },
    [refreshCommercialData],
  );

  const executeFirstCommercialFlow = useCallback(
    async (): Promise<DiexFirstCommercialFlowResult> => {
      setIsExecutingFirstFlow(true);

      try {
        const result = await postDiexOnboardingRoute<DiexFirstCommercialFlowResult>(
          '/rest/diex/onboarding/first-commercial-flow',
        );
        await Promise.all([refetchDataFlow(), refreshCommercialData()]);

        return result;
      } finally {
        setIsExecutingFirstFlow(false);
      }
    },
    [refetchDataFlow, refreshCommercialData],
  );

  const completeCommercialOnboarding = useCallback(async (): Promise<void> => {
    await postDiexOnboardingRoute('/rest/diex/onboarding/complete');
  }, []);

  return {
    workspaceContext,
    workspaceContextReadState,
    dataFlow,
    readiness,
    architecture,
    isLoadingCommercialData,
    isUpdatingArchitecture,
    isSavingGoal,
    isExecutingFirstFlow,
    commercialError,
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
    executeFirstCommercialFlow,
    completeCommercialOnboarding,
    requestConnection,
    createWorkspaceContext,
    saveWorkspaceContext,
    activateWorkspaceContext,
  };
};
