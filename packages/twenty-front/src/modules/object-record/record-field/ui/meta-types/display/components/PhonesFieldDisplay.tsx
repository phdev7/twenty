import { useFieldFocus } from '@/object-record/record-field/ui/hooks/useFieldFocus';
import { usePhonesFieldDisplay } from '@/object-record/record-field/ui/meta-types/hooks/usePhonesFieldDisplay';
import { PhonesDisplay } from '@/ui/field/display/components/PhonesDisplay';
import { useLingui } from '@lingui/react/macro';
import React, { useContext } from 'react';
import { FieldMetadataSettingsOnClickAction } from 'twenty-shared/types';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';
import { useOpenPersonWhatsappConversation } from '@/inbox/hooks/useOpenPersonWhatsappConversation';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';

export const PhonesFieldDisplay = () => {
  const { fieldValue, fieldDefinition } = usePhonesFieldDisplay();
  const { recordId } = useContext(FieldContext);
  const { copyToClipboard } = useCopyToClipboard();
  const { isFocused } = useFieldFocus();
  const { openPersonWhatsappConversation } = useOpenPersonWhatsappConversation();

  const { t } = useLingui();

  const onClickAction =
    fieldDefinition.metadata.settings?.clickAction ??
    FieldMetadataSettingsOnClickAction.OPEN_IN_APP;

  const handleClick = async (
    phoneNumber: string,
    event: React.MouseEvent<HTMLElement>,
  ) => {
    if (onClickAction === FieldMetadataSettingsOnClickAction.COPY) {
      event.preventDefault();
      copyToClipboard(phoneNumber, t`Phone number copied to clipboard`);
    } else if (onClickAction === FieldMetadataSettingsOnClickAction.OPEN_IN_APP) {
      if (fieldDefinition.metadata.objectMetadataNameSingular === 'person') {
        event.preventDefault();
        await openPersonWhatsappConversation(recordId);
      }
    }
  };

  return (
    <PhonesDisplay
      value={fieldValue}
      isFocused={isFocused}
      onPhoneNumberClick={handleClick}
    />
  );
};
