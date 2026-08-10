import { type AttachmentFileCategory } from '@/activities/files/types/AttachmentFileCategory';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useContext } from 'react';
import { CoreObjectNameSingular } from 'diex-shared/types';
import { isDefined } from 'diex-shared/utils';
import { ThemeContext } from 'diex-ui/theme-constants';
import { type ThemeColor } from 'diex-ui/theme';
export const useFileCategoryColors = (): Record<
  AttachmentFileCategory,
  string
> => {
  const { theme } = useContext(ThemeContext);

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Attachment,
  });

  const fileCategoryField = objectMetadataItem.fields.find(
    (field) => field.name === 'fileCategory',
  );

  const colorMap: Record<AttachmentFileCategory, string> = {
    ARCHIVE: theme.color.gray,
    AUDIO: theme.color.pink,
    IMAGE: theme.color.yellow,
    PRESENTATION: theme.color.orange,
    SPREADSHEET: theme.color.turquoise,
    TEXT_DOCUMENT: theme.color.blue,
    VIDEO: theme.color.purple,
    OTHER: theme.color.gray,
  };

  if (isDefined(fileCategoryField?.options)) {
    fileCategoryField.options.forEach((option) => {
      const category = option.value as AttachmentFileCategory;
      const color = option.color as ThemeColor;
      if (
        isDefined(category) &&
        isDefined(color) &&
        isDefined((theme.color as unknown as Record<string, string>)[color])
      ) {
        colorMap[category] = (theme.color as unknown as Record<string, string>)[
          color
        ];
      }
    });
  }

  return colorMap;
};
