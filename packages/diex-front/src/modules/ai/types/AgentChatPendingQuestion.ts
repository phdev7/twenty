import { type AskQuestionItem } from 'diex-shared/ai';

export type AgentChatPendingQuestion = {
  messageId: string;
  toolCallId: string;
  questions: AskQuestionItem[];
};
