export type WorkspaceTemplateKind =
  | 'BASE'
  | 'BUSINESS_MODEL'
  | 'CAPABILITY'
  | 'SCALE';

export type WorkspaceTemplateComponent = {
  key: string;
  label: string;
  description: string;
  required: boolean;
  benefit: string;
  configuration?: Record<string, unknown>;
};

export type WorkspaceTemplateDefinition = {
  id: string;
  name: string;
  version: string;
  description: string;
  kind: WorkspaceTemplateKind;
  activationCriteria: string[];
  compatibleSegments: string[];
  prerequisites: string[];
  objects: WorkspaceTemplateComponent[];
  fields: WorkspaceTemplateComponent[];
  relations: WorkspaceTemplateComponent[];
  views: WorkspaceTemplateComponent[];
  pipelines: WorkspaceTemplateComponent[];
  operationalRules: string[];
  pages: WorkspaceTemplateComponent[];
  blocks: WorkspaceTemplateComponent[];
  dashboards: WorkspaceTemplateComponent[];
  metrics: string[];
  filters: string[];
  automations: WorkspaceTemplateComponent[];
  roles: WorkspaceTemplateComponent[];
  permissions: string[];
  integrations: WorkspaceTemplateComponent[];
  glossary: Record<string, string>;
  aiInstructions: string[];
  forbiddenRules: string[];
  readinessCriteria: string[];
  dependencies: string[];
  conflicts: string[];
  updateStrategy: string;
  rollbackStrategy: string;
};
