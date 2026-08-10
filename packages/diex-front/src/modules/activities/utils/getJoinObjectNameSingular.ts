import { CoreObjectNameSingular } from 'diex-shared/types';

export const getJoinObjectNameSingular = (
  objectNameSingular: CoreObjectNameSingular,
) => {
  return objectNameSingular === CoreObjectNameSingular.Note
    ? CoreObjectNameSingular.NoteTarget
    : objectNameSingular === CoreObjectNameSingular.Task
      ? CoreObjectNameSingular.TaskTarget
      : '';
};
