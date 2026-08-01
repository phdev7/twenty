import { useCallback, useState } from 'react';

import { type WorkspaceContextRecord } from '@/diex-onboarding/types/diexOnboardingTypes';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

// Rich text resolves to an object, so every one of these must be selected as
// { markdown } — asking for the scalar returns null and makes a filled record
// look empty, which is the exact failure this page exists to reveal.
const richText = { markdown: true };

const workspaceContextGqlFields = {
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
};

export const useDiexWorkspaceContext = () => {
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();

  const {
    records: workspaceContexts,
    loading: isLoading,
    refetch,
  } = useFindManyRecords<WorkspaceContextRecord & { __typename: string }>({
    objectNameSingular: 'diexWorkspaceContext',
    orderBy: [{ createdAt: 'AscNullsLast' }],
    limit: 1,
    recordGqlFields: workspaceContextGqlFields,
    fetchPolicy: 'cache-and-network',
  });
  const { createOneRecord, loading: isCreatingContext } = useCreateOneRecord({
    objectNameSingular: 'diexWorkspaceContext',
    recordGqlFields: workspaceContextGqlFields,
  });
  const { updateOneRecord } = useUpdateOneRecord();
  const [isActivatingContext, setIsActivatingContext] = useState(false);

  const workspaceContext = workspaceContexts[0] ?? null;

  const createWorkspaceContext = useCallback(async (): Promise<void> => {
    try {
      const created = await createOneRecord({ name: 'Contexto comercial' });

      if (!created?.id) {
        throw new Error('O contexto não foi criado.');
      }

      await refetch();
      enqueueSuccessSnackBar({
        message: 'Contexto criado. Preencha os campos para orientar a IA.',
      });
    } catch {
      enqueueErrorSnackBar({
        message: 'Não foi possível criar o contexto comercial.',
      });
    }
  }, [createOneRecord, enqueueErrorSnackBar, enqueueSuccessSnackBar, refetch]);

  // A context sitting in DRAFT is invisible to every agent, so filling the
  // fields is only half the step: this is the switch that puts it in front of
  // the AI.
  const activateWorkspaceContext = useCallback(async (): Promise<void> => {
    if (workspaceContext === null) {
      return;
    }

    setIsActivatingContext(true);

    try {
      await updateOneRecord({
        objectNameSingular: 'diexWorkspaceContext',
        idToUpdate: workspaceContext.id,
        updateOneRecordInput: {
          status: 'ACTIVE',
          reviewedAt: new Date().toISOString(),
        },
      });

      await refetch();
      enqueueSuccessSnackBar({
        message: 'Contexto ativo. A IA já responde com a voz da sua empresa.',
      });
    } catch {
      enqueueErrorSnackBar({
        message: 'Não foi possível ativar o contexto comercial.',
      });
    } finally {
      setIsActivatingContext(false);
    }
  }, [
    enqueueErrorSnackBar,
    enqueueSuccessSnackBar,
    refetch,
    updateOneRecord,
    workspaceContext,
  ]);

  return {
    workspaceContext,
    isLoadingWorkspaceContext: isLoading,
    isCreatingContext,
    isActivatingContext,
    refetchWorkspaceContext: refetch,
    createWorkspaceContext,
    activateWorkspaceContext,
  };
};
