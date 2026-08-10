import { type BaseOutputSchemaV2 } from 'diex-shared/workflow';

export type AgentResponseFormat =
  | { type: 'text' }
  | {
      type: 'json';
      schema: BaseOutputSchemaV2;
    };
