import { type CodeExecutionData } from 'diex-shared/ai';

export type CodeExecutionStreamEmitter = (data: CodeExecutionData) => void;
