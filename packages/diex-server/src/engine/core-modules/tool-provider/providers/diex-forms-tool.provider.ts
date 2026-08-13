import { Injectable } from '@nestjs/common';

import { type ToolSet } from 'ai';
import { ToolCategory } from 'diex-shared/ai';
import { PermissionFlagType } from 'diex-shared/constants';
import { z } from 'zod';

import { FormFieldType } from 'src/engine/core-modules/diex-forms/entities/diex-form-field.entity';
import {
  FormLayout,
  FormTargetObject,
  FormTemplate,
} from 'src/engine/core-modules/diex-forms/entities/diex-form.entity';
import { DiexFormsService } from 'src/engine/core-modules/diex-forms/services/diex-forms.service';
import { DIEX_FORM_OPPORTUNITY_STAGES } from 'src/engine/core-modules/diex-forms/types/diex-form.types';
import { type GenerateDescriptorOptions } from 'src/engine/core-modules/tool-provider/interfaces/generate-descriptor-options.type';
import { type ToolProvider } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider.interface';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { type ToolDescriptor } from 'src/engine/core-modules/tool-provider/types/tool-descriptor.type';
import { type ToolIndexEntry } from 'src/engine/core-modules/tool-provider/types/tool-index-entry.type';
import { executeToolFromToolSet } from 'src/engine/core-modules/tool-provider/utils/execute-tool-from-tool-set.util';
import { toolSetToDescriptors } from 'src/engine/core-modules/tool-provider/utils/tool-set-to-descriptors.util';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';
import { PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';

const optionSchema = z.object({
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(120),
});

const questionSchema = z.object({
  label: z.string().min(1).max(180),
  name: z.string().optional(),
  type: z.nativeEnum(FormFieldType),
  targetFieldName: z.string().nullable().optional(),
  placeholder: z.string().max(180).nullable().optional(),
  helpText: z.string().max(300).nullable().optional(),
  options: z.array(optionSchema).max(50).optional(),
  validation: z
    .object({
      minLength: z.number().nonnegative().max(2_000).optional(),
      maxLength: z.number().nonnegative().max(2_000).optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  isRequired: z.boolean().optional(),
  position: z.number().int().nonnegative().max(59).optional(),
});

const formUpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(80).optional(),
  description: z.string().max(800).nullable().optional(),
  targetObject: z.nativeEnum(FormTargetObject).optional(),
  layout: z.nativeEnum(FormLayout).optional(),
  submitButtonLabel: z.string().min(1).max(50).optional(),
  successTitle: z.string().min(1).max(120).optional(),
  successMessage: z.string().min(1).max(600).optional(),
  showLogo: z.boolean().optional(),
  logoUrl: z.string().url().nullable().optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  privacyPolicyUrl: z.string().url().nullable().optional(),
  consentText: z.string().max(800).nullable().optional(),
  consentRequired: z.boolean().optional(),
  createOpportunity: z.boolean().optional(),
  opportunityStage: z.enum(DIEX_FORM_OPPORTUNITY_STAGES).optional(),
  ownerId: z.string().uuid().nullable().optional(),
});

@Injectable()
export class DiexFormsToolProvider implements ToolProvider {
  readonly category = ToolCategory.DIEX;

  constructor(
    private readonly formsService: DiexFormsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async isAvailable(context: ToolProviderContext): Promise<boolean> {
    return this.permissionsService.checkRolesPermissions(
      context.rolePermissionConfig,
      context.workspaceId,
      PermissionFlagType.WORKSPACE,
    );
  }

  async generateDescriptors(
    context: ToolProviderContext,
    options?: GenerateDescriptorOptions,
  ): Promise<(ToolIndexEntry | ToolDescriptor)[]> {
    return toolSetToDescriptors(this.buildToolSet(context), ToolCategory.DIEX, {
      includeSchemas: options?.includeSchemas ?? true,
    });
  }

  async executeStaticTool(
    toolName: string,
    args: Record<string, unknown>,
    context: ToolProviderContext,
  ): Promise<ToolOutput> {
    return executeToolFromToolSet(
      this.buildToolSet(context),
      toolName,
      args,
      ToolCategory.DIEX,
    );
  }

  private buildToolSet(context: ToolProviderContext): ToolSet {
    const listForms = {
      name: 'list_diex_forms' as const,
      description:
        'Lista os formulários do workspace, seus estados de publicação, versões e links públicos. Use antes de editar ou excluir para obter IDs e títulos exatos.',
      inputSchema: z.object({}),
      execute: async () => {
        const forms = await this.formsService.listWorkspaceForms(
          context.workspaceId,
        );

        return forms.map((form) => this.toToolForm(form));
      },
    };
    const createForm = {
      name: 'create_diex_form' as const,
      description:
        'Cria um formulário como rascunho seguro. Pode usar um modelo comercial pronto ou receber perguntas personalizadas. Publicação exige uma chamada separada.',
      inputSchema: z.object({
        title: z.string().min(1).max(120),
        targetObject: z
          .nativeEnum(FormTargetObject)
          .default(FormTargetObject.OPPORTUNITY),
        template: z.nativeEnum(FormTemplate).default(FormTemplate.CONTACT),
        configuration: formUpdateSchema.optional(),
        questions: z.array(questionSchema).max(60).optional(),
      }),
      execute: async (parameters: {
        title: string;
        targetObject: FormTargetObject;
        template: FormTemplate;
        configuration?: z.infer<typeof formUpdateSchema>;
        questions?: z.infer<typeof questionSchema>[];
      }) => {
        const usesCustomQuestions = (parameters.questions?.length ?? 0) > 0;
        let form = await this.formsService.createForm({
          workspaceId: context.workspaceId,
          title: parameters.title,
          targetObject: parameters.targetObject,
          template: usesCustomQuestions
            ? FormTemplate.BLANK
            : parameters.template,
        });

        if (parameters.configuration) {
          form = await this.formsService.updateForm(
            context.workspaceId,
            form.id,
            parameters.configuration,
          );
        }
        for (const question of parameters.questions ?? []) {
          await this.formsService.addFieldToForm(
            context.workspaceId,
            form.id,
            question,
          );
        }

        return this.toToolForm(
          await this.formsService.getWorkspaceFormById(
            context.workspaceId,
            form.id,
          ),
        );
      },
    };
    const updateForm = {
      name: 'update_diex_form' as const,
      description:
        'Edita conteúdo, aparência, consentimento e conversão de um formulário. Mudanças em formulário já publicado ficam em rascunho até nova publicação.',
      inputSchema: z.object({
        formId: z.string().uuid(),
        changes: formUpdateSchema,
      }),
      execute: async (parameters: {
        formId: string;
        changes: z.infer<typeof formUpdateSchema>;
      }) =>
        this.toToolForm(
          await this.formsService.updateForm(
            context.workspaceId,
            parameters.formId,
            parameters.changes,
          ),
        ),
    };
    const addQuestion = {
      name: 'add_diex_form_question' as const,
      description:
        'Adiciona uma pergunta a um formulário do workspace, com tipo, opções, obrigatoriedade e mapeamento comercial.',
      inputSchema: z.object({
        formId: z.string().uuid(),
        question: questionSchema,
      }),
      execute: async (parameters: {
        formId: string;
        question: z.infer<typeof questionSchema>;
      }) =>
        this.formsService.addFieldToForm(
          context.workspaceId,
          parameters.formId,
          parameters.question,
        ),
    };
    const updateQuestion = {
      name: 'update_diex_form_question' as const,
      description:
        'Edita uma pergunta existente. Consulte o formulário antes para obter o ID correto da pergunta.',
      inputSchema: z.object({
        questionId: z.string().uuid(),
        changes: questionSchema.partial(),
      }),
      execute: async (parameters: {
        questionId: string;
        changes: Partial<z.infer<typeof questionSchema>>;
      }) =>
        this.formsService.updateFormField(
          context.workspaceId,
          parameters.questionId,
          parameters.changes,
        ),
    };
    const deleteQuestion = {
      name: 'delete_diex_form_question' as const,
      description:
        'Exclui uma pergunta do rascunho do formulário. O conteúdo publicado anterior continua ativo até a próxima publicação.',
      inputSchema: z.object({ questionId: z.string().uuid() }),
      execute: async (parameters: { questionId: string }) => ({
        deleted: await this.formsService.deleteFormField(
          context.workspaceId,
          parameters.questionId,
        ),
      }),
    };
    const publishForm = {
      name: 'publish_diex_form' as const,
      description:
        'Publica explicitamente a versão atual do formulário. Exige o título exato como confirmação, pois o link público passa a servir essa versão congelada.',
      inputSchema: z.object({
        formId: z.string().uuid(),
        confirmationTitle: z.string().min(1),
      }),
      execute: async (parameters: {
        formId: string;
        confirmationTitle: string;
      }) => {
        const form = await this.formsService.getWorkspaceFormById(
          context.workspaceId,
          parameters.formId,
        );

        if (parameters.confirmationTitle.trim() !== form.title) {
          return {
            published: false,
            reason:
              'A confirmação deve ser exatamente igual ao título do formulário.',
          };
        }

        return this.toToolForm(
          await this.formsService.publishForm(
            context.workspaceId,
            parameters.formId,
          ),
        );
      },
    };
    const unpublishForm = {
      name: 'unpublish_diex_form' as const,
      description:
        'Retira imediatamente um formulário do ar sem apagar perguntas ou submissões.',
      inputSchema: z.object({ formId: z.string().uuid() }),
      execute: async (parameters: { formId: string }) =>
        this.toToolForm(
          await this.formsService.unpublishForm(
            context.workspaceId,
            parameters.formId,
          ),
        ),
    };
    const deleteForm = {
      name: 'delete_diex_form' as const,
      description:
        'Exclui permanentemente um formulário e suas submissões. Exige o título exato como confirmação; prefira retirar do ar quando houver dúvida.',
      inputSchema: z.object({
        formId: z.string().uuid(),
        confirmationTitle: z.string().min(1),
      }),
      execute: async (parameters: {
        formId: string;
        confirmationTitle: string;
      }) => ({
        deleted: await this.formsService.deleteForm(
          context.workspaceId,
          parameters.formId,
          parameters.confirmationTitle,
        ),
      }),
    };

    return {
      [listForms.name]: listForms,
      [createForm.name]: createForm,
      [updateForm.name]: updateForm,
      [addQuestion.name]: addQuestion,
      [updateQuestion.name]: updateQuestion,
      [deleteQuestion.name]: deleteQuestion,
      [publishForm.name]: publishForm,
      [unpublishForm.name]: unpublishForm,
      [deleteForm.name]: deleteForm,
    };
  }

  private toToolForm(
    form: Awaited<ReturnType<DiexFormsService['getWorkspaceFormById']>>,
  ) {
    return {
      id: form.id,
      title: form.title,
      slug: form.slug,
      status: form.status,
      targetObject: form.targetObject,
      layout: form.layout,
      createOpportunity: form.createOpportunity,
      opportunityStage: form.opportunityStage,
      ownerId: form.ownerId,
      publicUrl: form.publicUrl ?? null,
      draftVersion: form.draftVersion,
      publishedVersion: form.publishedVersion,
      hasUnpublishedChanges: form.draftVersion > form.publishedVersion,
      questions: form.fields.map((field) => ({
        id: field.id,
        label: field.label,
        name: field.name,
        type: field.type,
        isRequired: field.isRequired,
        position: field.position,
        options: field.options,
      })),
    };
  }
}
