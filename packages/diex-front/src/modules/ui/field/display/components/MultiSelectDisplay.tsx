import { type FieldMultiSelectValue } from '@/object-record/record-field/ui/types/FieldMetadata';
import { isDefined } from 'diex-shared/utils';
import { styled } from '@linaria/react';
import { Tag } from 'diex-ui/data-display';
import { type SelectOption } from 'diex-ui/input';

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  gap: 4px;
  justify-content: flex-start;

  max-width: 100%;

  overflow: hidden;

  width: 100%;
`;

export const MultiSelectDisplay = ({
  values,
  options,
}: {
  values: FieldMultiSelectValue | undefined;
  options: SelectOption[];
}) => {
  const selectedOptions = values
    ? options?.filter((option) => values.includes(option.value))
    : [];

  if (!isDefined(selectedOptions)) return null;

  return (
    <StyledContainer>
      {selectedOptions.map((selectedOption, index) => (
        <Tag
          preventShrink
          key={index}
          color={selectedOption.color ?? 'transparent'}
          text={selectedOption.label}
          Icon={selectedOption.Icon ?? undefined}
        />
      ))}
    </StyledContainer>
  );
};
