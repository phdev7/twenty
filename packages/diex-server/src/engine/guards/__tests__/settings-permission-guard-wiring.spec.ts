import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

// SettingsPermissionGuard(...) devolve um mixin que injeta PermissionsService, e
// o Nest o instancia no contexto do módulo que declara o controller. Quando esse
// módulo não importa PermissionsModule, o bootstrap da aplicação inteira falha
// com UnknownDependenciesException e um nome de classe em hash, que não aponta
// para o arquivo culpado. Já derrubou produção duas vezes; este teste troca isso
// por uma falha local e nomeada.
const GUARD = 'SettingsPermissionGuard';
const REQUIRED_IMPORT = 'PermissionsModule';

const resolveSrcRoot = (): string => {
  let current = __dirname;

  while (basename(current) !== 'src' && dirname(current) !== current) {
    current = dirname(current);
  }

  return current;
};

const collectFiles = (root: string, suffix: string): string[] => {
  const found: string[] = [];
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      const fullPath = join(directory, entry);

      if (statSync(fullPath).isDirectory()) {
        if (entry !== 'node_modules' && entry !== 'dist') {
          walk(fullPath);
        }
        continue;
      }

      if (entry.endsWith(suffix)) {
        found.push(fullPath);
      }
    }
  };

  walk(root);

  return found;
};

// O módulo de um controller é o `.module.ts` mais próximo subindo a partir do
// diretório do próprio controller.
const findOwningModule = (controllerPath: string): string | null => {
  let directory = dirname(controllerPath);

  for (let depth = 0; depth < 4; depth++) {
    const candidates = existsSync(directory)
      ? readdirSync(directory).filter((entry) => entry.endsWith('.module.ts'))
      : [];

    if (candidates.length > 0) {
      return join(directory, candidates[0]);
    }

    directory = dirname(directory);
  }

  return null;
};

describe('SettingsPermissionGuard module wiring', () => {
  it('should have PermissionsModule imported by every module owning a guarded controller', () => {
    const srcRoot = resolveSrcRoot();

    const guardedControllers = collectFiles(srcRoot, '.controller.ts').filter(
      (controllerPath) => readFileSync(controllerPath, 'utf8').includes(GUARD),
    );

    expect(guardedControllers.length).toBeGreaterThan(0);

    const misconfigured = guardedControllers.flatMap((controllerPath) => {
      const modulePath = findOwningModule(controllerPath);

      if (modulePath === null) {
        return [`${basename(controllerPath)} -> nenhum module.ts encontrado`];
      }

      return readFileSync(modulePath, 'utf8').includes(REQUIRED_IMPORT)
        ? []
        : [`${basename(modulePath)} -> falta ${REQUIRED_IMPORT}`];
    });

    expect(misconfigured).toEqual([]);
  });
});
