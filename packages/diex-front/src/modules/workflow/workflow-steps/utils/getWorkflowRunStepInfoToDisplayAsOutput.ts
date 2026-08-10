import { type WorkflowRunStepInfo } from 'diex-shared/workflow';

export const getWorkflowRunStepInfoToDisplayAsOutput = ({
  stepInfo,
}: {
  stepInfo: WorkflowRunStepInfo;
}) => {
  const { status: _status, history: _history, ...infoToDisplay } = stepInfo;

  return infoToDisplay;
};
