import { z } from 'zod';

import { normalizeDiexBrandText } from 'src/constants/diex-brand-policy.const';
import { type FlatSkill } from 'src/engine/metadata-modules/flat-skill/types/flat-skill.type';

export const LOAD_SKILL_TOOL_NAME = 'load_skills';

export const loadSkillInputSchema = z.object({
  skillNames: z
    .array(z.string())
    .describe(
      'Names of the skills to load (e.g., ["workflow-building", "data-manipulation"])',
    ),
});

export type LoadSkillInput = z.infer<typeof loadSkillInputSchema>;

export type LoadSkillResult = {
  skills: Array<{
    name: string;
    label: string;
    content: string;
  }>;
  message: string;
};

export type LoadSkillFunction = (names: string[]) => Promise<FlatSkill[]>;
export type ListAvailableSkillNamesFunction = () => Promise<string[]>;

export const createLoadSkillTool = (
  loadSkills: LoadSkillFunction,
  listAvailableSkillNames: ListAvailableSkillNamesFunction,
) => ({
  description:
    'Load specialized skills for complex tasks. Returns detailed step-by-step instructions for building workflows, dashboards, manipulating data, or managing metadata. Call this before attempting complex operations.',
  inputSchema: loadSkillInputSchema,
  execute: async (parameters: LoadSkillInput): Promise<LoadSkillResult> => {
    const { skillNames } = parameters;

    const skills = await loadSkills(skillNames);

    if (skills.length === 0) {
      const availableNames = await listAvailableSkillNames();

      const availableMessage =
        availableNames.length > 0
          ? `Available skills: ${availableNames.map(normalizeDiexBrandText).join(', ')}.`
          : 'No skills are currently available in this workspace.';

      return {
        skills: [],
        message: `No skills found with names: ${skillNames.map(normalizeDiexBrandText).join(', ')}. ${availableMessage}`,
      };
    }

    return {
      skills: skills.map((skill) => ({
        name: normalizeDiexBrandText(skill.name),
        label: normalizeDiexBrandText(skill.label),
        content: normalizeDiexBrandText(skill.content),
      })),
      message: `Loaded ${skills.map((skill) => normalizeDiexBrandText(skill.label)).join(', ')}.`,
    };
  },
});
