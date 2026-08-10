import { useGenerateDepthRecordGqlFieldsFromObject } from '@/object-record/graphql/record-gql-fields/hooks/useGenerateDepthRecordGqlFieldsFromObject';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { type WorkflowRun } from '@/workflow/types/Workflow';
import { useMemo } from 'react';
import { CoreObjectNameSingular } from 'diex-shared/types';
import { isDefined } from 'diex-shared/utils';
import { workflowRunSchema } from 'diex-shared/workflow';

export const useWorkflowRun = ({
  workflowRunId,
}: {
  workflowRunId: string;
}): WorkflowRun | undefined => {
  const { recordGqlFields: defaultRecordGqlFields } =
    useGenerateDepthRecordGqlFieldsFromObject({
      objectNameSingular: CoreObjectNameSingular.WorkflowRun,
      depth: 1,
    });

  const recordGqlFields = useMemo(() => {
    const { stepLogs: _omit, ...rest } = defaultRecordGqlFields;

    return rest;
  }, [defaultRecordGqlFields]);

  const { record: rawRecord } = useFindOneRecord({
    objectNameSingular: CoreObjectNameSingular.WorkflowRun,
    objectRecordId: workflowRunId,
    recordGqlFields,
  });

  const {
    success,
    data: record,
    error,
  } = useMemo(() => workflowRunSchema.safeParse(rawRecord), [rawRecord]);

  if (!isDefined(rawRecord)) {
    return undefined;
  }

  if (!success) {
    throw error;
  }

  return record;
};
