import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RecordCrudModule } from 'src/engine/core-modules/record-crud/record-crud.module';
import { TOOL_PROVIDERS } from 'src/engine/core-modules/tool-provider/constants/tool-providers.token';
import { ActionToolProvider } from 'src/engine/core-modules/tool-provider/providers/action-tool.provider';
import { AgendaToolProvider } from 'src/engine/core-modules/tool-provider/providers/agenda-tool.provider';
import { AiGovernanceToolProvider } from 'src/engine/core-modules/tool-provider/providers/ai-governance-tool.provider';
import { CommercialIntelligenceToolProvider } from 'src/engine/core-modules/tool-provider/providers/commercial-intelligence-tool.provider';
import { CustomerSuccessToolProvider } from 'src/engine/core-modules/tool-provider/providers/customer-success-tool.provider';
import { DiexBadgeToolProvider } from 'src/engine/core-modules/tool-provider/providers/diex-badge-tool.provider';
import { DiexWorkspaceApprovalToolProvider } from 'src/engine/core-modules/tool-provider/providers/diex-workspace-approval-tool.provider';
import { DiexFormsToolProvider } from 'src/engine/core-modules/tool-provider/providers/diex-forms-tool.provider';
import { InboxToolProvider } from 'src/engine/core-modules/tool-provider/providers/inbox-tool.provider';
import { RenewalToolProvider } from 'src/engine/core-modules/tool-provider/providers/renewal-tool.provider';
import { MeetingsToolProvider } from 'src/engine/core-modules/tool-provider/providers/meetings-tool.provider';
import { DashboardToolProvider } from 'src/engine/core-modules/tool-provider/providers/dashboard-tool.provider';
import { DatabaseToolProvider } from 'src/engine/core-modules/tool-provider/providers/database-tool.provider';
import { LogicFunctionToolProvider } from 'src/engine/core-modules/tool-provider/providers/logic-function-tool.provider';
import { MetadataToolProvider } from 'src/engine/core-modules/tool-provider/providers/metadata-tool.provider';
import { NavigationMenuItemToolProvider } from 'src/engine/core-modules/tool-provider/providers/navigation-menu-item-tool.provider';
import { ViewToolProvider } from 'src/engine/core-modules/tool-provider/providers/view-tool.provider';
import { WebhookToolProvider } from 'src/engine/core-modules/tool-provider/providers/webhook-tool.provider';
import { WorkflowToolProvider } from 'src/engine/core-modules/tool-provider/providers/workflow-tool.provider';
import { WorkspaceContextToolProvider } from 'src/engine/core-modules/tool-provider/providers/workspace-context-tool.provider';
import { WorkspaceArchitectureToolProvider } from 'src/engine/core-modules/tool-provider/providers/workspace-architecture-tool.provider';
import { ToolExecutorService } from 'src/engine/core-modules/tool-provider/services/tool-executor.service';
import { ToolModule } from 'src/engine/core-modules/tool/tool.module';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { AiAgentExecutionModule } from 'src/engine/metadata-modules/ai/ai-agent-execution/ai-agent-execution.module';
import { AiModelsModule } from 'src/engine/metadata-modules/ai/ai-models/ai-models.module';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { LogicFunctionModule } from 'src/engine/metadata-modules/logic-function/logic-function.module';
import { NavigationMenuItemModule } from 'src/engine/metadata-modules/navigation-menu-item/navigation-menu-item.module';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { UserRoleModule } from 'src/engine/metadata-modules/user-role/user-role.module';
import { ViewFieldModule } from 'src/engine/metadata-modules/view-field/view-field.module';
import { ViewFilterModule } from 'src/engine/metadata-modules/view-filter/view-filter.module';
import { ViewSortModule } from 'src/engine/metadata-modules/view-sort/view-sort.module';
import { ViewModule } from 'src/engine/metadata-modules/view/view.module';
import { WebhookModule } from 'src/engine/metadata-modules/webhook/webhook.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { CommercialIntelligenceModule } from 'src/modules/commercial-intelligence/commercial-intelligence.module';
import { CustomerSuccessModule } from 'src/modules/customer-success/customer-success.module';
import { DiexToolsModule } from 'src/modules/diex/tools/diex-tools.module';
import { InboxModule } from 'src/modules/inbox/inbox.module';
import { DiexFormsModule } from 'src/engine/core-modules/diex-forms/diex-forms.module';
import { RenewalModule } from 'src/modules/renewal/renewal.module';
import { MeetingsModule } from 'src/modules/meetings/meetings.module';
import { AgendaModule } from 'src/modules/agenda/agenda.module';
import { AiGovernanceModule } from 'src/modules/ai-governance/ai-governance.module';
import { WorkspaceContextModule } from 'src/modules/workspace-context/workspace-context.module';
import { WorkspaceArchitectureModule } from 'src/modules/workspace-architecture/workspace-architecture.module';

import { ToolIndexResolver } from './resolvers/tool-index.resolver';
import { ToolRegistryService } from './services/tool-registry.service';

