import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { DiexAgencyAiCopilotService } from 'src/engine/core-modules/diex-agency/services/diex-agency-ai-copilot.service';
import { AskDiexCopilotInput } from 'src/engine/core-modules/diex-agency/dtos/ask-diex-copilot.input';
import { DiexCopilotResponseDTO } from 'src/engine/core-modules/diex-agency/dtos/copilot-response.dto';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { PermissionsGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-graphql-api-exception.filter';

@Resolver()
@MetadataResolver()
@UsePipes(ResolverValidationPipe)
@UseFilters(
  PermissionsGraphqlApiExceptionFilter,
  PreventNestToAutoLogGraphqlErrorsFilter,
)
@UseGuards(UserAuthGuard)
export class DiexAgencyAiResolver {
  constructor(private readonly copilotService: DiexAgencyAiCopilotService) {}

  @Mutation(() => DiexCopilotResponseDTO)
  async askDiexCopilot(
    @Args('input') input: AskDiexCopilotInput,
    @AuthUser() user: AuthContextUser,
  ): Promise<DiexCopilotResponseDTO> {
    return await this.copilotService.processCopilotQuery(user.id, input);
  }
}
