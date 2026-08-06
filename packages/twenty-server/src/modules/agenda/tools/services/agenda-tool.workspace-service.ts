import { Injectable } from '@nestjs/common';

import { type ToolSet } from 'ai';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { createListDiexAgendaTool } from 'src/modules/agenda/tools/list-diex-agenda.tool';
import { createScheduleDiexTaskTool } from 'src/modules/agenda/tools/schedule-diex-task.tool';

@Injectable()
export class AgendaToolWorkspaceService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  generateAgendaTools(workspaceId: string): ToolSet {
    const listTool = createListDiexAgendaTool(
      this.globalWorkspaceOrmManager,
      workspaceId,
    );
    const scheduleTool = createScheduleDiexTaskTool(
      this.globalWorkspaceOrmManager,
      workspaceId,
    );

    return { [listTool.name]: listTool, [scheduleTool.name]: scheduleTool };
  }
}
