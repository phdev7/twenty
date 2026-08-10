import { type WorkflowRunState } from '@/workflow/types/Workflow';
import { isDefined } from 'diex-shared/utils';
import { workflowRunStateSchema } from 'diex-shared/workflow';
import { type JsonValue } from 'type-fest';

export const orderWorkflowRunState = (value: JsonValue) => {
  const parsedValue = workflowRunStateSchema.safeParse(value);
  if (!parsedValue.success) {
    return null;
  }

  const orderedWorkflowRunState: WorkflowRunState = {
    ...(isDefined(parsedValue.data.workflowRunError)
      ? {
          workflowRunError: parsedValue.data.workflowRunError,
        }
      : {}),
    stepInfos: parsedValue.data.stepInfos,
    flow: parsedValue.data.flow,
  };

  return orderedWorkflowRunState;
};
