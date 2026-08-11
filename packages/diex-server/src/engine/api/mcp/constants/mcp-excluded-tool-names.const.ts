import { OUTPUT_NAVIGATION_TOOL_NAMES } from 'src/engine/core-modules/tool/tools/output-navigation-tool/constants/output-navigation-tool-names.constant';
import { AI_GOVERNED_METADATA_MUTATION_TOOL_NAMES } from 'src/engine/core-modules/tool-provider/constants/ai-governed-metadata-mutation-tool-names.constant';

export const MCP_EXCLUDED_TOOL_NAMES = new Set([
  'code_interpreter',
  'http_request',
  ...AI_GOVERNED_METADATA_MUTATION_TOOL_NAMES,
  ...OUTPUT_NAVIGATION_TOOL_NAMES,
]);
