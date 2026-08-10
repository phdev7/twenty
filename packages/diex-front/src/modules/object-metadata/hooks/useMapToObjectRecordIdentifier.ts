import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { getObjectRecordIdentifier } from '@/object-metadata/utils/getObjectRecordIdentifier';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export const useMapToObjectRecordIdentifier = ({
  objectNameSingular,
  allowRequestsToDiexIcons,
}: {
  objectNameSingular: string;
  allowRequestsToDiexIcons: boolean;
}) => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });

  const mapToObjectRecordIdentifier = (record: ObjectRecord) => {
    return getObjectRecordIdentifier({
      objectMetadataItem,
      record,
      allowRequestsToDiexIcons,
    });
  };

  return { mapToObjectRecordIdentifier };
};
