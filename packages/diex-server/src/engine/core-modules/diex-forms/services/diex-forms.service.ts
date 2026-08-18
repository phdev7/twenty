import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { FieldActorSource } from 'diex-shared/types';
import { DataSource, Raw, Repository } from 'typeorm';
import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';
import {
  DiexFormFieldEntity,
  FormFieldType,
} from 'src/engine/core-modules/diex-forms/entities/diex-form-field.entity';
import {
  DiexFormSubmissionEntity,
  FormSubmissionSource,
  FormSubmissionStatus,
} from 'src/engine/core-modules/diex-forms/entities/diex-form-submission.entity';
import {
  DiexFormEntity,
  FormLayout,
  FormStatus,
  FormTargetObject,
  FormTemplate,
} from 'src/engine/core-modules/diex-forms/entities/diex-form.entity';
import {
  DIEX_FORM_OPPORTUNITY_STAGES,
  type DiexFormFieldInput,
  type DiexFormFieldUpdateInput,
  type DiexFormOption,
  type DiexFormUpdateInput,
  type DiexPublicSubmissionContext,
  type DiexPublishedFormSnapshot,
} from 'src/engine/core-modules/diex-forms/types/diex-form.types';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { InjectWorkspaceScopedRepository } from 'src/engine/diex-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/diex-orm/workspace-scoped-repository/workspace-scoped-repository';
import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import {
  buildPhonesValue,
  splitDisplayName,
} from 'src/modules/inbox/utils/inbox-contact-phone.util';
import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

const MAX_FIELDS_PER_FORM = 60;
const MAX_PUBLIC_TOKEN_AGE_MS = 2 * 60 * 60 * 1000;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const FIELD_NAME_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CHOICE_FIELD_TYPES = new Set<FormFieldType>([
  FormFieldType.SELECT,
  FormFieldType.MULTI_SELECT,
  FormFieldType.RADIO,
]);

type TemplateField = Omit<DiexFormFieldInput, 'position'>;

const FORM_TEMPLATE_FIELDS: Record<FormTemplate, TemplateField[]> = {
  [FormTemplate.CONTACT]: [
    {
      label: 'Qual é o seu nome?',
      name: 'name',
      type: FormFieldType.TEXT,
      targetFieldName: 'name',
      placeholder: 'Seu nome completo',
      isRequired: true,
    },
    {
      label: 'Qual é o seu melhor e-mail?',
      name: 'email',
      type: FormFieldType.EMAIL,
      targetFieldName: 'email',
      placeholder: 'voce@empresa.com.br',
      isRequired: true,
    },
    {
      label: 'Qual é o seu WhatsApp?',
      name: 'phone',
      type: FormFieldType.PHONE,
      targetFieldName: 'phone',
      placeholder: '(31) 99999-9999',
      isRequired: true,
    },
    {
      label: 'Como podemos ajudar?',
      name: 'message',
      type: FormFieldType.TEXTAREA,
      targetFieldName: 'message',
      placeholder: 'Conte brevemente o que você precisa',
      validation: { maxLength: 1200 },
    },
  ],
  [FormTemplate.COMMERCIAL_QUALIFICATION]: [
    {
      label: 'Qual é o seu nome?',
      name: 'name',
      type: FormFieldType.TEXT,
      targetFieldName: 'name',
      isRequired: true,
    },
    {
      label: 'Qual é o seu e-mail profissional?',
      name: 'email',
      type: FormFieldType.EMAIL,
      targetFieldName: 'email',
      isRequired: true,
    },
    {
      label: 'Qual é o seu WhatsApp?',
      name: 'phone',
      type: FormFieldType.PHONE,
      targetFieldName: 'phone',
      isRequired: true,
    },
    {
      label: 'Qual é o nome da sua empresa?',
      name: 'company_name',
      type: FormFieldType.TEXT,
      targetFieldName: 'companyName',
      isRequired: true,
    },
    {
      label: 'Quantas pessoas trabalham na empresa?',
      name: 'company_size',
      type: FormFieldType.SELECT,
      targetFieldName: 'companySize',
      options: [
        { label: 'Só eu', value: 'SOLO' },
        { label: '2 a 10', value: '2_10' },
        { label: '11 a 50', value: '11_50' },
        { label: '51 a 200', value: '51_200' },
        { label: 'Mais de 200', value: '201_PLUS' },
      ],
      isRequired: true,
    },
    {
      label: 'Qual faixa de investimento você considera?',
      name: 'budget',
      type: FormFieldType.SELECT,
      targetFieldName: 'budget',
      options: [
        { label: 'Até R$ 5 mil', value: '5000' },
        { label: 'R$ 5 mil a R$ 15 mil', value: '15000' },
        { label: 'R$ 15 mil a R$ 50 mil', value: '50000' },
        { label: 'Acima de R$ 50 mil', value: '50001' },
        { label: 'Ainda não defini', value: 'UNDEFINED' },
      ],
      isRequired: true,
    },
    {
      label: 'Qual problema você quer resolver?',
      name: 'need',
      type: FormFieldType.TEXTAREA,
      targetFieldName: 'need',
      validation: { maxLength: 1500 },
      isRequired: true,
    },
    {
      label: 'Quando pretende começar?',
      name: 'timing',
      type: FormFieldType.RADIO,
      targetFieldName: 'timing',
      options: [
        { label: 'Imediatamente', value: 'NOW' },
        { label: 'Nos próximos 30 dias', value: '30_DAYS' },
        { label: 'De 2 a 3 meses', value: '90_DAYS' },
        { label: 'Estou pesquisando', value: 'RESEARCHING' },
      ],
      isRequired: true,
    },
  ],
  [FormTemplate.QUOTE_REQUEST]: [
    {
      label: 'Qual é o seu nome?',
      name: 'name',
      type: FormFieldType.TEXT,
      targetFieldName: 'name',
      isRequired: true,
    },
    {
      label: 'Qual é o seu e-mail?',
      name: 'email',
      type: FormFieldType.EMAIL,
      targetFieldName: 'email',
      isRequired: true,
    },
    {
      label: 'Qual é o seu WhatsApp?',
      name: 'phone',
      type: FormFieldType.PHONE,
      targetFieldName: 'phone',
      isRequired: true,
    },
    {
      label: 'Para qual empresa é o projeto?',
      name: 'company_name',
      type: FormFieldType.TEXT,
      targetFieldName: 'companyName',
    },
    {
      label: 'Qual solução você procura?',
      name: 'service',
      type: FormFieldType.MULTI_SELECT,
      targetFieldName: 'service',
      options: [
        { label: 'CRM e vendas', value: 'CRM' },
        { label: 'Automação e IA', value: 'AUTOMATION_AI' },
        { label: 'Site ou landing page', value: 'WEBSITE' },
        { label: 'Sistema personalizado', value: 'CUSTOM_SOFTWARE' },
        { label: 'Outro', value: 'OTHER' },
      ],
      isRequired: true,
    },
    {
      label: 'Qual é o investimento previsto?',
      name: 'budget',
      type: FormFieldType.CURRENCY,
      targetFieldName: 'budget',
      placeholder: 'Ex.: 15000',
    },
    {
      label: 'Descreva o resultado que espera alcançar',
      name: 'details',
      type: FormFieldType.TEXTAREA,
      targetFieldName: 'need',
      validation: { maxLength: 1800 },
      isRequired: true,
    },
  ],
  [FormTemplate.EVENT_REGISTRATION]: [
    {
      label: 'Nome completo',
      name: 'name',
      type: FormFieldType.TEXT,
      targetFieldName: 'name',
      isRequired: true,
    },
    {
      label: 'E-mail para confirmação',
      name: 'email',
      type: FormFieldType.EMAIL,
      targetFieldName: 'email',
      isRequired: true,
    },
    {
      label: 'WhatsApp',
      name: 'phone',
      type: FormFieldType.PHONE,
      targetFieldName: 'phone',
      isRequired: true,
    },
    {
      label: 'Empresa',
      name: 'company_name',
      type: FormFieldType.TEXT,
      targetFieldName: 'companyName',
    },
    {
      label: 'Cargo ou função',
      name: 'job_title',
      type: FormFieldType.TEXT,
      targetFieldName: 'jobTitle',
    },
  ],
  [FormTemplate.BLANK]: [],
};

