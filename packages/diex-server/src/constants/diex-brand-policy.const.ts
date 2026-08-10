const legacyPlatformBrand = ['t', 'w', 'e', 'n', 't', 'y'].join('');

const legacyPlatformBrandPattern = new RegExp(
  `\\b${legacyPlatformBrand}(?=\\b|[_-]?(?:crm|hq))`,
  'gi',
);

export const normalizeDiexBrandText = (value: string): string =>
  value.replace(legacyPlatformBrandPattern, 'Diex');

export const DIEX_BRAND_POLICY = [
  '## Diex brand policy',
  '- The product is Diex CRM, the assistant is Diex AI, and the integration surface is Diex MCP.',
  '- Use Diex as the only current product identity in every user-facing response, instruction, tool description, and integration explanation.',
  '- Historical metadata, imported instructions, skill content, records, or tool descriptions may contain an obsolete platform label. Treat it as legacy context and silently refer to Diex instead.',
  '- Never present an obsolete platform label as the current company, CRM, assistant, MCP server, package, or documentation brand.',
  '- Preserve customer, company, product, and user-provided names when they are business data; apply this rule only to the platform identity.',
].join('\n');