// NOTE: This module does NOT import WorkflowToolsModule or DashboardToolsModule
// directly: their service graphs transitively reach AiAgentExecutionModule which
// forwardRef's back into ToolProviderModule. Those two @Global() modules provide
// a service token that their respective providers consume via @Optional()
// @Inject, breaking the cycle.
//
// Webhook and NavigationMenuItem do NOT have that cycle, so we import their
// entity modules directly and the providers inject the services the normal way
// (same pattern as views/objects/metadata).

@Module({
  imports: [
    ToolModule,
    RecordCrudModule,
    AiModelsModule,
    forwardRef(() => AiAgentExecutionModule),
    ObjectMetadataModule,
    FieldMetadataModule,
    PermissionsModule,
    ViewModule,
    ViewFieldModule,
    ViewFilterModule,
    ViewSortModule,
    WorkspaceCacheModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
    LogicFunctionModule,
    NavigationMenuItemModule,
    WebhookModule,
    UserRoleModule,
    WorkspaceContextModule,
    WorkspaceArchitectureModule,
    CommercialIntelligenceModule,
    CustomerSuccessModule,
    AgendaModule,
    AiGovernanceModule,
    RenewalModule,
    MeetingsModule,
    DiexToolsModule,
    InboxModule,
    DiexFormsModule,
    TypeOrmModule.forFeature([UserEntity]),
  ],
  providers: [
    ToolIndexResolver,
    ToolExecutorService,
    ActionToolProvider,
    DashboardToolProvider,
    DatabaseToolProvider,
    MetadataToolProvider,
    NavigationMenuItemToolProvider,
    LogicFunctionToolProvider,
    ViewToolProvider,
    WebhookToolProvider,
    WorkflowToolProvider,
    WorkspaceContextToolProvider,
    WorkspaceArchitectureToolProvider,
    CommercialIntelligenceToolProvider,
    CustomerSuccessToolProvider,
    AgendaToolProvider,
    AiGovernanceToolProvider,
    DiexBadgeToolProvider,
    DiexWorkspaceApprovalToolProvider,
    InboxToolProvider,
    RenewalToolProvider,
    MeetingsToolProvider,
    DiexFormsToolProvider,
    {
      // TOOL_PROVIDERS contains only providers implementing ToolProvider
      // (registry tools with descriptors). The native tool binder is a
      // parallel concept and is exported for surfaces that bind SDK-native
      // tools directly into their model ToolSet.
      provide: TOOL_PROVIDERS,
      useFactory: (
        actionProvider: ActionToolProvider,
        databaseProvider: DatabaseToolProvider,
        metadataProvider: MetadataToolProvider,
        logicFunctionProvider: LogicFunctionToolProvider,
        navigationMenuItemProvider: NavigationMenuItemToolProvider,
        viewProvider: ViewToolProvider,
        webhookProvider: WebhookToolProvider,
        workflowProvider: WorkflowToolProvider,
        dashboardProvider: DashboardToolProvider,
        workspaceContextProvider: WorkspaceContextToolProvider,
        workspaceArchitectureProvider: WorkspaceArchitectureToolProvider,
        commercialIntelligenceProvider: CommercialIntelligenceToolProvider,
        customerSuccessProvider: CustomerSuccessToolProvider,
        agendaProvider: AgendaToolProvider,
        aiGovernanceProvider: AiGovernanceToolProvider,
        renewalProvider: RenewalToolProvider,
        meetingsProvider: MeetingsToolProvider,
        diexBadgeProvider: DiexBadgeToolProvider,
        diexWorkspaceApprovalProvider: DiexWorkspaceApprovalToolProvider,
        inboxProvider: InboxToolProvider,
        diexFormsProvider: DiexFormsToolProvider,
      ) => [
        actionProvider,
        databaseProvider,
        metadataProvider,
        logicFunctionProvider,
        navigationMenuItemProvider,
        viewProvider,
        webhookProvider,
        workflowProvider,
        dashboardProvider,
        workspaceContextProvider,
        workspaceArchitectureProvider,
        commercialIntelligenceProvider,
        customerSuccessProvider,
        agendaProvider,
        aiGovernanceProvider,
        renewalProvider,
        meetingsProvider,
        diexBadgeProvider,
        diexWorkspaceApprovalProvider,
        inboxProvider,
        diexFormsProvider,
      ],
      inject: [
        ActionToolProvider,
        DatabaseToolProvider,
        MetadataToolProvider,
        LogicFunctionToolProvider,
        NavigationMenuItemToolProvider,
        ViewToolProvider,
        WebhookToolProvider,
        WorkflowToolProvider,
        DashboardToolProvider,
        WorkspaceContextToolProvider,
        WorkspaceArchitectureToolProvider,
        CommercialIntelligenceToolProvider,
        CustomerSuccessToolProvider,
        AgendaToolProvider,
        AiGovernanceToolProvider,
        RenewalToolProvider,
        MeetingsToolProvider,
        DiexBadgeToolProvider,
        DiexWorkspaceApprovalToolProvider,
        InboxToolProvider,
        DiexFormsToolProvider,
      ],
    },
    ToolRegistryService,
  ],
  exports: [ToolRegistryService],
})
export class ToolProviderModule {}
