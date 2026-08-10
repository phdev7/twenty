import * as os from 'os';
import * as path from 'path';

const DIEX_DIR = path.join(os.homedir(), '.diex');

export const getConfigPath = (test = false): string => {
  if (test || process.env.NODE_ENV === 'test') {
    return path.join(DIEX_DIR, 'config.test.json');
  }

  return path.join(DIEX_DIR, 'config.json');
};
