import { isArray } from '@sniptt/guards';
import { type WorkflowRunStepInfo } from 'diex-shared/workflow';

export const getWorkflowRunAllStepInfoHistory = ({
  stepInfo,
}: {
  stepInfo: WorkflowRunStepInfo;
}) => {
  const allStepInfoHistory: WorkflowRunStepInfo[] = [
    ...(isArray(stepInfo?.history) ? stepInfo.history : []),
    stepInfo,
  ];

  return allStepInfoHistory;
};
