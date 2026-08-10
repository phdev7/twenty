import { InjectRepository } from '@nestjs/typeorm';

import { Command } from 'nest-commander';
import { Repository } from 'typeorm';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { normalizeDiexBrandText } from 'src/constants/diex-brand-policy.const';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { AgentEntity } from 'src/engine/metadata-modules/ai/ai-agent/entities/agent.entity';
import { SkillEntity } from 'src/engine/metadata-modules/skill/entities/skill.entity';
import { WorkspaceMigrationRunnerService } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/services/workspace-migration-runner.service';

@RegisteredWorkspaceCommand('2.26.0', 1786100000000)
@Command({
  name: 'upgrade:2-26:sync-diex-ai-brand',
  description:
    'Normalize the current Diex identity in standard AI agents and skills without changing technical names or custom metadata.',
})
export class SyncDiexAiBrandCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    @InjectRepository(AgentEntity)
    private readonly agentRepository: Repository<AgentEntity>,
    @InjectRepository(SkillEntity)
    private readonly skillRepository: Repository<SkillEntity>,
    private readonly workspaceMigrationRunnerService: WorkspaceMigrationRunnerService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;
    const agents = await this.agentRepository.find({
      where: { workspaceId, isCustom: false },
    });
    const skills = await this.skillRepository.find({
      where: { workspaceId, isCustom: false },
    });

    const agentUpdates = agents.flatMap((agent) => {
      const update = {
        label: normalizeDiexBrandText(agent.label),
        description: agent.description
          ? normalizeDiexBrandText(agent.description)
          : agent.description,
        prompt: normalizeDiexBrandText(agent.prompt),
      };

      return (
        update.label !== agent.label ||
        update.description !== agent.description ||
        update.prompt !== agent.prompt
      )
        ? [{ id: agent.id, update }]
        : [];
    });

    const skillUpdates = skills.flatMap((skill) => {
      const update = {
        label: normalizeDiexBrandText(skill.label),
        description: skill.description
          ? normalizeDiexBrandText(skill.description)
          : skill.description,
        content: normalizeDiexBrandText(skill.content),
      };

      return (
        update.label !== skill.label ||
        update.description !== skill.description ||
        update.content !== skill.content
      )
        ? [{ id: skill.id, update }]
        : [];
    });

    const totalUpdates = agentUpdates.length + skillUpdates.length;

    this.logger.log(
      `${isDryRun ? '[DRY RUN] ' : ''}Found ${totalUpdates} standard AI metadata record(s) to normalize for workspace ${workspaceId}`,
    );

    if (isDryRun || totalUpdates === 0) {
      return;
    }

    for (const { id, update } of agentUpdates) {
      await this.agentRepository.update({ id, workspaceId }, update);
    }

    for (const { id, update } of skillUpdates) {
      await this.skillRepository.update({ id, workspaceId }, update);
    }

    await this.workspaceMigrationRunnerService.invalidateCache({
      allFlatEntityMapsKeys: ['flatAgentMaps', 'flatSkillMaps'],
      workspaceId,
    });
  }
}
