import { useReactFlow } from '@xyflow/react';
import { useContext } from 'react';
import { isDefined } from 'diex-shared/utils';
import { ThemeContext } from 'diex-ui/theme-constants';
export const useWorkflowDiagramScreenToFlowPosition = () => {
  const { theme } = useContext(ThemeContext);
  const { screenToFlowPosition } = useReactFlow();

  const workflowDiagramScreenToFlowPosition = (position?: {
    x: number;
    y: number;
  }) => {
    if (!isDefined(position)) {
      return;
    }

    const visibleSidePanelWidth = Number(
      theme.sidePanelWidth.replace('px', ''),
    );

    const flowPosition = screenToFlowPosition(position);

    return {
      x: flowPosition.x + visibleSidePanelWidth / 2,
      y: flowPosition.y,
    };
  };

  return { workflowDiagramScreenToFlowPosition };
};
