import { Test, type TestingModule } from '@nestjs/testing';

import { WorkspaceActivationStatus } from 'twenty-shared/workspace';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceApprovalGateService } from 'src/engine/core-modules/workspace-approval/services/workspace-approval-gate.service';

describe('WorkspaceApprovalGateService', () => {
  let service: WorkspaceApprovalGateService;
  let isApprovalRequired: boolean;

  beforeEach(async () => {
    isApprovalRequired = true;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceApprovalGateService,
        {
          provide: TwentyConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'IS_WORKSPACE_APPROVAL_REQUIRED'
                ? isApprovalRequired
                : undefined,
            ),
          },
        },
      ],
    }).compile();

    service = module.get<WorkspaceApprovalGateService>(
      WorkspaceApprovalGateService,
    );
  });

  const nonAdmin = { id: 'user-id', canAccessFullAdminPanel: false };
  const serverAdmin = { id: 'admin-id', canAccessFullAdminPanel: true };

  describe('shouldBlockWorkspaceAccess', () => {
    it.each([
      WorkspaceActivationStatus.PENDING_CREATION,
      WorkspaceActivationStatus.ONGOING_CREATION,
    ])('should block a non-admin when the workspace is %s', (status) => {
      expect(
        service.shouldBlockWorkspaceAccess({
          workspace: { activationStatus: status },
          user: nonAdmin,
        }),
      ).toBe(true);
    });

    it.each([
      WorkspaceActivationStatus.ACTIVE,
      WorkspaceActivationStatus.CREATED,
      WorkspaceActivationStatus.SUSPENDED,
      WorkspaceActivationStatus.INACTIVE,
    ])('should not block when the workspace is already %s', (status) => {
      expect(
        service.shouldBlockWorkspaceAccess({
          workspace: { activationStatus: status },
          user: nonAdmin,
        }),
      ).toBe(false);
    });

    it('should not block a server admin on an unapproved workspace', () => {
      expect(
        service.shouldBlockWorkspaceAccess({
          workspace: {
            activationStatus: WorkspaceActivationStatus.PENDING_CREATION,
          },
          user: serverAdmin,
        }),
      ).toBe(false);
    });

    // API keys and applications carry no user, so the gate must treat them as
    // non-admins rather than letting an absent user read as permitted.
    it.each([[undefined], [null]])(
      'should block when the caller carries no user (%p)',
      (user) => {
        expect(
          service.shouldBlockWorkspaceAccess({
            workspace: {
              activationStatus: WorkspaceActivationStatus.PENDING_CREATION,
            },
            user,
          }),
        ).toBe(true);
      },
    );

    it('should not block when approval is disabled by config', () => {
      isApprovalRequired = false;

      expect(
        service.shouldBlockWorkspaceAccess({
          workspace: {
            activationStatus: WorkspaceActivationStatus.PENDING_CREATION,
          },
          user: nonAdmin,
        }),
      ).toBe(false);
    });

    it('should not block when there is no workspace on the request', () => {
      expect(
        service.shouldBlockWorkspaceAccess({
          workspace: undefined,
          user: nonAdmin,
        }),
      ).toBe(false);
    });
  });

  describe('canActivateWithoutApproval', () => {
    it('should refuse a non-admin while approval is required', () => {
      expect(service.canActivateWithoutApproval(nonAdmin)).toBe(false);
    });

    it('should allow a server admin', () => {
      expect(service.canActivateWithoutApproval(serverAdmin)).toBe(true);
    });

    it('should allow anyone once approval is disabled', () => {
      isApprovalRequired = false;

      expect(service.canActivateWithoutApproval(nonAdmin)).toBe(true);
    });
  });
});
