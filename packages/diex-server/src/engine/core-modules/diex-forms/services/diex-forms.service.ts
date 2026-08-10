import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DiexFormEntity, FormStatus, FormTargetObject } from 'src/engine/core-modules/diex-forms/entities/diex-form.entity';
import { DiexFormFieldEntity, FormFieldType } from 'src/engine/core-modules/diex-forms/entities/diex-form-field.entity';
import { DiexFormSubmissionEntity, FormSubmissionSource } from 'src/engine/core-modules/diex-forms/entities/diex-form-submission.entity';

@Injectable()
export class DiexFormsService {
  constructor(
    @InjectRepository(DiexFormEntity)
    private readonly formRepository: Repository<DiexFormEntity>,
    @InjectRepository(DiexFormFieldEntity)
    private readonly fieldRepository: Repository<DiexFormFieldEntity>,
    @InjectRepository(DiexFormSubmissionEntity)
    private readonly submissionRepository: Repository<DiexFormSubmissionEntity>,
  ) {}

  async createForm(workspaceId: string, title: string, targetObject: FormTargetObject): Promise<DiexFormEntity> {
    const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const form = this.formRepository.create({
      workspaceId,
      title,
      slug,
      targetObject,
      status: FormStatus.PUBLISHED,
    });

    const savedForm = await this.formRepository.save(form);

    const defaultFields = [
      this.fieldRepository.create({
        formId: savedForm.id,
        label: 'Nome Completo',
        name: 'name',
        type: FormFieldType.TEXT,
        targetFieldName: 'name',
        isRequired: true,
        position: 0,
      }),
      this.fieldRepository.create({
        formId: savedForm.id,
        label: 'E-mail',
        name: 'email',
        type: FormFieldType.EMAIL,
        targetFieldName: 'email',
        isRequired: true,
        position: 1,
      }),
      this.fieldRepository.create({
        formId: savedForm.id,
        label: 'Telefone / WhatsApp',
        name: 'phone',
        type: FormFieldType.PHONE,
        targetFieldName: 'phone',
        isRequired: false,
        position: 2,
      }),
    ];

    await this.fieldRepository.save(defaultFields);
    return await this.getFormById(savedForm.id);
  }

  async getFormById(id: string): Promise<DiexFormEntity> {
    const form = await this.formRepository.findOne({
      where: { id },
      relations: ['fields'],
    });

    if (!form) {
      throw new NotFoundException('Formulário não encontrado.');
    }

    return form;
  }

  async getFormBySlug(workspaceId: string, slug: string): Promise<DiexFormEntity> {
    const form = await this.formRepository.findOne({
      where: { workspaceId, slug },
      relations: ['fields'],
    });

    if (!form) {
      throw new NotFoundException(`Formulário com identificador "${slug}" não encontrado.`);
    }

    return form;
  }

  async listWorkspaceForms(workspaceId: string): Promise<DiexFormEntity[]> {
    return await this.formRepository.find({
      where: { workspaceId },
      relations: ['fields'],
      order: { createdAt: 'DESC' },
    });
  }

  async addFieldToForm(
    formId: string,
    label: string,
    type: FormFieldType,
    isRequired = false,
  ): Promise<DiexFormFieldEntity> {
    const form = await this.getFormById(formId);
    const position = form.fields ? form.fields.length : 0;
    const name = label.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const field = this.fieldRepository.create({
      formId: form.id,
      label,
      name,
      type,
      targetFieldName: name,
      isRequired,
      position,
    });

    return await this.fieldRepository.save(field);
  }

  async deleteFormField(fieldId: string): Promise<boolean> {
    const res = await this.fieldRepository.delete({ id: fieldId });
    return (res.affected ?? 0) > 0;
  }

  async processSubmission(
    formId: string,
    rawPayload: Record<string, any>,
    source: FormSubmissionSource = FormSubmissionSource.INTERNAL_FORM,
  ): Promise<DiexFormSubmissionEntity> {
    const form = await this.getFormById(formId);

    const sanitizedData = this.sanitizeAndExtractData(rawPayload);

    const submission = this.submissionRepository.create({
      formId: form.id,
      workspaceId: form.workspaceId,
      submittedData: sanitizedData,
      source,
    });

    return await this.submissionRepository.save(submission);
  }

  async listSubmissionsForForm(formId: string): Promise<DiexFormSubmissionEntity[]> {
    return await this.submissionRepository.find({
      where: { formId },
      order: { createdAt: 'DESC' },
    });
  }

  private sanitizeAndExtractData(payload: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};

    for (const [key, val] of Object.entries(payload)) {
      if (key.startsWith('_')) continue;
      if (typeof val === 'string') {
        cleaned[key] = val.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else {
        cleaned[key] = val;
      }
    }

    return cleaned;
  }
}
