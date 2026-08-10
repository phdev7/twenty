import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const allowRequestsToDiexIconsState = createAtomState<boolean>({
  key: 'allowRequestsToDiexIcons',
  defaultValue: true,
});
