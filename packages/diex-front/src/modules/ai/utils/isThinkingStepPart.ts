import { isToolUIPart } from 'ai';
import { type ExtendedUIMessagePart } from 'diex-shared/ai';

import { type ThinkingStepPart } from '@/ai/utils/thinkingStepPart';

export const isThinkingStepPart = (
  part: ExtendedUIMessagePart,
): part is ThinkingStepPart => {
  if (part.type === 'reasoning') {
    return true;
  }

  return isToolUIPart(part);
};
