import { z } from 'zod';

import { Between, IsNull, Not } from 'typeorm';

import { type GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';

const schema = z.object({
  assigneeId: z.string().uuid().optional(),
  from: z.string().describe('Início do intervalo, ISO 8601.'),
  to: z.string().describe('Fim do intervalo, ISO 8601.'),
  includeDone: z.boolean().optional(),
});

export const createListDiexAgendaTool = (
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  workspaceId: string,
) => ({
  name: 'list_diex_agenda' as const,
  description:
    'Lista a agenda de tarefas com data e hora num intervalo, opcionalmente de um responsável. Só retorna tarefas que têm dueAt: tarefa sem data não pertence a uma agenda.',
  inputSchema: schema,
  execute: async (parameters: z.infer<typeof schema>) => {
    const from = new Date(parameters.from);
    const to = new Date(parameters.to);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return { listed: false, reason: 'Datas inválidas: use ISO 8601.' };
    }

    if (from > to) {
      return {
        listed: false,
        reason: 'O início do intervalo é depois do fim.',
      };
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository =
        await globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
          workspaceId,
          TaskWorkspaceEntity,
          { shouldBypassPermissionChecks: true },
        );

      const tasks = await repository.find({
        where: {
          dueAt: Between(from, to),
          ...(parameters.assigneeId !== undefined
            ? { assigneeId: parameters.assigneeId }
            : { assigneeId: Not(IsNull()) }),
        },
        relations: { assignee: true },
        order: { dueAt: 'ASC' },
        take: 200,
      });

      const visible =
        parameters.includeDone === true
          ? tasks
          : tasks.filter((task) => task.status !== 'DONE');

      return {
        listed: true,
        from: from.toISOString(),
        to: to.toISOString(),
        count: visible.length,
        tasks: visible.map((task) => ({
          id: task.id,
          title: task.title,
          dueAt: task.dueAt?.toISOString() ?? null,
          status: task.status,
          assignee: task.assignee
            ? { id: task.assignee.id, name: task.assignee.name }
            : null,
        })),
      };
    }, authContext);
  },
});
