import { useCallback, useState } from 'react';

import {
  type ContextFieldKey,
  type WorkspaceContextReadState,
  type WorkspaceContextDraft,
  type WorkspaceContextRecord,
} from '@/diex-onboarding/types/diexOnboardingTypes';
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
    error,
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
  const [isSavingContext, setIsSavingContext] = useState(false);
  const [preservedWorkspaceContext, setPreservedWorkspaceContext] =
    useState<WorkspaceContextRecord | null>(null);

  const workspaceContext =
    preservedWorkspaceContext ?? workspaceContexts[0] ?? null;
  const readState: WorkspaceContextReadState = error
    ? preservedWorkspaceContext
      ? 'RECONCILIATION_ERROR'
      : 'READ_ERROR'
    : isLoading && workspaceContext === null
      ? 'LOADING'
      : workspaceContext
        ? 'READY'
        : 'ABSENT';

  const createWorkspaceContext = useCallback(async (): Promise<void> => {
    if (readState !== 'ABSENT') {
      return;
    }

    let createdContext: WorkspaceContextRecord;

    try {
      const created = await createOneRecord({ name: 'Contexto comercial' });

      if (!created?.id) {
        throw new Error('O contexto não foi criado.');
      }

      createdContext = created as unknown as WorkspaceContextRecord;
      setPreservedWorkspaceContext(createdContext);
      enqueueSuccessSnackBar({
        message: 'Contexto criado. Preencha os campos para orientar a IA.',
      });
    } catch {
      enqueueErrorSnackBar({
        message: 'Não foi possível criar o contexto comercial.',
      });
      return;
    }

    try {
      await refetch();
      setPreservedWorkspaceContext(null);
    } catch {
      enqueueErrorSnackBar({
        message:
          'O contexto foi criado, mas a tela não conseguiu reconciliar a leitura. Atualize antes de tentar qualquer criação.',
      });
    }
  }, [
    createOneRecord,
    enqueueErrorSnackBar,
    enqueueSuccessSnackBar,
    readState,
    refetch,
  ]);

  const saveWorkspaceContext = useCallback(
    async (draft: WorkspaceContextDraft): Promise<void> => {
      if (workspaceContext === null) {
        return;
      }

      setIsSavingContext(true);
      const richTextFields = Object.fromEntries(
        Object.entries(draft).map(([key, markdown]) => [key, { markdown }]),
      ) as Record<ContextFieldKey, { markdown: string }>;

      try {
        await updateOneRecord({
          objectNameSingular: 'diexWorkspaceContext',
          idToUpdate: workspaceContext.id,
          updateOneRecordInput: richTextFields,
        });
        setPreservedWorkspaceContext({
          ...workspaceContext,
          ...richTextFields,
        });
        enqueueSuccessSnackBar({ message: 'Contexto comercial salvo.' });

        try {
          await refetch();
          setPreservedWorkspaceContext(null);
        } catch {
          enqueueErrorSnackBar({
            message:
              'O contexto foi salvo, mas a tela não conseguiu reconciliar a leitura.',
          });
        }
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível salvar o contexto comercial.',
        });
      } finally {
        setIsSavingContext(false);
      }
    },
    [
      enqueueErrorSnackBar,
      enqueueSuccessSnackBar,
      refetch,
      updateOneRecord,
      workspaceContext,
    ],
  );

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

      setPreservedWorkspaceContext((current) =>
        (current ?? workspaceContext).id === workspaceContext.id
          ? {
              ...(current ?? workspaceContext),
              status: 'ACTIVE',
              reviewedAt: new Date().toISOString(),
            }
          : current,
      );
      enqueueSuccessSnackBar({
        message: 'Contexto ativo. A IA já responde com a voz da sua empresa.',
      });

      try {
        await refetch();
        setPreservedWorkspaceContext(null);
      } catch {
        enqueueErrorSnackBar({
          message:
            'O contexto foi ativado, mas a tela não conseguiu reconciliar a leitura.',
        });
      }
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
    workspaceContextReadState: readState,
    isLoadingWorkspaceContext: isLoading,
    isCreatingContext,
    isSavingContext,
    isActivatingContext,
    refetchWorkspaceContext: refetch,
    createWorkspaceContext,
    saveWorkspaceContext,
    activateWorkspaceContext,
  };
};
