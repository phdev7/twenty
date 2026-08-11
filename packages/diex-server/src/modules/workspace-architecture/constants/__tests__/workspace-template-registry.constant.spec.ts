import { WORKSPACE_TEMPLATE_REGISTRY } from 'src/modules/workspace-architecture/constants/workspace-template-registry.constant';

// Uma destas frases de cada lista da baseline. Se um template conseguir nascer
// sem elas, a proibição deixou de ser estrutural e virou convenção, que é
// exatamente o que defineTemplate existe para impedir.
const BASELINE_RULE =
  'Não reutilizar dado de um workspace em outro, nem em treinamento, avaliação ou exemplo.';
const BASELINE_INSTRUCTION =
  'Toda comunicação externa sai em nome do responsável pelo workspace e sob a configuração definida por ele.';

describe('WORKSPACE_TEMPLATE_REGISTRY', () => {
  it('should carry the responsibility baseline in every template', () => {
    const missingRule = WORKSPACE_TEMPLATE_REGISTRY.filter(
      (template) => !template.forbiddenRules.includes(BASELINE_RULE),
    ).map((template) => template.id);

    const missingInstruction = WORKSPACE_TEMPLATE_REGISTRY.filter(
      (template) => !template.aiInstructions.includes(BASELINE_INSTRUCTION),
    ).map((template) => template.id);

    expect({ missingRule, missingInstruction }).toEqual({
      missingRule: [],
      missingInstruction: [],
    });
  });

  it('should let a regulated template add rules without dropping the baseline', () => {
    const healthcare = WORKSPACE_TEMPLATE_REGISTRY.find(
      (template) => template.id === 'diex.business.healthcare-clinic',
    );

    expect(healthcare?.forbiddenRules).toContain(BASELINE_RULE);
    expect(
      healthcare?.forbiddenRules.some((rule) =>
        rule.includes('antes e depois'),
      ),
    ).toBe(true);
  });

  it('should resolve every declared dependency to a registered template', () => {
    const registeredIds = new Set(
      WORKSPACE_TEMPLATE_REGISTRY.map((template) => template.id),
    );

    const unresolved = WORKSPACE_TEMPLATE_REGISTRY.flatMap((template) =>
      template.dependencies
        .filter((dependency) => !registeredIds.has(dependency))
        .map((dependency) => `${template.id} -> ${dependency}`),
    );

    expect(unresolved).toEqual([]);
  });
});
