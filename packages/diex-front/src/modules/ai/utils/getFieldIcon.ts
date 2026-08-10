import { type AgentResponseFieldType } from 'diex-shared/ai';

export const getFieldIcon = (fieldType?: AgentResponseFieldType): string => {
  switch (fieldType) {
    case 'string':
      return 'IconAbc';
    case 'number':
      return 'IconText';
    case 'boolean':
      return 'IconCheckbox';
    default:
      return 'IconQuestionMark';
  }
};
