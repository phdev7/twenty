import { z } from 'zod';

import { isDefined } from 'diex-shared/utils';

import { type GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

const schema = z.object({
  taskId: z.string().uuid(),
  dueAt: z
    .string()
    .describe('Data e hora da tarefa, ISO 8601. Use null para desagendar.')
    .nullable(),
  assigneeId: z.string().uuid().optional(),
});

export const createScheduleDiexTaskTool = (
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  workspaceId: string,
) => ({
  name: 'schedule_diex_task' as const,
  description:
    'Agenda ou reagenda uma tarefa para uma data e hora, opcionalmente trocando o responsável. Desagenda quando dueAt é null.',
  inputSchema: schema,
  execute: async (parameters: z.infer<typeof schema>) => {
    const dueAt = parameters.dueAt === null ? null : new Date(parameters.dueAt);

    if (dueAt !== null && Number.isNaN(dueAt.getTime())) {
      return { scheduled: false, reason: 'dueAt inválido: use ISO 8601.' };
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const taskRepository =
        await globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
          workspaceId,
          TaskWorkspaceEntity,
          { shouldBypassPermissionChecks: true },
        );

      const task = await taskRepository.findOne({
        where: { id: parameters.taskId },
      });

      if (!isDefined(task)) {
        return { scheduled: false, reason: 'Tarefa não encontrada.' };
      }

      // A dangling assigneeId would drop the task out of every per-user
      // agenda without any error surfacing, so the member is verified first.
      if (parameters.assigneeId !== undefined) {
        const memberRepository =
          await globalWorkspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
            workspaceId,
            WorkspaceMemberWorkspaceEntity,
            { shouldBypassPermissionChecks: true },
          );
        const member = await memberRepository.findOne({
          where: { id: parameters.assigneeId },
        });

        if (!isDefined(member)) {
          return {
            scheduled: false,
            reason: 'Responsável não encontrado neste workspace.',
          };
        }
      }

      await taskRepository.update(parameters.taskId, {
        dueAt,
        ...(parameters.assigneeId !== undefined
          ? { assigneeId: parameters.assigneeId }
          : {}),
      });

      return {
        scheduled: true,
        taskId: parameters.taskId,
        previousDueAt: task.dueAt?.toISOString() ?? null,
        dueAt: dueAt?.toISOString() ?? null,
        assigneeId: parameters.assigneeId ?? task.assigneeId,
      };
    }, authContext);
  },
});
