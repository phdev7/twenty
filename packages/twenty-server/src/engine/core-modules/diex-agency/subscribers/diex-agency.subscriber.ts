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

  async afterInsert(event: InsertEvent<WorkspaceEntity>) {
    const workspace = event.entity;

    // Se o workspace não possui agência parceira (managedByAgencyId), ignoramos
    if (!workspace.managedByAgencyId) {
      return;
    }

    this.logger.log(
      `[ONBOARDING WEBHOOK DISPARADO] Novo workspace criado pela agência ${workspace.managedByAgencyId}. ` +
      `Workspace: ${workspace.displayName} (ID: ${workspace.id}). ` +
      `Enviando Payload para n8n/Make para provisionamento de e-mails, grupo no WhatsApp e faturamento...`,
    );
    
    // Aqui seria emitido o evento para a fila do BullMQ ou EventEmitter local, 
    // que seria interceptado pelo módulo de Webhooks nativos.
    // Exemplo: this.eventEmitter.emit('agency.workspace.created', workspace);
  }
}
