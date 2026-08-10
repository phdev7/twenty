import { Test, TestingModule } from '@nestjs/testing';

import { CacheLockService } from 'src/engine/core-modules/cache-lock/cache-lock.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { AiModelRegistryService } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-registry.service';
import { WORKSPACE_TEMPLATE_REGISTRY } from 'src/modules/workspace-architecture/constants/workspace-template-registry.constant';
import { WorkspaceArchitectureService } from 'src/modules/workspace-architecture/services/workspace-architecture.service';
import { WorkspaceFineTuningService } from 'src/modules/workspace-architecture/services/workspace-fine-tuning.service';

describe('WorkspaceArchitectureService & WorkspaceFineTuningService', () => {
  let service: WorkspaceArchitectureService;
  let fineTuningService: WorkspaceFineTuningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceArchitectureService,
        WorkspaceFineTuningService,
        {
          provide: GlobalWorkspaceOrmManager,
          useValue: {
            executeInWorkspaceContext: jest.fn((cb) => cb()),
            getRepository: jest.fn(),
          },
        },
        {
          provide: WorkspaceManyOrAllFlatEntityMapsCacheService,
          useValue: {
            getOrRecomputeManyOrAllFlatEntityMaps: jest.fn().mockResolvedValue({
              flatObjectMetadataMaps: { byUniversalIdentifier: {} },
              flatFieldMetadataMaps: { byUniversalIdentifier: {} },
              flatViewMaps: { byUniversalIdentifier: {} },
              flatPageLayoutMaps: { byUniversalIdentifier: {} },
              flatNavigationMenuItemMaps: { byUniversalIdentifier: {} },
              flatAgentMaps: { byUniversalIdentifier: {} },
              flatRoleMaps: { byUniversalIdentifier: {} },
            }),
            invalidateFlatEntityMaps: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ObjectMetadataService,
          useValue: {
            createOneObject: jest.fn(),
          },
        },
        {
          provide: CacheLockService,
          useValue: {
            withRenewableLock: jest.fn((cb) =>
              cb({ assertOwnership: jest.fn() }),
            ),
          },
        },
        {
          provide: AiModelRegistryService,
          useValue: {
            validateModelAvailability: jest.fn(),
            resolveModelForAgent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WorkspaceArchitectureService>(
      WorkspaceArchitectureService,
    );
    fineTuningService = module.get<WorkspaceFineTuningService>(
      WorkspaceFineTuningService,
    );
  });

  describe('listTemplates', () => {
    it('should return all registered templates', () => {
      const templates = service.listTemplates();

      expect(templates.length).toBe(WORKSPACE_TEMPLATE_REGISTRY.length);
      expect(templates.some((t) => t.id === 'diex.base.universal')).toBe(true);
    });
  });

  describe('sanitizeText', () => {
    it('should redact emails, phones, and bearer tokens from text', () => {
      const input =
        'Contato: pedro@example.com, Fone: +55 11 99999-8888, Token: Bearer abc123def';
      const sanitized = fineTuningService.sanitizeText(input);

      expect(sanitized).not.toContain('pedro@example.com');
      expect(sanitized).toContain('[EMAIL_REDACTED]');
      expect(sanitized).toContain('[SECRET_REDACTED]');
    });
  });

  describe('evaluateModel', () => {
    it('should produce a valid evaluation report for fine-tuned model', async () => {
      const report = await fineTuningService.evaluateModel(
        'diex-architect-fine-tuned-v1',
      );

      expect(report.passed).toBe(true);
      expect(report.metrics.schemaValidityRate).toBe(100);
      expect(report.metrics.destructiveSafetyRate).toBe(100);
    });
  });
});
