import { type OutputSchemaV2 } from '@/workflow/workflow-variables/types/StepOutputSchemaV2';
import { getOutputSchemaFromValue } from 'diex-shared/logic-function';
import { isEmptyObject, isPlainObject } from 'diex-shared/utils';
import { isBaseOutputSchemaV2 } from 'diex-shared/workflow';

const AI_AGENT_DEFAULT_OUTPUT_SCHEMA: OutputSchemaV2 = {
  response: {
    isLeaf: true,
    type: 'string',
    label: 'Response',
    value: null,
  },
};

export const resolvePersistedStepOutputSchema = ({
  stepType,
  settings,
}: {
  stepType: string;
  settings?:
    | { outputSchema?: unknown; expectedOutputSchema?: unknown }
    | null
    | undefined;
}): OutputSchemaV2 => {
  const outputSchema = settings?.outputSchema;

  if (isBaseOutputSchemaV2(outputSchema)) {
    return outputSchema;
  }

  const expectedOutputSchema = settings?.expectedOutputSchema;

  if (
    isPlainObject(expectedOutputSchema) &&
    !isEmptyObject(expectedOutputSchema)
  ) {
    return getOutputSchemaFromValue(expectedOutputSchema);
  }

  if (stepType === 'AI_AGENT') {
    return AI_AGENT_DEFAULT_OUTPUT_SCHEMA;
  }

  return {};
};
