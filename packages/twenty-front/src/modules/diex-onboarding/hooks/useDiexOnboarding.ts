import { useDiexOnboardingDataFlow } from '@/diex-onboarding/hooks/useDiexOnboardingDataFlow';
import { useDiexOnboardingWhatsappConnection } from '@/diex-onboarding/hooks/useDiexOnboardingWhatsappConnection';
import { useDiexWorkspaceContext } from '@/diex-onboarding/hooks/useDiexWorkspaceContext';

export const useDiexOnboarding = () => {
  const { dataFlow, refetchDataFlow } = useDiexOnboardingDataFlow();
  const {
    workspaceContext,
    isLoadingWorkspaceContext,
    isCreatingContext,
    isActivatingContext,
    refetchWorkspaceContext,
    createWorkspaceContext,
    activateWorkspaceContext,
  } = useDiexWorkspaceContext();
  const { connection, errorMessage, isConnecting, requestConnection } =
    useDiexOnboardingWhatsappConnection({
      // Messages only start arriving once the scan lands, so the data-flow step
      // is stale until then.
      onConnected: () => void refetchDataFlow(),
    });

  const load = async (): Promise<void> => {
    await Promise.all([refetchWorkspaceContext(), refetchDataFlow()]);
  };

  return {
    workspaceContext,
    dataFlow,
    connection,
    errorMessage,
    isLoading: isLoadingWorkspaceContext,
    isConnecting,
    isCreatingContext,
    isActivatingContext,
    load,
    requestConnection,
    createWorkspaceContext,
    activateWorkspaceContext,
  };
};
