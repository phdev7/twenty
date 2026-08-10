import { INITIAL_PARTNER_APPLICATION_STATE } from './partner-application-state';
import { validatePartnerApplicationStep } from './validate-partner-application-step';

const validExperienceNotes =
  'Built a custom Diex app for a property-management client, modeled leases and ' +
  'tenants as data models, automated renewal workflows, and shipped a front component ' +
  'for the broker dashboard with role-based views.';

describe('validatePartnerApplicationStep', () => {
  it('requires experience milestones, narrative, and proof URL on Experience', () => {
    const errors = validatePartnerApplicationStep({
      ...INITIAL_PARTNER_APPLICATION_STATE,
      stepIndex: 3,
    });
    expect(errors.diexExperience).toBe('required');
    expect(errors.diexExperienceNotes).toBe('required');
    expect(errors.diexExperienceProofLink).toBe('required');
  });

  it('rejects a narrative under 200 characters on Experience', () => {
    const errors = validatePartnerApplicationStep({
      ...INITIAL_PARTNER_APPLICATION_STATE,
      stepIndex: 3,
      diexExperience: ['WORKFLOWS'],
      diexExperienceNotes: 'Too short for a real implementation narrative.',
      diexExperienceProofLink: 'https://www.loom.com/share/example',
    });
    expect(errors.diexExperienceNotes).toBe('too_short');
  });

  it('rejects an invalid proof URL on Experience', () => {
    const errors = validatePartnerApplicationStep({
      ...INITIAL_PARTNER_APPLICATION_STATE,
      stepIndex: 3,
      diexExperience: ['CUSTOM_APPS'],
      diexExperienceNotes: validExperienceNotes,
      diexExperienceProofLink: 'not-a-url',
    });
    expect(errors.diexExperienceProofLink).toBe('invalid_url');
  });

  it('accepts a complete Experience step', () => {
    const errors = validatePartnerApplicationStep({
      ...INITIAL_PARTNER_APPLICATION_STATE,
      stepIndex: 3,
      diexExperience: ['CUSTOM_APPS', 'DATA_MODELS'],
      diexExperienceNotes: validExperienceNotes,
      diexExperienceProofLink: 'https://www.loom.com/share/example',
    });
    expect(errors).toEqual({});
  });
});
