// Injection token for WorkspaceApprovalToolService to break a circular
// dependency: ToolProviderModule -> WorkspaceApprovalModule -> WorkspaceModule
// -> AiAgentModule -> AiAgentExecutionModule -> ToolProviderModule.
// WorkspaceApprovalModule is @Global() so the token resolves without the import.
export const WORKSPACE_APPROVAL_TOOL_SERVICE_TOKEN = Symbol(
  'WORKSPACE_APPROVAL_TOOL_SERVICE_TOKEN',
);
