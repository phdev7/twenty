import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';
import { type User } from '~/generated-metadata/graphql';

export type CurrentUser = Pick<
  User,
  | 'id'
  | 'email'
  | 'supportUserHash'
  | 'canAccessFullAdminPanel'
  | 'canImpersonate'
  | 'onboardingStatus'
  | 'userVars'
  | 'firstName'
  | 'lastName'
  | 'hasPassword'
> &
  // Optional because the generated query types are regenerated against a running
  // server: until graphql:generate runs, the typed result of the user query has
  // no such properties even though the fragment asks for them. Every reader
  // treats an absent value as "not an agency manager", which is the safe side.
  Partial<Pick<User, 'isAgencyManager' | 'agencyId'>>;

export const currentUserState = createAtomState<CurrentUser | null>({
  key: 'currentUserState',
  defaultValue: null,
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
});
