import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Injectable()
@EventSubscriber()
export class DiexAgencySubscriber implements EntitySubscriberInterface<WorkspaceEntity> {
  private readonly logger = new Logger(DiexAgencySubscriber.name);

  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return WorkspaceEntity;
  }

  // No webhook is dispatched here. The previous log claimed to be sending a
  // provisioning payload to n8n/Make while nothing left the process, so an
  // operator reading the log would conclude the integration had run.
  async afterInsert(event: InsertEvent<WorkspaceEntity>) {
    const workspace = event.entity;

    if (!workspace.managedByAgencyId) {
      return;
    }

    this.logger.log(
      `Workspace ${workspace.id} ("${workspace.displayName}") created under agency ${workspace.managedByAgencyId}. ` +
        'No provisioning webhook is wired yet.',
    );
  }
}