type CrmMappingResult = {
  personId: string | null;
  companyId: string | null;
  opportunityId: string | null;
  mappedRecordId: string | null;
};

@Injectable()
export class DiexFormsService {
  constructor(
    @InjectWorkspaceScopedRepository(DiexFormEntity)
    private readonly formRepository: WorkspaceScopedRepository<DiexFormEntity>,
    // A field has no workspaceId column; every field lookup is first joined to
    // its required form and checked against that form's workspace before write.
    // eslint-disable-next-line diex/prefer-workspace-scoped-repository
    @InjectRepository(DiexFormFieldEntity)
    private readonly fieldRepository: Repository<DiexFormFieldEntity>,
    @InjectWorkspaceScopedRepository(DiexFormSubmissionEntity)
    private readonly submissionRepository: WorkspaceScopedRepository<DiexFormSubmissionEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly diexConfigService: DiexConfigService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async createForm({
    workspaceId,
    title,
    targetObject,
    template = FormTemplate.CONTACT,
  }: {
    workspaceId: string;
    title: string;
    targetObject: FormTargetObject;
    template?: FormTemplate;
  }): Promise<DiexFormEntity> {
    this.assertEnumValue(targetObject, FormTargetObject, 'Objeto de destino');
    this.assertEnumValue(template, FormTemplate, 'Modelo');

    const normalizedTitle = this.requireText(title, 'Título', 120);
    const slug = await this.buildUniqueSlug(workspaceId, normalizedTitle);
    const createOpportunity = targetObject === FormTargetObject.OPPORTUNITY;
    const form = {
      workspaceId,
      title: normalizedTitle,
      slug,
      targetObject,
      status: FormStatus.DRAFT,
      layout: FormLayout.STEP_BY_STEP,
      createOpportunity,
      settings: {},
    };
    const templateFields = FORM_TEMPLATE_FIELDS[template] ?? [];
    const savedFormId = await this.coreDataSource.transaction(
      async (manager) => {
        const transactionFormRepository =
          this.formRepository.withManager(manager);
        const transactionFieldRepository =
          manager.getRepository(DiexFormFieldEntity);
        const savedForm = await transactionFormRepository.save(
          workspaceId,
          form,
        );

        if (templateFields.length > 0) {
          await transactionFieldRepository.save(
            templateFields.map((field, position) =>
              transactionFieldRepository.create({
                ...this.normalizeFieldInput(field),
                formId: savedForm.id,
                position,
              }),
            ),
          );
        }

        return savedForm.id;
      },
    );

    return this.getWorkspaceFormById(workspaceId, savedFormId);
  }

  async getWorkspaceFormById(
    workspaceId: string,
    id: string,
  ): Promise<DiexFormEntity> {
    const form = await this.formRepository.findOne(workspaceId, {
      where: { id },
      relations: ['fields', 'workspace'],
    });

    if (!form) {
      throw new NotFoundException('Formulário não encontrado neste workspace.');
    }

    return this.hydrateForm(form);
  }

  async listWorkspaceForms(workspaceId: string): Promise<DiexFormEntity[]> {
    const forms = await this.formRepository.find(workspaceId, {
      relations: ['fields', 'workspace'],
      order: { createdAt: 'DESC' },
    });

    return forms.map((form) => this.hydrateForm(form));
  }

  async updateForm(
    workspaceId: string,
    id: string,
    rawInput: DiexFormUpdateInput,
  ): Promise<DiexFormEntity> {
    const form = await this.getWorkspaceFormById(workspaceId, id);

    await this.freezeLegacyPublishedSnapshot(form);

    const input = await this.normalizeFormUpdateInput(form, rawInput);

    if (Object.keys(input).length === 0) {
      return form;
    }

    await this.formRepository
      .createQueryBuilder()
      .update(DiexFormEntity)
      .set({
        ...input,
        draftVersion: () => '"draftVersion" + 1',
      })
      .where('"id" = :id AND "workspaceId" = :workspaceId', {
        id: form.id,
        workspaceId,
      })
      .execute();

    return this.getWorkspaceFormById(workspaceId, id);
  }

  async publishForm(workspaceId: string, id: string): Promise<DiexFormEntity> {
    const form = await this.getWorkspaceFormById(workspaceId, id);

    if (form.fields.length === 0) {
      throw new BadRequestException(
        'Adicione ao menos uma pergunta antes de publicar.',
      );
    }

    this.assertPublicationReady(form);

    const snapshot = this.buildPublishedSnapshot(form);

    await this.formRepository.update(
      workspaceId,
      { id: form.id },
      {
        status: FormStatus.PUBLISHED,
        publishedSnapshot:
          snapshot as QueryDeepPartialEntity<DiexFormEntity>['publishedSnapshot'],
        publishedVersion: form.draftVersion,
        publishedAt: new Date(),
      },
    );

    return this.getWorkspaceFormById(workspaceId, id);
  }

  async unpublishForm(
    workspaceId: string,
    id: string,
  ): Promise<DiexFormEntity> {
    await this.getWorkspaceFormById(workspaceId, id);
    await this.formRepository.update(
      workspaceId,
      { id },
      {
        status: FormStatus.DRAFT,
      },
    );

    return this.getWorkspaceFormById(workspaceId, id);
  }

  async archiveForm(workspaceId: string, id: string): Promise<DiexFormEntity> {
    await this.getWorkspaceFormById(workspaceId, id);
    await this.formRepository.update(
      workspaceId,
      { id },
      {
        status: FormStatus.ARCHIVED,
      },
    );

    return this.getWorkspaceFormById(workspaceId, id);
  }

  async deleteForm(
    workspaceId: string,
    id: string,
    confirmationTitle: string,
  ): Promise<boolean> {
    const form = await this.getWorkspaceFormById(workspaceId, id);

    if (confirmationTitle.trim() !== form.title) {
      throw new BadRequestException(
        'A confirmação deve ser exatamente igual ao título do formulário.',
      );
    }

    const result = await this.formRepository.delete(workspaceId, { id });

    return (result.affected ?? 0) > 0;
  }

  async addFieldToForm(
    workspaceId: string,
    formId: string,
    rawInput: DiexFormFieldInput,
  ): Promise<DiexFormFieldEntity> {
    const form = await this.getWorkspaceFormById(workspaceId, formId);

    if (form.fields.length >= MAX_FIELDS_PER_FORM) {
      throw new BadRequestException(
        `Um formulário pode ter no máximo ${MAX_FIELDS_PER_FORM} perguntas.`,
      );
    }

    await this.freezeLegacyPublishedSnapshot(form);

    const normalized = this.normalizeFieldInput(rawInput);
    const fieldName = await this.buildUniqueFieldName(
      form.id,
      normalized.name ?? normalized.label,
    );
    const position =
      typeof normalized.position === 'number'
        ? Math.max(0, Math.round(normalized.position))
        : form.fields.length;
    const field = this.fieldRepository.create({
      ...normalized,
      name: fieldName,
      formId: form.id,
      position,
    });
    const saved = await this.fieldRepository.save(field);

    await this.touchDraftVersion(form);

    return saved;
  }

  async updateFormField(
    workspaceId: string,
    fieldId: string,
    rawInput: DiexFormFieldUpdateInput,
  ): Promise<DiexFormFieldEntity> {
    const field = await this.fieldRepository.findOne({
      where: { id: fieldId },
      relations: ['form', 'form.fields'],
    });

    if (!field || field.form.workspaceId !== workspaceId) {
      throw new NotFoundException('Pergunta não encontrada neste workspace.');
    }

    await this.freezeLegacyPublishedSnapshot(field.form);

    const merged = this.normalizeFieldInput({
      label: rawInput.label ?? field.label,
      name: rawInput.name ?? field.name,
      type: rawInput.type ?? field.type,
      targetFieldName:
        rawInput.targetFieldName === undefined
          ? field.targetFieldName
          : rawInput.targetFieldName,
      placeholder:
        rawInput.placeholder === undefined
          ? field.placeholder
          : rawInput.placeholder,
      helpText:
        rawInput.helpText === undefined ? field.helpText : rawInput.helpText,
      options: rawInput.options ?? field.options,
      validation: rawInput.validation ?? field.validation,
      isRequired: rawInput.isRequired ?? field.isRequired,
      position: rawInput.position ?? field.position,
    });

    if (merged.name !== field.name) {
      merged.name = await this.buildUniqueFieldName(
        field.formId,
        merged.name ?? merged.label,
        field.id,
      );
    }

    await this.fieldRepository.update(
      { id: field.id },
      merged as QueryDeepPartialEntity<DiexFormFieldEntity>,
    );
    await this.touchDraftVersion(field.form);

    const updated = await this.fieldRepository.findOne({
      where: { id: field.id },
    });

    if (!updated) {
      throw new NotFoundException(
        'Pergunta não encontrada após a atualização.',
      );
    }

    return updated;
  }

  async deleteFormField(
    workspaceId: string,
    fieldId: string,
  ): Promise<boolean> {
    const field = await this.fieldRepository.findOne({
      where: { id: fieldId },
      relations: ['form', 'form.fields'],
    });

    if (!field || field.form.workspaceId !== workspaceId) {
      throw new NotFoundException('Pergunta não encontrada neste workspace.');
    }

    await this.freezeLegacyPublishedSnapshot(field.form);
    const result = await this.fieldRepository.delete({ id: fieldId });

    if ((result.affected ?? 0) > 0) {
      await this.touchDraftVersion(field.form);
    }

    return (result.affected ?? 0) > 0;
  }

  async getPublicFormBySubdomain(
    formsSubdomain: string,
    formSlug: string,
  ): Promise<{
    form: DiexFormEntity;
    workspace: WorkspaceEntity;
    snapshot: DiexPublishedFormSnapshot;
  }> {
    const normalizedSubdomain = this.normalizeSubdomain(formsSubdomain);
    const normalizedSlug = this.normalizeSlug(formSlug);
    const workspace = await this.workspaceRepository
      .createQueryBuilder('workspace')
      .where(
        'LOWER(COALESCE(workspace."formsSubdomain", workspace."subdomain")) = :subdomain',
        { subdomain: normalizedSubdomain },
      )
      .andWhere('workspace."deletedAt" IS NULL')
      .getOne();

    if (!workspace) {
      throw new NotFoundException('Formulário não encontrado.');
    }

    const form = await this.formRepository.findOne(workspace.id, {
      where: {
        slug: normalizedSlug,
        status: FormStatus.PUBLISHED,
      },
      relations: ['fields'],
      order: { fields: { position: 'ASC' } },
    });

    if (!form) {
      throw new NotFoundException('Formulário não encontrado.');
    }

    const snapshot = this.readPublishedSnapshot(form);

    return { form, workspace, snapshot };
  }

  async processPublicSubmission({
    formsSubdomain,
    formSlug,
    rawPayload,
    context,
  }: {
    formsSubdomain: string;
    formSlug: string;
    rawPayload: Record<string, unknown>;
    context: DiexPublicSubmissionContext;
  }): Promise<DiexFormSubmissionEntity> {
    const { form, snapshot } = await this.getPublicFormBySubdomain(
      formsSubdomain,
      formSlug,
    );

    this.assertValidPublicToken(form.id, form.publishedVersion, context.token);

    return this.persistAndMapSubmission({
      form,
      snapshot,
      rawPayload,
      source: FormSubmissionSource.INTERNAL_FORM,
      context: { ...context, strict: true },
    });
  }

  async processConnectorSubmission(
    workspaceId: string,
    formId: string,
    rawPayload: Record<string, unknown>,
    source: FormSubmissionSource,
    context: DiexPublicSubmissionContext = {},
  ): Promise<DiexFormSubmissionEntity> {
    const form = await this.formRepository.findOne(workspaceId, {
      where: { id: formId, status: FormStatus.PUBLISHED },
      relations: ['fields'],
    });

    if (!form) {
      throw new NotFoundException('Formulário publicado não encontrado.');
    }

    if (form.settings?.allowPublicIntegrations !== true) {
      throw new NotFoundException('Formulário publicado não encontrado.');
    }

    return this.persistAndMapSubmission({
      form,
      snapshot: this.readPublishedSnapshot(form),
      rawPayload,
      source,
      context: { ...context, strict: false },
    });
  }

  async listSubmissionsForForm(
    workspaceId: string,
    formId: string,
  ): Promise<DiexFormSubmissionEntity[]> {
    await this.getWorkspaceFormById(workspaceId, formId);

    return this.submissionRepository.find(workspaceId, {
      where: { formId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  createPublicViewToken(formId: string, publishedVersion: number): string {
    const timestamp = Date.now().toString();
    const entropy = randomUUID();
    const unsigned = `${formId}:${publishedVersion}:${timestamp}:${entropy}`;
    const signature = this.sign(unsigned);

    return `${timestamp}.${entropy}.${signature}`;
  }

  getMarketingUrl(): string {
    return this.diexConfigService.get('FORMS_MARKETING_URL');
  }

  private hydrateForm(form: DiexFormEntity): DiexFormEntity {
    form.fields = [...(form.fields ?? [])].sort(
      (left, right) => left.position - right.position,
    );
    const subdomain =
      form.workspace?.formsSubdomain ?? form.workspace?.subdomain;

    if (subdomain) {
      const baseUrl = new URL(this.diexConfigService.get('FORMS_BASE_URL'));

      baseUrl.hostname = `${subdomain}.${baseUrl.hostname}`;
      baseUrl.pathname = `/${form.slug}`;
      form.publicUrl = baseUrl.toString();
    }

    return form;
  }

  private async normalizeFormUpdateInput(
    form: DiexFormEntity,
    input: DiexFormUpdateInput,
  ): Promise<QueryDeepPartialEntity<DiexFormEntity>> {
    const output: QueryDeepPartialEntity<DiexFormEntity> = {};

    if (input.title !== undefined) {
      output.title = this.requireText(input.title, 'Título', 120);
    }
    if (input.slug !== undefined) {
      const slug = this.normalizeSlug(input.slug);
      const collision = await this.formRepository.findOne(form.workspaceId, {
        where: { slug },
      });

      if (collision && collision.id !== form.id) {
        throw new BadRequestException(
          'Este endereço já é usado por outro formulário.',
        );
      }
      output.slug = slug;
    }
    if (input.description !== undefined) {
      output.description = this.optionalText(input.description, 800);
    }
    if (input.targetObject !== undefined) {
      this.assertEnumValue(
        input.targetObject,
        FormTargetObject,
        'Objeto de destino',
      );
      output.targetObject = input.targetObject;
    }
    if (input.layout !== undefined) {
      this.assertEnumValue(input.layout, FormLayout, 'Layout');
      output.layout = input.layout;
    }
    if (input.submitButtonLabel !== undefined) {
      output.submitButtonLabel = this.requireText(
        input.submitButtonLabel,
        'Texto do botão',
        50,
      );
    }
    if (input.successTitle !== undefined) {
      output.successTitle = this.requireText(
        input.successTitle,
        'Título de sucesso',
        120,
      );
    }
    if (input.successMessage !== undefined) {
      output.successMessage = this.requireText(
        input.successMessage,
        'Mensagem de sucesso',
        600,
      );
    }
    if (input.showLogo !== undefined) {
      output.showLogo = Boolean(input.showLogo);
    }
    if (input.logoUrl !== undefined) {
      output.logoUrl = this.optionalHttpsUrl(input.logoUrl, 'URL do logotipo');
    }
    if (input.accentColor !== undefined) {
      if (!HEX_COLOR_PATTERN.test(input.accentColor)) {
        throw new BadRequestException(
          'A cor principal deve estar no formato hexadecimal #RRGGBB.',
        );
      }
      output.accentColor = input.accentColor.toUpperCase();
    }
    if (input.privacyPolicyUrl !== undefined) {
      output.privacyPolicyUrl = this.optionalHttpsUrl(
        input.privacyPolicyUrl,
        'URL da política de privacidade',
      );
    }
    if (input.consentText !== undefined) {
      output.consentText = this.optionalText(input.consentText, 800);
    }
    if (input.consentRequired !== undefined) {
      output.consentRequired = Boolean(input.consentRequired);
    }
    if (input.createOpportunity !== undefined) {
      output.createOpportunity = Boolean(input.createOpportunity);
    }
    if (input.opportunityStage !== undefined) {
      const opportunityStage = this.requireText(
        input.opportunityStage,
        'Etapa da oportunidade',
        80,
      );

      if (
        !DIEX_FORM_OPPORTUNITY_STAGES.includes(
          opportunityStage as (typeof DIEX_FORM_OPPORTUNITY_STAGES)[number],
        )
      ) {
        throw new BadRequestException(
          'A etapa inicial informada não existe no funil comercial.',
        );
      }

      output.opportunityStage = opportunityStage;
    }
    if (input.ownerId !== undefined) {
      if (input.ownerId !== null && !UUID_PATTERN.test(input.ownerId)) {
        throw new BadRequestException('O responsável informado é inválido.');
      }
      if (input.ownerId !== null) {
        await this.assertWorkspaceMemberExists(form.workspaceId, input.ownerId);
      }
      output.ownerId = input.ownerId;
    }
    if (input.settings !== undefined) {
      if (
        !input.settings ||
        Array.isArray(input.settings) ||
        typeof input.settings !== 'object' ||
        JSON.stringify(input.settings).length > 10_000
      ) {
        throw new BadRequestException(
          'As configurações avançadas do formulário são inválidas.',
        );
      }
      output.settings =
        input.settings as QueryDeepPartialEntity<DiexFormEntity>['settings'];
    }

    return output;
  }

  private normalizeFieldInput(input: DiexFormFieldInput): DiexFormFieldInput {
    this.assertEnumValue(input.type, FormFieldType, 'Tipo da pergunta');

    const label = this.requireText(input.label, 'Pergunta', 180);
    const name = input.name
      ? this.normalizeFieldName(input.name)
      : this.normalizeFieldName(label);
    const options = this.normalizeOptions(input.options ?? []);

    if (CHOICE_FIELD_TYPES.has(input.type) && options.length < 2) {
      throw new BadRequestException(
        'Perguntas de escolha precisam de pelo menos duas opções.',
      );
    }

    const validation = this.normalizeFieldValidation(input.validation ?? {});

    return {
      label,
      name,
      type: input.type,
      targetFieldName: this.optionalFieldName(input.targetFieldName),
      placeholder: this.optionalText(input.placeholder, 180),
      helpText: this.optionalText(input.helpText, 300),
      options: CHOICE_FIELD_TYPES.has(input.type) ? options : [],
      validation,
      isRequired: Boolean(input.isRequired),
      position:
        typeof input.position === 'number'
          ? Math.max(
              0,
              Math.min(MAX_FIELDS_PER_FORM - 1, Math.round(input.position)),
            )
          : undefined,
    };
  }

  private normalizeFieldValidation(
    input: Record<string, unknown>,
  ): Record<string, unknown> {
    const output: Record<string, unknown> = {};

    for (const key of ['minLength', 'maxLength', 'min', 'max'] as const) {
      const value = input[key];

      if (value === undefined || value === null || value === '') {
        continue;
      }

      const numericValue = Number(value);

      if (!Number.isFinite(numericValue)) {
        throw new BadRequestException(`A validação ${key} deve ser numérica.`);
      }

      output[key] =
        key === 'minLength' || key === 'maxLength'
          ? Math.max(0, Math.min(2_000, Math.round(numericValue)))
          : numericValue;
    }

    if (
      typeof output.minLength === 'number' &&
      typeof output.maxLength === 'number' &&
      output.minLength > output.maxLength
    ) {
      throw new BadRequestException(
        'O tamanho mínimo não pode ser maior que o tamanho máximo.',
      );
    }
    if (
      typeof output.min === 'number' &&
      typeof output.max === 'number' &&
      output.min > output.max
    ) {
      throw new BadRequestException(
        'O valor mínimo não pode ser maior que o valor máximo.',
      );
    }

    return output;
  }

  private normalizeOptions(options: DiexFormOption[]): DiexFormOption[] {
    if (!Array.isArray(options) || options.length > 50) {
      throw new BadRequestException(
        'Uma pergunta pode ter no máximo 50 opções.',
      );
    }

    const normalized = options.map((option) => ({
      label: this.requireText(option?.label, 'Rótulo da opção', 120),
      value: this.requireText(option?.value, 'Valor da opção', 120),
    }));
    const uniqueValues = new Set(normalized.map(({ value }) => value));

    if (uniqueValues.size !== normalized.length) {
      throw new BadRequestException(
        'As opções não podem ter valores repetidos.',
      );
    }

    return normalized;
  }

  private async freezeLegacyPublishedSnapshot(
    form: DiexFormEntity,
  ): Promise<void> {
    if (form.status !== FormStatus.PUBLISHED || form.publishedSnapshot) {
      return;
    }

    await this.formRepository.update(
      form.workspaceId,
      { id: form.id },
      {
        publishedSnapshot: this.buildPublishedSnapshot(
          form,
        ) as QueryDeepPartialEntity<DiexFormEntity>['publishedSnapshot'],
        publishedVersion: Math.max(1, form.draftVersion),
        publishedAt: form.publishedAt ?? new Date(),
      },
    );
  }

  private async touchDraftVersion(form: DiexFormEntity): Promise<void> {
    await this.formRepository.increment(
      form.workspaceId,
      { id: form.id },
      'draftVersion',
      1,
    );
  }

  private buildPublishedSnapshot(
    form: DiexFormEntity,
  ): DiexPublishedFormSnapshot {
    return {
      title: form.title,
      slug: form.slug,
      description: form.description ?? null,
      targetObject: form.targetObject,
      layout: form.layout,
      submitButtonLabel: form.submitButtonLabel,
      successTitle: form.successTitle,
      successMessage: form.successMessage,
      showLogo: form.showLogo,
      logoUrl: form.logoUrl ?? null,
      accentColor: form.accentColor,
      privacyPolicyUrl: form.privacyPolicyUrl ?? null,
      consentText: form.consentText ?? null,
      consentRequired: form.consentRequired,
      createOpportunity: form.createOpportunity,
      opportunityStage: form.opportunityStage,
      ownerId: form.ownerId ?? null,
      settings: form.settings ?? {},
      fields: [...(form.fields ?? [])]
        .sort((left, right) => left.position - right.position)
        .map((field) => ({
          label: field.label,
          name: field.name,
          type: field.type,
          targetFieldName: field.targetFieldName ?? null,
          placeholder: field.placeholder ?? null,
          helpText: field.helpText ?? null,
          options: field.options ?? [],
          validation: field.validation ?? {},
          isRequired: field.isRequired,
          position: field.position,
        })),
    };
  }

  private assertPublicationReady(form: DiexFormEntity): void {
    const mappedFields = form.fields.filter(({ targetFieldName }) =>
      Boolean(targetFieldName),
    );
    const mappedTargets = mappedFields.map(
      ({ targetFieldName }) => targetFieldName as string,
    );
    const duplicateTarget = mappedTargets.find(
      (target, index) => mappedTargets.indexOf(target) !== index,
    );

    if (duplicateTarget) {
      throw new BadRequestException(
        `O campo “${duplicateTarget}” do CRM está ligado a mais de uma pergunta.`,
      );
    }

    const requiredEmailField = mappedFields.find(
      ({ isRequired, targetFieldName }) =>
        isRequired && targetFieldName === 'email',
    );
    const requiredPhoneField = mappedFields.find(
      ({ isRequired, targetFieldName }) =>
        isRequired && targetFieldName === 'phone',
    );

    if (!requiredEmailField && !requiredPhoneField) {
      throw new BadRequestException(
        'Antes de publicar, torne obrigatório ao menos um campo mapeado como e-mail ou WhatsApp.',
      );
    }

    if (
      mappedFields.some(
        ({ targetFieldName, type }) =>
          (targetFieldName === 'email' && type !== FormFieldType.EMAIL) ||
          (targetFieldName === 'phone' && type !== FormFieldType.PHONE),
      )
    ) {
      throw new BadRequestException(
        'As perguntas mapeadas como e-mail e WhatsApp precisam usar os tipos correspondentes.',
      );
    }

    if (
      form.targetObject === FormTargetObject.COMPANY &&
      !mappedFields.some(
        ({ isRequired, targetFieldName }) =>
          isRequired && targetFieldName === 'companyName',
      )
    ) {
      throw new BadRequestException(
        'Formulários de empresa precisam de uma pergunta obrigatória mapeada como Empresa.',
      );
    }
  }

  private readPublishedSnapshot(
    form: DiexFormEntity,
  ): DiexPublishedFormSnapshot {
    return form.publishedSnapshot
      ? (form.publishedSnapshot as DiexPublishedFormSnapshot)
      : this.buildPublishedSnapshot(form);
  }

  private async persistAndMapSubmission({
    form,
    snapshot,
    rawPayload,
    source,
    context,
  }: {
    form: DiexFormEntity;
    snapshot: DiexPublishedFormSnapshot;
    rawPayload: Record<string, unknown>;
    source: FormSubmissionSource;
    context: DiexPublicSubmissionContext;
  }): Promise<DiexFormSubmissionEntity> {
    if (JSON.stringify(rawPayload).length > 100_000) {
      throw new BadRequestException(
        'O conteúdo enviado ultrapassa o limite permitido.',
      );
    }

    if (this.readSingleValue(rawPayload._hp)) {
      throw new BadRequestException('Não foi possível enviar o formulário.');
    }

    const idempotencyKey = this.normalizeIdempotencyKey(context.idempotencyKey);

    if (idempotencyKey) {
      const existing = await this.submissionRepository.findOne(
        form.workspaceId,
        {
          where: { formId: form.id, idempotencyKey },
        },
      );

      if (existing) {
        return existing;
      }
    }

    const submittedData = this.validateAndSanitizePayload(
      snapshot,
      rawPayload,
      context.strict ?? false,
    );
    const consentAccepted = this.readBoolean(rawPayload._consent);

    if (snapshot.consentRequired && !consentAccepted) {
      throw new BadRequestException(
        'É necessário aceitar o termo de consentimento para continuar.',
      );
    }

    const submission = {
      formId: form.id,
      workspaceId: form.workspaceId,
      submittedData,
      source,
      status: FormSubmissionStatus.RECEIVED,
      idempotencyKey,
      ipHash: context.ip
        ? this.hashPrivateValue(`${form.id}:ip:${context.ip}`)
        : null,
      userAgentHash: context.userAgent
        ? this.hashPrivateValue(
            `${form.id}:ua:${context.userAgent.slice(0, 512)}`,
          )
        : null,
      attribution: this.extractAttribution(rawPayload),
      consentAt: consentAccepted ? new Date() : null,
    };

    let saved: DiexFormSubmissionEntity;

    try {
      saved = await this.submissionRepository.save(
        form.workspaceId,
        submission,
      );
    } catch (error) {
      if (idempotencyKey) {
        const existing = await this.submissionRepository.findOne(
          form.workspaceId,
          {
            where: { formId: form.id, idempotencyKey },
          },
        );

        if (existing) {
          return existing;
        }
      }

      throw error;
    }

    try {
      const mapping = await this.mapSubmissionToCrm(
        form,
        snapshot,
        submittedData,
      );

      await this.submissionRepository.update(
        form.workspaceId,
        { id: saved.id },
        {
          ...mapping,
          status: FormSubmissionStatus.PROCESSED,
          processedAt: new Date(),
          processingError: null,
        },
      );
    } catch (error) {
      await this.submissionRepository.update(
        form.workspaceId,
        { id: saved.id },
        {
          status: FormSubmissionStatus.FAILED,
          processingError: this.safeErrorMessage(error),
        },
      );
    }

    return (
      (await this.submissionRepository.findOne(form.workspaceId, {
        where: { id: saved.id },
      })) ?? saved
    );
  }

  private validateAndSanitizePayload(
    snapshot: DiexPublishedFormSnapshot,
    payload: Record<string, unknown>,
    strict: boolean,
  ): Record<string, unknown> {
    const allowedNames = new Set(snapshot.fields.map(({ name }) => name));

    if (strict) {
      const unexpected = Object.keys(payload).filter(
        (key) => !key.startsWith('_') && !allowedNames.has(key),
      );

      if (unexpected.length > 0) {
        throw new BadRequestException('O formulário contém campos inválidos.');
      }
    }

    const cleaned: Record<string, unknown> = {};

    for (const field of snapshot.fields) {
      const rawValue = payload[field.name];
      const values = Array.isArray(rawValue)
        ? rawValue.map((value) => String(value).trim()).filter(Boolean)
        : undefined;
      const singleValue = values
        ? undefined
        : rawValue === undefined || rawValue === null
          ? ''
          : String(rawValue).trim();
      const isEmpty = values ? values.length === 0 : singleValue === '';

      if (values && field.type !== FormFieldType.MULTI_SELECT) {
        throw new BadRequestException(
          `O campo “${field.label}” aceita apenas uma resposta.`,
        );
      }

      if (field.isRequired && isEmpty) {
        throw new BadRequestException(`Preencha o campo “${field.label}”.`);
      }

      if (isEmpty) {
        cleaned[field.name] = values ?? '';
        continue;
      }

      const maxLength = Number(
        field.validation.maxLength ?? this.defaultMaxLengthForType(field.type),
      );
      const minLength = Number(field.validation.minLength ?? 0);

      if (values) {
        if (values.length > 50 || values.some((value) => value.length > 120)) {
          throw new BadRequestException(
            `O campo “${field.label}” ultrapassa o limite permitido.`,
          );
        }
      } else if (
        singleValue !== undefined &&
        (singleValue.length > Math.min(2_000, maxLength) ||
          singleValue.length < Math.max(0, minLength))
      ) {
        throw new BadRequestException(
          `O campo “${field.label}” não respeita o tamanho permitido.`,
        );
      }

      if (
        field.type === FormFieldType.EMAIL &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(singleValue ?? '')
      ) {
        throw new BadRequestException('Informe um e-mail válido.');
      }

      if (field.type === FormFieldType.URL) {
        this.requireHttpsUrl(singleValue ?? '', field.label);
      }

      if (
        field.type === FormFieldType.PHONE &&
        !this.normalizePhone(singleValue)
      ) {
        throw new BadRequestException(
          `Informe um telefone válido em “${field.label}”.`,
        );
      }

      if (
        field.type === FormFieldType.DATE &&
        !this.isValidIsoDate(singleValue ?? '')
      ) {
        throw new BadRequestException(
          `Informe uma data válida em “${field.label}”.`,
        );
      }

      if (
        [
          FormFieldType.NUMBER,
          FormFieldType.CURRENCY,
          FormFieldType.RATING,
        ].includes(field.type)
      ) {
        const numericValue = Number(
          (singleValue ?? '').replace(',', '.').replace(/[^0-9.-]/g, ''),
        );

        if (!Number.isFinite(numericValue)) {
          throw new BadRequestException(
            `Informe um número válido em “${field.label}”.`,
          );
        }
        if (
          field.type === FormFieldType.RATING &&
          (!Number.isInteger(numericValue) ||
            numericValue < 1 ||
            numericValue > 5)
        ) {
          throw new BadRequestException(
            `A avaliação de “${field.label}” deve estar entre 1 e 5.`,
          );
        }
        const minimum = Number(
          field.validation.min ?? Number.NEGATIVE_INFINITY,
        );
        const maximum = Number(
          field.validation.max ?? Number.POSITIVE_INFINITY,
        );

        if (numericValue < minimum || numericValue > maximum) {
          throw new BadRequestException(
            `O valor de “${field.label}” está fora do intervalo permitido.`,
          );
        }
        cleaned[field.name] = numericValue;
        continue;
      }

      if (CHOICE_FIELD_TYPES.has(field.type)) {
        const allowedValues = new Set(field.options.map(({ value }) => value));
        const submittedValues = values ?? [singleValue ?? ''];

        if (submittedValues.some((value) => !allowedValues.has(value))) {
          throw new BadRequestException(
            `Uma opção inválida foi enviada em “${field.label}”.`,
          );
        }
      }

      if (field.type === FormFieldType.CHECKBOX) {
        const checked = this.readBoolean(rawValue);

        if (field.isRequired && !checked) {
          throw new BadRequestException(`Confirme o campo “${field.label}”.`);
        }
        cleaned[field.name] = checked;
      } else {
        cleaned[field.name] = values ?? singleValue;
      }
    }

    return cleaned;
  }

  private async mapSubmissionToCrm(
    form: DiexFormEntity,
    snapshot: DiexPublishedFormSnapshot,
    submittedData: Record<string, unknown>,
  ): Promise<CrmMappingResult> {
    const mappedData = this.mapAnswersByTarget(snapshot, submittedData);
    const fullName = this.pickText(mappedData, ['name', 'fullName', 'nome']);
    const email = this.pickText(mappedData, ['email', 'e-mail'])?.toLowerCase();
    const rawPhone = this.pickText(mappedData, [
      'phone',
      'whatsapp',
      'telefone',
    ]);
    const normalizedPhone = this.normalizePhone(rawPhone);
    const companyName = this.pickText(mappedData, [
      'companyName',
      'company',
      'empresa',
    ]);
    const jobTitle = this.pickText(mappedData, ['jobTitle', 'cargo']);
    const budget = this.pickNumber(mappedData, ['budget', 'orcamento']);
    const authContext = buildSystemAuthContext(form.workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const [personRepository, companyRepository, opportunityRepository] =
          await Promise.all([
            this.globalWorkspaceOrmManager.getRepository<PersonWorkspaceEntity>(
              form.workspaceId,
              PersonWorkspaceEntity,
              { shouldBypassPermissionChecks: true },
            ),
            this.globalWorkspaceOrmManager.getRepository<CompanyWorkspaceEntity>(
              form.workspaceId,
              CompanyWorkspaceEntity,
              { shouldBypassPermissionChecks: true },
            ),
            this.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
              form.workspaceId,
              OpportunityWorkspaceEntity,
              { shouldBypassPermissionChecks: true },
            ),
          ]);
        // O context do ator só aceita provider; o formulário de origem já fica
        // registrado na própria submissão.
        const actor = {
          source: FieldActorSource.WEBHOOK,
          workspaceMemberId: null,
          name: 'Diex Forms',
          context: {},
        };

        const emailMatches = email
          ? await personRepository.find({
              where: {
                emails: {
                  primaryEmail: Raw(
                    (alias) => `LOWER(${alias}) = LOWER(:submittedEmail)`,
                    { submittedEmail: email },
                  ),
                },
              },
              take: 2,
            })
          : [];
        const phoneMatches = normalizedPhone
          ? await personRepository.find({
              where: { whatsappNormalizedPhone: normalizedPhone },
              take: 2,
            })
          : [];
        const uniqueCandidates = new Map(
          [...emailMatches, ...phoneMatches].map((person) => [
            person.id,
            person,
          ]),
        );

        if (uniqueCandidates.size > 1) {
          throw new Error(
            'E-mail e telefone correspondem a contatos diferentes; a resposta foi preservada para revisão manual.',
          );
        }

        let companyId: string | null = null;

        if (companyName) {
          const companies = await companyRepository.find({
            where: {
              name: Raw(
                (alias) => `LOWER(${alias}) = LOWER(:submittedCompanyName)`,
                { submittedCompanyName: companyName.trim() },
              ),
            },
            take: 2,
          });

          if (companies.length === 1) {
            companyId = companies[0].id;
          } else if (companies.length === 0) {
            const insertedCompany = await companyRepository.insert({
              name: companyName,
              domainName: null,
              address: null,
              position: 0,
              createdBy: actor,
              updatedBy: actor,
            } as never);

            companyId =
              (insertedCompany.identifiers[0]?.id as string | undefined) ??
              null;
          } else {
            throw new Error(
              'Mais de uma empresa possui esse nome; a resposta foi preservada para revisão manual.',
            );
          }
        }

        let person =
          uniqueCandidates.size === 1
            ? [...uniqueCandidates.values()][0]
            : undefined;

        if (person) {
          const update: QueryDeepPartialEntity<PersonWorkspaceEntity> = {};

          if (fullName && !person.name?.firstName) {
            update.name = splitDisplayName(fullName);
          }
          if (email && !person.emails?.primaryEmail) {
            update.emails = { primaryEmail: email, additionalEmails: null };
          }
          if (normalizedPhone && !person.phones?.primaryPhoneNumber) {
            update.phones = buildPhonesValue(normalizedPhone);
            update.whatsappNormalizedPhone = normalizedPhone;
          }
          if (companyId && !person.companyId) {
            update.companyId = companyId;
          }
          if (jobTitle && !person.jobTitle) {
            update.jobTitle = jobTitle;
          }

          if (Object.keys(update).length > 0) {
            update.updatedBy = actor;
            await personRepository.update(person.id, update);
          }
        } else if (fullName || email || normalizedPhone) {
          const displayName =
            fullName ?? email?.split('@')[0] ?? 'Novo contato do formulário';
          const insertedPerson = await personRepository.insert({
            name: splitDisplayName(displayName),
            ...(email
              ? {
                  emails: {
                    primaryEmail: email,
                    additionalEmails: null,
                  },
                }
              : {}),
            ...(normalizedPhone
              ? {
                  phones: buildPhonesValue(normalizedPhone),
                  whatsappNormalizedPhone: normalizedPhone,
                }
              : {}),
            companyId,
            jobTitle: jobTitle ?? null,
            doNotContact: false,
            position: 0,
            createdBy: actor,
            updatedBy: actor,
          });
          const personId = insertedPerson.identifiers[0]?.id as
            | string
            | undefined;

          if (personId) {
            person =
              (await personRepository.findOne({
                where: { id: personId },
              })) ?? undefined;
          }
        }

        let opportunityId: string | null = null;
        const shouldCreateOpportunity =
          snapshot.createOpportunity ||
          snapshot.targetObject === FormTargetObject.OPPORTUNITY;

        if (shouldCreateOpportunity) {
          const opportunityName =
            this.pickText(mappedData, ['opportunityName', 'dealName']) ??
            `${form.title} — ${fullName ?? companyName ?? 'Novo lead'}`;
          const insertedOpportunity = await opportunityRepository.insert({
            name: opportunityName.slice(0, 255),
            stage: snapshot.opportunityStage || 'NEW',
            position: 0,
            pointOfContactId: person?.id ?? null,
            companyId,
            ownerId: snapshot.ownerId,
            ...(budget !== null
              ? {
                  amount: {
                    amountMicros: Math.round(budget * 1_000_000),
                    currencyCode: 'BRL',
                  },
                }
              : {}),
            nextCommercialAction: 'Responder o lead recebido pelo formulário',
            nextCommercialActionAt: new Date(),
            dealRisk: 'UNKNOWN',
            createdBy: actor,
            updatedBy: actor,
          });

          opportunityId =
            (insertedOpportunity.identifiers[0]?.id as string | undefined) ??
            null;
        }

        const mappedRecordId =
          snapshot.targetObject === FormTargetObject.OPPORTUNITY
            ? opportunityId
            : snapshot.targetObject === FormTargetObject.COMPANY
              ? companyId
              : (person?.id ?? null);

        return {
          personId: person?.id ?? null,
          companyId,
          opportunityId,
          mappedRecordId,
        };
      },
      authContext,
    );
  }

  private mapAnswersByTarget(
    snapshot: DiexPublishedFormSnapshot,
    submittedData: Record<string, unknown>,
  ): Record<string, unknown> {
    const mapped: Record<string, unknown> = { ...submittedData };

    for (const field of snapshot.fields) {
      if (field.targetFieldName && submittedData[field.name] !== undefined) {
        mapped[field.targetFieldName] = submittedData[field.name];
      }
    }

    return mapped;
  }

  private async assertWorkspaceMemberExists(
    workspaceId: string,
    workspaceMemberId: string,
  ): Promise<void> {
    const authContext = buildSystemAuthContext(workspaceId);
    const exists =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const repository =
            await this.globalWorkspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
              workspaceId,
              WorkspaceMemberWorkspaceEntity,
              { shouldBypassPermissionChecks: true },
            );

          return repository.exists({ where: { id: workspaceMemberId } });
        },
        authContext,
      );

    if (!exists) {
      throw new BadRequestException(
        'O responsável informado não pertence a este workspace.',
      );
    }
  }

