import { type OrchestratorFailureReport } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';

const MAX_SUMMARIZED_FAILURES = 10;

// The report is a record of ~40 metadata names, nearly all empty on a failure,
// and the exception message used to carry none of it. An operator then saw only
// "multiple validation errors" while the log printed the nested errors as
// [Object]. Naming the offending entities in the message is what turns this from
// an opaque failure into one that can be acted on.
export const summarizeFailedMigrationReport = (
  report: OrchestratorFailureReport,
): string => {
  const failures: string[] = [];

  for (const [metadataName, entityFailures] of Object.entries(report)) {
    for (const entityFailure of entityFailures ?? []) {
      const universalIdentifier =
        entityFailure.flatEntityMinimalInformation?.universalIdentifier ??
        'unknown';
      const reasons = (entityFailure.errors ?? [])
        .map((error) => error.message ?? error.code ?? 'unknown error')
        .join('; ');

      failures.push(
        `${metadataName}/${entityFailure.type} ${universalIdentifier}: ${reasons}`,
      );
    }
  }

  if (failures.length === 0) {
    return 'no entity-level detail reported';
  }

  const shown = failures.slice(0, MAX_SUMMARIZED_FAILURES);
  const remaining = failures.length - shown.length;

  return remaining > 0
    ? `${shown.join(' | ')} (+${remaining} more)`
    : shown.join(' | ');
};
