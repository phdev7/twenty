import { type Keys } from 'react-hotkeys-hook/dist/types';
import { useNavigate } from 'react-router-dom';

import { useGlobalHotkeysSequence } from '@/ui/utilities/hotkey/hooks/useGlobalHotkeysSequence';

type GoToHotkeysProps = {
  key: Keys;
  location: string;
  preNavigateFunction?: () => void;
};

export const useGoToHotkeys = ({
  key,
  location,
  preNavigateFunction,
}: GoToHotkeysProps) => {
  const navigate = useNavigate();

  useGlobalHotkeysSequence(
    'g',
    key,
    () => {
      preNavigateFunction?.();
      navigate(location);
    },
    {
      // Keep the listener mounted so the global callback can clear a stale
      // sequence while the user is typing. The callback never consumes text.
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
    },
    [navigate],
  );
};
