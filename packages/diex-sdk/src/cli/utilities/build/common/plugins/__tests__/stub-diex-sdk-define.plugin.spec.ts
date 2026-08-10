import * as diexSdkDefine from '@/sdk/define';
import {
  DIEX_SDK_DEFINE_STUBBED_EXPORTS,
  isDefineFactoryExportName,
} from '@/cli/utilities/build/common/plugins/stub-diex-sdk-define.plugin';

describe('stub-diex-sdk-define plugin', () => {
  const realExports = Object.keys(diexSdkDefine).sort();
  const stubbedExports = [
    ...DIEX_SDK_DEFINE_STUBBED_EXPORTS.factories,
    ...DIEX_SDK_DEFINE_STUBBED_EXPORTS.any,
  ].sort();

  it('classifies every diex-sdk/define value-export', () => {
    expect(stubbedExports).toEqual(realExports);
  });

  it('classifies all defineX exports (and createValidationResult) as factories', () => {
    const expectedFactories = realExports
      .filter(isDefineFactoryExportName)
      .sort();

    expect([...DIEX_SDK_DEFINE_STUBBED_EXPORTS.factories].sort()).toEqual(
      expectedFactories,
    );
  });

  it('every factory is callable in the real module (would-be misclassification guard)', () => {
    for (const name of DIEX_SDK_DEFINE_STUBBED_EXPORTS.factories) {
      const actual = (diexSdkDefine as unknown as Record<string, unknown>)[
        name
      ];
      expect(typeof actual).toBe('function');
    }
  });

  // Snapshot to surface new exports in PR review. Update with
  // `npx vitest -u` when intentional.
  it('matches the recorded export partition', () => {
    expect(DIEX_SDK_DEFINE_STUBBED_EXPORTS).toMatchSnapshot();
  });
});
