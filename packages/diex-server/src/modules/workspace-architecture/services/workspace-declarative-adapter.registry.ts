import { Injectable } from '@nestjs/common';

import { type WorkspaceChangeOperation } from 'src/modules/workspace-architecture/types/workspace-change-set.schema';

export type WorkspaceDeclarativeMaterialization = 'DIEX_CATALOG' | 'MANIFEST';
export type WorkspaceDeclarativeMaterializationStatus =
  | 'MATERIALIZED'
  | 'PENDING_NATIVE_ADAPTER';

export type WorkspaceDeclarativeAdapterResult = {
  resourceId: string;
  adapter: string;
  materialization: WorkspaceDeclarativeMaterialization;
  materializationStatus: WorkspaceDeclarativeMaterializationStatus;
};

@Injectable()
export class WorkspaceDeclarativeAdapterRegistry {
  private readonly diexCatalogResourceTypes = new Set([
    'PAGE_LAYOUT',
    'NAVIGATION',
    'AI_CONTEXT',
  ]);

  apply({
    workspaceId,
    operation,
  }: {
    workspaceId: string;
    operation: WorkspaceChangeOperation;
  }): WorkspaceDeclarativeAdapterResult {
    const usesDiexCatalog = this.diexCatalogResourceTypes.has(
      operation.resourceType,
    );

    return {
      resourceId: usesDiexCatalog
        ? `diex-catalog:${workspaceId}:${operation.resourceType}:${operation.resourceKey}`
        : `diex-manifest:${workspaceId}:${operation.resourceType}:${operation.resourceKey}`,
      adapter: usesDiexCatalog
        ? 'workspace-diex-catalog-adapter@1.0.0'
        : 'workspace-operation-manifest-adapter@1.0.0',
      materialization: usesDiexCatalog ? 'DIEX_CATALOG' : 'MANIFEST',
      materializationStatus: usesDiexCatalog
        ? 'MATERIALIZED'
        : 'PENDING_NATIVE_ADAPTER',
    };
  }
}
