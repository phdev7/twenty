import {
  ForbiddenException,
  Injectable,
  type NestMiddleware,
} from '@nestjs/common';

import { type NextFunction, type Request, type Response } from 'express';

import { WorkspaceApprovalGateService } from 'src/engine/core-modules/workspace-approval/services/workspace-approval-gate.service';
import { MiddlewareService } from 'src/engine/middlewares/middleware.service';

// Gates the core /graphql endpoint, which serves the generated workspace record
// schema. That schema is built dynamically rather than from @UseGuards
// resolvers, so WorkspaceAuthGuard never runs for it and a middleware is the
// only place the refusal can live. Runs after
// GraphQLHydrateRequestFromTokenMiddleware so req.workspace and req.user are
// already resolved.
@Injectable()
export class WorkspaceApprovalMiddleware implements NestMiddleware {
  constructor(
    private readonly workspaceApprovalGateService: WorkspaceApprovalGateService,
    private readonly middlewareService: MiddlewareService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (
      this.workspaceApprovalGateService.shouldBlockWorkspaceAccess({
        workspace: req.workspace,
        user: req.user,
      })
    ) {
      this.middlewareService.writeGraphqlResponseOnExceptionCaught(
        res,
        new ForbiddenException(
          'This workspace is awaiting approval from a server administrator.',
        ),
      );

      return;
    }

    next();
  }
}