  private extractAttribution(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const attribution: Record<string, unknown> = {};

    for (const key of [
      '_utm_source',
      '_utm_medium',
      '_utm_campaign',
      '_utm_content',
      '_utm_term',
      '_referrer',
      '_landing_page',
    ]) {
      const value = this.readSingleValue(payload[key]);

      if (value) {
        attribution[key.slice(1)] = value.slice(0, 500);
      }
    }

    return attribution;
  }

  private assertValidPublicToken(
    formId: string,
    publishedVersion: number,
    token?: string | null,
  ): void {
    const [timestamp, entropy, signature, ...extra] = token?.split('.') ?? [];
    const parsedTimestamp = Number(timestamp);

    if (
      extra.length > 0 ||
      !timestamp ||
      !entropy ||
      !signature ||
      !Number.isFinite(parsedTimestamp) ||
      parsedTimestamp > Date.now() + 60_000 ||
      Date.now() - parsedTimestamp > MAX_PUBLIC_TOKEN_AGE_MS
    ) {
      throw new BadRequestException(
        'Esta sessão do formulário expirou. Atualize a página e tente novamente.',
      );
    }

    const expected = this.sign(
      `${formId}:${publishedVersion}:${timestamp}:${entropy}`,
    );
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      throw new BadRequestException(
        'Esta sessão do formulário é inválida. Atualize a página.',
      );
    }
  }

  private sign(value: string): string {
    return createHmac('sha256', this.diexConfigService.get('APP_SECRET'))
      .update(value)
      .digest('base64url');
  }

  private hashPrivateValue(value: string): string {
    return createHmac('sha256', this.diexConfigService.get('APP_SECRET'))
      .update(value)
      .digest('hex');
  }

  private async buildUniqueSlug(
    workspaceId: string,
    title: string,
  ): Promise<string> {
    const baseSlug = this.normalizeSlug(title);

    for (let suffix = 1; suffix <= 100; suffix += 1) {
      const suffixText = suffix === 1 ? '' : `-${suffix}`;
      const slug = `${baseSlug.slice(0, 80 - suffixText.length)}${suffixText}`;
      const existing = await this.formRepository.findOne(workspaceId, {
        where: { slug },
      });

      if (!existing) {
        return slug;
      }
    }

    throw new BadRequestException(
      'Não foi possível gerar um endereço único para o formulário.',
    );
  }

  private async buildUniqueFieldName(
    formId: string,
    source: string,
    excludedId?: string,
  ): Promise<string> {
    const baseName = this.normalizeFieldName(source);

    for (let suffix = 1; suffix <= 100; suffix += 1) {
      const suffixText = suffix === 1 ? '' : `_${suffix}`;
      const name = `${baseName.slice(0, 64 - suffixText.length)}${suffixText}`;
      const existing = await this.fieldRepository.findOne({
        where: { formId, name },
      });

      if (!existing || existing.id === excludedId) {
        return name;
      }
    }

    throw new BadRequestException(
      'Não foi possível gerar um identificador único para a pergunta.',
    );
  }

  private normalizeSlug(value: string): string {
    const normalized = this.slugify(value).slice(0, 80);

    if (!normalized) {
      throw new BadRequestException('Informe um endereço válido.');
    }

    return normalized;
  }

  private normalizeSubdomain(value: string): string {
    const normalized = value.trim().toLowerCase();

    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(normalized)) {
      throw new NotFoundException('Formulário não encontrado.');
    }

    return normalized;
  }

  private normalizeFieldName(value: string): string {
    const normalized = this.slugify(value).replace(/-/g, '_').slice(0, 64);
    const safe = /^[a-z]/.test(normalized) ? normalized : `field_${normalized}`;

    if (!FIELD_NAME_PATTERN.test(safe)) {
      throw new BadRequestException(
        'O identificador da pergunta deve usar letras, números e sublinhado.',
      );
    }

    return safe;
  }

  private optionalFieldName(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim();

    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(normalized)) {
      throw new BadRequestException(
        'O campo de destino deve usar somente letras, números e sublinhado.',
      );
    }

    return normalized;
  }

  private slugify(value: string): string {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private requireText(
    value: unknown,
    fieldLabel: string,
    maxLength: number,
  ): string {
    const normalized = typeof value === 'string' ? value.trim() : '';

    if (!normalized) {
      throw new BadRequestException(`${fieldLabel} é obrigatório.`);
    }
    if (normalized.length > maxLength) {
      throw new BadRequestException(
        `${fieldLabel} pode ter no máximo ${maxLength} caracteres.`,
      );
    }

    return normalized;
  }

  private optionalText(value: unknown, maxLength: number): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return this.requireText(value, 'Texto', maxLength);
  }

  private optionalHttpsUrl(value: unknown, fieldLabel: string): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return this.requireHttpsUrl(String(value), fieldLabel);
  }

  private requireHttpsUrl(value: string, fieldLabel: string): string {
    try {
      const url = new URL(value);

      if (url.protocol !== 'https:') {
        throw new Error('invalid protocol');
      }

      return url.toString();
    } catch {
      throw new BadRequestException(`${fieldLabel} deve ser uma URL HTTPS.`);
    }
  }

  private assertEnumValue<T extends Record<string, string>>(
    value: string,
    enumObject: T,
    fieldLabel: string,
  ): void {
    if (!Object.values(enumObject).includes(value)) {
      throw new BadRequestException(`${fieldLabel} é inválido.`);
    }
  }

  private normalizeIdempotencyKey(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim();

    if (!/^[a-zA-Z0-9._:-]{8,120}$/.test(normalized)) {
      throw new BadRequestException('A chave de idempotência é inválida.');
    }

    return normalized;
  }

  private normalizePhone(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const digits = value.replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 15) {
      return null;
    }

    return digits.length === 10 || digits.length === 11
      ? `55${digits}`
      : digits;
  }

  private defaultMaxLengthForType(type: FormFieldType): number {
    switch (type) {
      case FormFieldType.EMAIL:
        return 320;
      case FormFieldType.PHONE:
        return 40;
      case FormFieldType.DATE:
        return 10;
      case FormFieldType.URL:
        return 2_000;
      case FormFieldType.TEXTAREA:
        return 2_000;
      default:
        return 500;
    }
  }

  private isValidIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  private pickText(
    data: Record<string, unknown>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = this.readSingleValue(data[key]);

      if (value) {
        return value;
      }
    }

    return null;
  }

  private pickNumber(
    data: Record<string, unknown>,
    keys: string[],
  ): number | null {
    for (const key of keys) {
      const value = data[key];

      if (
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        continue;
      }

      const number =
        typeof value === 'number'
          ? value
          : Number(
              String(value ?? '')
                .replace(',', '.')
                .replace(/[^0-9.-]/g, ''),
            );

      if (Number.isFinite(number)) {
        return number;
      }
    }

    return null;
  }

  private readSingleValue(value: unknown): string | null {
    if (Array.isArray(value)) {
      const first = value.find((item) => String(item).trim());

      return first === undefined ? null : String(first).trim();
    }

    if (value === null || value === undefined) {
      return null;
    }

    return String(value).trim() || null;
  }

  private readBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    return ['true', '1', 'yes', 'on', 'sim'].includes(
      String(value ?? '')
        .trim()
        .toLowerCase(),
    );
  }

  private safeErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);

    return message.replace(/[\r\n]+/g, ' ').slice(0, 1_000);
  }
}
