import { useLingui } from '@lingui/react/macro';
import { IconLayoutSidebarRightCollapse } from 'diex-ui/icon';
import { IconButton } from 'diex-ui/input';

import { useReturnFromExpandedAiChat } from '@/ai/hooks/useReturnFromExpandedAiChat';
import { isWelcomeAnimationVisibleState } from '@/onboarding/states/isWelcomeAnimationVisibleState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const AiChatCollapseButton = () => {
  const { t } = useLingui();
  const returnFromExpandedAiChat = useReturnFromExpandedAiChat({
    reopenSidePanel: true,
  });
  const isWelcomeAnimationVisible = useAtomStateValue(
    isWelcomeAnimationVisibleState,
  );

  return (
    <IconButton
      Icon={IconLayoutSidebarRightCollapse}
      size="small"
      variant="tertiary"
      disabled={isWelcomeAnimationVisible}
      onClick={returnFromExpandedAiChat}
      ariaLabel={t`Collapse to side panel`}
    />
  );
};
