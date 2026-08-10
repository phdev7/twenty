import { AppPath } from 'diex-shared/types';
import { type NavigationMenuItem } from '~/generated-metadata/graphql';

const DIEX_SHELL_ITEM_NAMES = new Set([
  'Primeiros passos',
  'Inbox Comercial',
  'Inteligência Comercial',
  'Customer Success',
  'Renovações',
  'Governança de IA',
  'Centro de IA',
]);

const DIEX_SHELL_NATIVE_LINKS = new Set([
  AppPath.Inbox,
  AppPath.DiexCalendar,
  AppPath.DiexFirstSteps,
  '/diex/commercial-intelligence',
  '/diex/customer-success',
  '/diex/renewals',
  '/diex/ai-command-center',
]);

// These entries are Diex-owned routes. They remain native metadata records;
// only their static sidebar rendering is removed so the blueprint-driven Diex
// section can decide which operational pages fit this workspace.
export const isDiexShellNavigationMenuItem = (
  item: NavigationMenuItem,
): boolean =>
  item.userWorkspaceId == null &&
  (DIEX_SHELL_ITEM_NAMES.has(item.name ?? '') ||
    DIEX_SHELL_NATIVE_LINKS.has(item.link ?? ''));

export const filterDiexShellNavigationMenuItems = (
  items: NavigationMenuItem[],
): NavigationMenuItem[] => items.filter((item) => !isDiexShellNavigationMenuItem(item));
