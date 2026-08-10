'use client';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';

import { ChipMultiSelect, Field, TextareaField, TextField } from '@/ui';

import { PARTNER_DIEX_EXPERIENCE_OPTIONS } from '../../data/partner-diex-experience-options';
import { PARTNER_APPLICATION_COPY } from '../../partner-application-copy';
import { type PartnerApplicationController } from '../../use-partner-application-state';

const FIELDS = PARTNER_APPLICATION_COPY.fields;

export function ExperienceStep({
  controller,
}: {
  controller: PartnerApplicationController;
}) {
  const { i18n } = useLingui();
  const { setField, state, toggleExperience } = controller;

  const experienceOptions = PARTNER_DIEX_EXPERIENCE_OPTIONS.map((option) => ({
    label: i18n._(option.label),
    value: option.value,
  }));

  return (
    <>
      <Field
        hint={i18n._(FIELDS.diexExperienceHint)}
        label={i18n._(FIELDS.diexExperience)}
      >
        <ChipMultiSelect
          ariaLabel={i18n._(FIELDS.diexExperience)}
          invalid={state.fieldErrors.diexExperience !== undefined}
          onToggle={toggleExperience}
          options={experienceOptions}
          values={state.diexExperience}
        />
      </Field>
      <Field
        hint={i18n._(FIELDS.diexExperienceNotesHint)}
        label={i18n._(FIELDS.diexExperienceNotes)}
      >
        <TextareaField
          ariaLabel={i18n._(FIELDS.diexExperienceNotes)}
          invalid={state.fieldErrors.diexExperienceNotes !== undefined}
          name="diexExperienceNotes"
          onValueChange={(value) => setField('diexExperienceNotes', value)}
          placeholder={i18n._(FIELDS.diexExperienceNotesPlaceholder)}
          value={state.diexExperienceNotes}
        />
      </Field>
      <Field
        hint={i18n._(FIELDS.diexExperienceProofLinkHint)}
        label={i18n._(FIELDS.diexExperienceProofLink)}
      >
        <TextField
          ariaLabel={i18n._(FIELDS.diexExperienceProofLink)}
          inputMode="url"
          invalid={state.fieldErrors.diexExperienceProofLink !== undefined}
          name="diexExperienceProofLink"
          onValueChange={(value) =>
            setField('diexExperienceProofLink', value)
          }
          placeholder={i18n._(msg`https://`)}
          value={state.diexExperienceProofLink}
        />
      </Field>
    </>
  );
}
