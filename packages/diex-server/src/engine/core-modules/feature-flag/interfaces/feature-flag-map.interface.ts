import { type FeatureFlagKey } from 'diex-shared/types';

export type FeatureFlagMap = Record<`${FeatureFlagKey}`, boolean>;
