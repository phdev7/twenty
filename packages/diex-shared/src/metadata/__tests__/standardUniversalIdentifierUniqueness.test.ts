import { DIEX_STANDARD_OBJECT_EXTENSION_FIELDS } from '@/metadata/constants/diex-standard-object-extension-fields.constant';
import { DIEX_STANDARD_OBJECTS } from '@/metadata/constants/diex-standard-object.constant';
import { INBOX_STANDARD_OBJECTS } from '@/metadata/constants/inbox-standard-object.constant';
import { STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS } from '@/metadata/constants/standard-page-layout-universal-identifiers.constant';
import { STANDARD_OBJECTS } from '@/metadata/constants/standard-object.constant';

// A universal identifier is the primary key the migration builder resolves every
// standard entity against, and it is unique per application across ALL metadata
// kinds, not per kind. Two registries once handed the same id to a view and to an
// object; the view was created first and every workspace activation then failed
// with ENTITY_ALREADY_EXISTS, which surfaced only as "could not approve this
// workspace". Nothing but this test stands between that mistake and production.
const REGISTRIES = {
  STANDARD_OBJECTS,
  DIEX_STANDARD_OBJECTS,
  DIEX_STANDARD_OBJECT_EXTENSION_FIELDS,
  INBOX_STANDARD_OBJECTS,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} as const;

// The declaring object is carried alongside the path because registries spread
// each other: DIEX_STANDARD_OBJECT_EXTENSION_FIELDS entries are reachable both
// directly and through STANDARD_OBJECTS. Those are one entity seen twice, and
// the shared object reference is what tells them apart from a true collision.
type IdentifierOccurrence = {
  registry: string;
  path: string;
  declaringEntity: object;
};

const collectUniversalIdentifiers = (
  node: unknown,
  registry: string,
  path: string,
  found: Map<string, IdentifierOccurrence[]>,
): void => {
  if (Array.isArray(node)) {
    node.forEach((item, index) =>
      collectUniversalIdentifiers(item, registry, `${path}[${index}]`, found),
    );

    return;
  }

  if (node === null || typeof node !== 'object') {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    const childPath = path === '' ? key : `${path}.${key}`;

    if (key === 'universalIdentifier' && typeof value === 'string') {
      const occurrences = found.get(value) ?? [];

      occurrences.push({ registry, path: childPath, declaringEntity: node });
      found.set(value, occurrences);

      continue;
    }

    collectUniversalIdentifiers(value, registry, childPath, found);
  }
};

describe('standard universal identifiers', () => {
  const occurrencesByIdentifier = new Map<string, IdentifierOccurrence[]>();

  for (const [registryName, registry] of Object.entries(REGISTRIES)) {
    collectUniversalIdentifiers(
      registry,
      registryName,
      '',
      occurrencesByIdentifier,
    );
  }

  it('should collect identifiers from every registry', () => {
    expect(occurrencesByIdentifier.size).toBeGreaterThan(0);
  });

  it('should never assign one universal identifier to two entities', () => {
    const duplicates = [...occurrencesByIdentifier.entries()]
      .filter(
        ([, occurrences]) =>
          new Set(occurrences.map(({ declaringEntity }) => declaringEntity))
            .size > 1,
      )
      .map(([identifier, occurrences]) => ({
        identifier,
        declaredAt: occurrences.map(
          ({ registry, path }) => `${registry}.${path}`,
        ),
      }));

    expect(duplicates).toEqual([]);
  });

  it('should only use well-formed uuids', () => {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    const malformed = [...occurrencesByIdentifier.keys()].filter(
      (identifier) => !uuidPattern.test(identifier),
    );

    expect(malformed).toEqual([]);
  });
});
