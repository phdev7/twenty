import { type RichTextMetadata } from 'diex-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/diex-orm/base.workspace-entity';

export class DiexAccessRequestWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  status: string | null;
  contactName: string | null;
  email: string | null;
  whatsapp: string | null;
  teamSize: string | null;
  desiredSubdomain: string | null;
  goal: string | null;
  requestedAt: Date | null;
  submissionCount: number | null;
  reviewedAt: Date | null;
  reviewNotes: RichTextMetadata | null;
  provisionedSubdomain: string | null;
}
