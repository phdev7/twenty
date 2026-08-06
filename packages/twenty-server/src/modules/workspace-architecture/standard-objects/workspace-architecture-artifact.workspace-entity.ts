import { type RichTextMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import {
  type WorkspaceArchitectureArtifactStatus,
  type WorkspaceArchitectureArtifactType,
} from 'src/modules/workspace-architecture/standard-objects/workspace-architecture-artifact.standard-object-definition';

export class WorkspaceArchitectureArtifactWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  artifactKey: string;
  artifactType: WorkspaceArchitectureArtifactType;
  status: WorkspaceArchitectureArtifactStatus;
  schemaVersion: string;
  version: number;
  parentVersion: number | null;
  sourceDescription: RichTextMetadata | null;
  payload: Record<string, unknown>;
  summary: RichTextMetadata | null;
  templateVersions: Record<string, string> | null;
  idempotencyKey: string | null;
  approvedAt: Date | null;
  appliedAt: Date | null;
  completedAt: Date | null;
  errorDetails: RichTextMetadata | null;
  modelId: string | null;
  promptVersion: string | null;
  datasetVersion: string | null;
  estimatedCostCents: number | null;
  actualCostCents: number | null;
}
