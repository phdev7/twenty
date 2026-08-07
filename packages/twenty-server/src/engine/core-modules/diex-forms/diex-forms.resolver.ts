import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { DiexFormEntity, FormTargetObject } from 'src/engine/core-modules/diex-forms/entities/diex-form.entity';
import { DiexFormFieldEntity, FormFieldType } from 'src/engine/core-modules/diex-forms/entities/diex-form-field.entity';
import { DiexFormSubmissionEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form-submission.entity';
import { DiexFormsService } from 'src/engine/core-modules/diex-forms/services/diex-forms.service';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { PermissionsGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-graphql-api-exception.filter';

@Resolver(() => DiexFormEntity)
@MetadataResolver()
@UsePipes(ResolverValidationPipe)
@UseFilters(
  PermissionsGraphqlApiExceptionFilter,
  PreventNestToAutoLogGraphqlErrorsFilter,
)
@UseGuards(UserAuthGuard, WorkspaceAuthGuard)
export class DiexFormsResolver {
  constructor(private readonly formsService: DiexFormsService) {}

  @Query(() => [DiexFormEntity])
  async diexForms(@AuthWorkspace() workspace: WorkspaceEntity): Promise<DiexFormEntity[]> {
    return await this.formsService.listWorkspaceForms(workspace.id);
  }

  @Query(() => DiexFormEntity)
  async diexForm(@Args('id') id: string): Promise<DiexFormEntity> {
    return await this.formsService.getFormById(id);
  }

  @Query(() => [DiexFormSubmissionEntity])
  async diexFormSubmissions(@Args('formId') formId: string): Promise<DiexFormSubmissionEntity[]> {
    return await this.formsService.listSubmissionsForForm(formId);
  }

  @Mutation(() => DiexFormEntity)
  async createDiexForm(
    @Args('title') title: string,
    @Args('targetObject', { type: () => FormTargetObject, defaultValue: FormTargetObject.PERSON })
    targetObject: FormTargetObject,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DiexFormEntity> {
    return await this.formsService.createForm(workspace.id, title, targetObject);
  }

  @Mutation(() => DiexFormFieldEntity)
  async addDiexFormField(
    @Args('formId') formId: string,
    @Args('label') label: string,
    @Args('type', { type: () => FormFieldType }) type: FormFieldType,
    @Args('isRequired', { defaultValue: false }) isRequired: boolean,
  ): Promise<DiexFormFieldEntity> {
    return await this.formsService.addFieldToForm(formId, label, type, isRequired);
  }

  @Mutation(() => Boolean)
  async deleteDiexFormField(@Args('fieldId') fieldId: string): Promise<boolean> {
    return await this.formsService.deleteFormField(fieldId);
  }
}
