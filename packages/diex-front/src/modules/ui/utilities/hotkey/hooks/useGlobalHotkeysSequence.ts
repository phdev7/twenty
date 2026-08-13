import { type Options, useHotkeys } from 'react-hotkeys-hook';
import { type Keys } from 'react-hotkeys-hook/dist/types';
import { useEffect, useRef } from 'react';

import { pendingHotkeyState } from '@/ui/utilities/hotkey/states/internal/pendingHotkeysState';

import { useGlobalHotkeysCallback } from '@/ui/utilities/hotkey/hooks/useGlobalHotkeysCallback';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { isDefined } from 'diex-shared/utils';

const HOTKEY_SEQUENCE_TIMEOUT_MS = 900;

export const useGlobalHotkeysSequence = (
  firstKey: Keys,
  secondKey: Keys,
  sequenceCallback: () => void,
  options: Options = {
    enableOnContentEditable: true,
    enableOnFormTags: true,
    preventDefault: true,
  },
  deps: any[] = [],
) => {
  const [pendingHotkey, setPendingHotkey] = useAtomState(pendingHotkeyState);
  // Handle de timeout, não estado: mudar não deve renderizar.
  // oxlint-disable-next-line diex/no-state-useref
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const callGlobalHotkeysCallback = useGlobalHotkeysCallback();

  useEffect(
    () => () => {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    },
    [],
  );

  useHotkeys(
    firstKey,
    (keyboardEvent, hotkeysEvent) => {
      callGlobalHotkeysCallback({
        keyboardEvent,
        hotkeysEvent,
        containsModifier: false,
        callback: () => {
          setPendingHotkey(firstKey);

          if (sequenceTimeoutRef.current) {
            clearTimeout(sequenceTimeoutRef.current);
          }

          sequenceTimeoutRef.current = setTimeout(() => {
            setPendingHotkey(null);
            sequenceTimeoutRef.current = null;
          }, HOTKEY_SEQUENCE_TIMEOUT_MS);
        },
        preventDefault: Boolean(options.preventDefault),
      });
    },
    {
      enableOnContentEditable: options.enableOnContentEditable,
      enableOnFormTags: options.enableOnFormTags,
    },
    [setPendingHotkey],
  );

  useHotkeys(
    secondKey,
    (keyboardEvent, hotkeysEvent) => {
      callGlobalHotkeysCallback({
        keyboardEvent,
        hotkeysEvent,
        containsModifier: false,
        callback: () => {
          if (pendingHotkey !== firstKey) {
            return;
          }

          if (sequenceTimeoutRef.current) {
            clearTimeout(sequenceTimeoutRef.current);
            sequenceTimeoutRef.current = null;
          }

          setPendingHotkey(null);

          if (isDefined(options.preventDefault)) {
            keyboardEvent.stopImmediatePropagation();
            keyboardEvent.stopPropagation();
            keyboardEvent.preventDefault();
          }

          sequenceCallback();
        },
        preventDefault: false,
      });
    },
    {
      enableOnContentEditable: options.enableOnContentEditable,
      enableOnFormTags: options.enableOnFormTags,
    },
    [pendingHotkey, setPendingHotkey, ...deps],
  );
};
