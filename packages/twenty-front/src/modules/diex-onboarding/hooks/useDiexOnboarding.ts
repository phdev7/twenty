import { useCallback } from 'react';

import { useDiexOnboardingDataFlow } from '@/diex-onboarding/hooks/useDiexOnboardingDataFlow';
import { useDiexOnboardingWhatsappConnection } from '@/diex-onboarding/hooks/useDiexOnboardingWhatsappConnection';
import { useDiexWorkspaceContext } from '@/diex-onboarding/hooks/useDiexWorkspaceContext';

export const useDiexOnboarding = () => {
  const { dataFlow, refetchDataFlow } = useDiexOnboardingDataFlow();
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
  const handleWhatsappConnected = useCallback(() => {
    void refetchDataFlow();
  }, [refetchDataFlow]);
  const { connection, errorMessage, isConnecting, requestConnection } =
    useDiexOnboardingWhatsappConnection({
      onConnected: handleWhatsappConnected,
    });

  const load = async (): Promise<void> => {
    await Promise.all([refetchWorkspaceContext(), refetchDataFlow()]);
  };

  return {
    workspaceContext,
    workspaceContextReadState,
    dataFlow,
    connection,
    errorMessage,
    isLoading: isLoadingWorkspaceContext,
    isConnecting,
    isCreatingContext,
    isSavingContext,
    isActivatingContext,
    load,
    requestConnection,
    createWorkspaceContext,
    saveWorkspaceContext,
    activateWorkspaceContext,
  };
};
