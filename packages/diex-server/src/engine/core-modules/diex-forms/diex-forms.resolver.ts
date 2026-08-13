import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';
import { PermissionFlagType } from 'diex-shared/constants';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { DiexFormFieldEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form-field.entity';
import { DiexFormSubmissionEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form-submission.entity';
import {
  DiexFormEntity,
  FormTargetObject,
  FormTemplate,
} from 'src/engine/core-modules/diex-forms/entities/diex-form.entity';
import { DiexFormsService } from 'src/engine/core-modules/diex-forms/services/diex-forms.service';
import {
  type DiexFormFieldInput,
  type DiexFormFieldUpdateInput,
  type DiexFormUpdateInput,
} from 'src/engine/core-modules/diex-forms/types/diex-form.types';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { PermissionsGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-graphql-api-exception.filter';

@Resolver(() => DiexFormEntity)
@MetadataResolver()
@UsePipes(ResolverValidationPipe)
@UseFilters(
  PermissionsGraphqlApiExceptionFilter,
  PreventNestToAutoLogGraphqlErrorsFilter,
)
@UseGuards(
  UserAuthGuard,
  WorkspaceAuthGuard,
  SettingsPermissionGuard(PermissionFlagType.WORKSPACE),
)
export class DiexFormsResolver {
  constructor(private readonly formsService: DiexFormsService) {}

  @Query(() => [DiexFormEntity])
  async diexForms(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DiexFormEntity[]> {
    return this.formsService.listWorkspaceForms(workspace.id);
  }

  @Query(() => DiexFormEntity)
  async diexForm(
    @Args('id') id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DiexFormEntity> {
    return this.formsService.getWorkspaceFormById(workspace.id, id);
  }

  @Query(() => [DiexFormSubmissionEntity])
  async diexFormSubmissions(
    @Args('formId') formId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DiexFormSubmissionEntity[]> {
    return this.formsService.listSubmissionsForForm(workspace.id, formId);
  }

  @Mutation(() => DiexFormEntity)
  async createDiexForm(
    @Args('title') title: string,
    @Args('targetObject', {
      type: () => FormTargetObject,
      defaultValue: FormTargetObject.PERSON,
    })
    targetObject: FormTargetObject,
    @Args('template', {
      type: () => FormTemplate,
      defaultValue: FormTemplate.CONTACT,
    })
    template: FormTemplate,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DiexFormEntity> {
    return this.formsService.createForm({
      workspaceId: workspace.id,
      title,
      targetObject,
      template,
    });
  }

  @Mutation(() => DiexFormEntity)
  async updateDiexForm(
    @Args('id') id: string,
    @Args('input', { type: () => GraphQLJSON }) input: DiexFormUpdateInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DiexFormEntity> {
    return this.formsService.updateForm(workspace.id, id, input);
  }

  @Mutation(() => DiexFormEntity)
  async publishDiexForm(
    @Args('id') id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DiexFormEntity> {
    return this.formsService.publishForm(workspace.id, id);
  }

  @Mutation(() => DiexFormEntity)
  async unpublishDiexForm(
    @Args('id') id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DiexFormEntity> {
    return this.formsService.unpublishForm(workspace.id, id);
  }

  @Mutation(() => DiexFormEntity)
  async archiveDiexForm(
    @Args('id') id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DiexFormEntity> {
    return this.formsService.archiveForm(workspace.id, id);
  }

  @Mutation(() => Boolean)
  async deleteDiexForm(
    @Args('id') id: string,
    @Args('confirmationTitle') confirmationTitle: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<boolean> {
    return this.formsService.deleteForm(workspace.id, id, confirmationTitle);
  }

  @Mutation(() => DiexFormFieldEntity)
  async addDiexFormField(
    @Args('formId') formId: string,
    @Args('input', { type: () => GraphQLJSON }) input: DiexFormFieldInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DiexFormFieldEntity> {
    return this.formsService.addFieldToForm(workspace.id, formId, input);
  }

  @Mutation(() => DiexFormFieldEntity)
  async updateDiexFormField(
    @Args('fieldId') fieldId: string,
    @Args('input', { type: () => GraphQLJSON })
    input: DiexFormFieldUpdateInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<DiexFormFieldEntity> {
    return this.formsService.updateFormField(workspace.id, fieldId, input);
  }

  @Mutation(() => Boolean)
  async deleteDiexFormField(
    @Args('fieldId') fieldId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<boolean> {
    return this.formsService.deleteFormField(workspace.id, fieldId);
  }
}
