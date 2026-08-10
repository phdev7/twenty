import { Injectable } from '@nestjs/common';

import { type ToolSet } from 'ai';

import { AiGovernanceService } from 'src/modules/ai-governance/services/ai-governance.service';
import { createProposeAiActionTool } from 'src/modules/ai-governance/tools/propose-ai-action.tool';

@Injectable()
export class AiGovernanceToolWorkspaceService {
  constructor(private readonly aiGovernanceService: AiGovernanceService) {}

  generateAiGovernanceTools(workspaceId: string): ToolSet {
    const propose = createProposeAiActionTool(
      this.aiGovernanceService,
      workspaceId,
    );

    return { [propose.name]: propose };
  }
}
