import { useOpenEmailInAppOrFallback } from '@/activities/emails/hooks/useOpenEmailInAppOrFallback';
import { useOpenPersonWhatsappConversation } from '@/inbox/hooks/useOpenPersonWhatsappConversation';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import {
  type FieldEmailsValue,
  type FieldLinksValue,
  type FieldPhonesValue,
} from '@/object-record/record-field/ui/types/FieldMetadata';
import { isFieldEmails } from '@/object-record/record-field/ui/types/guards/isFieldEmails';
import { isFieldLinks } from '@/object-record/record-field/ui/types/guards/isFieldLinks';
import { isFieldPhones } from '@/object-record/record-field/ui/types/guards/isFieldPhones';
import { useRecordFieldValue } from '@/object-record/record-store/hooks/useRecordFieldValue';
import { t } from '@lingui/core/macro';
import { useContext } from 'react';
import { FieldMetadataSettingsOnClickAction } from 'diex-shared/types';
import { ensureAbsoluteUrl, isDefined } from 'diex-shared/utils';
import {
  IconArrowUpRight,
  IconBrandWhatsapp,
  IconCopy,
  IconMail,
} from 'diex-ui/icon';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';

export const useGetSecondaryRecordTableCellButton = () => {
  const { fieldDefinition, recordId } = useContext(FieldContext);
  const { copyToClipboard } = useCopyToClipboard();

  const isEmailField = isFieldEmails(fieldDefinition);
  const isPhoneField = isFieldPhones(fieldDefinition);

  const { openEmail } = useOpenEmailInAppOrFallback({ skip: !isEmailField });
  const { openPersonWhatsappConversation } =
    useOpenPersonWhatsappConversation();

  const fieldValue = useRecordFieldValue<
    FieldPhonesValue | FieldEmailsValue | FieldLinksValue | undefined
  >(recordId, fieldDefinition.metadata.fieldName, fieldDefinition);

  if (
    (!isFieldPhones(fieldDefinition) &&
      !isFieldLinks(fieldDefinition) &&
      !isEmailField) ||
    !isDefined(fieldValue)
  ) {
    return [];
  }

  const isPersonPhoneField =
    isPhoneField &&
    fieldDefinition.metadata.objectMetadataNameSingular === 'person';

  const defaultClickAction =
    isEmailField || isPersonPhoneField
      ? FieldMetadataSettingsOnClickAction.OPEN_IN_APP
      : FieldMetadataSettingsOnClickAction.OPEN_LINK;

  const mainActionOnClick =
    fieldDefinition.metadata.settings?.clickAction ?? defaultClickAction;

  const openActionForFieldType =
    isEmailField || isPersonPhoneField
      ? FieldMetadataSettingsOnClickAction.OPEN_IN_APP
      : FieldMetadataSettingsOnClickAction.OPEN_LINK;

  const secondaryActionOnClick =
    mainActionOnClick === FieldMetadataSettingsOnClickAction.COPY
      ? openActionForFieldType
      : FieldMetadataSettingsOnClickAction.COPY;

  let openLinkOnClick: () => void = () => {};
  let copyOnClick: () => void = () => {};
  let openInAppOnClick: () => void = () => {};

  if (isFieldPhones(fieldDefinition)) {
    const { primaryPhoneCallingCode = '', primaryPhoneNumber = '' } =
      fieldValue as FieldPhonesValue;
    const phoneNumber = `${primaryPhoneCallingCode}${primaryPhoneNumber}`;
    openLinkOnClick = () => {
      window.open(`tel:${phoneNumber}`, '_blank');
    };
    copyOnClick = () => {
      copyToClipboard(phoneNumber, t`Phone number copied to clipboard`);
    };
    openInAppOnClick = () => {
      if (fieldDefinition.metadata.objectMetadataNameSingular === 'person') {
        openPersonWhatsappConversation(recordId);
      }
    };
  }

  if (isFieldEmails(fieldDefinition)) {
    const email = (fieldValue as FieldEmailsValue).primaryEmail ?? '';
    openLinkOnClick = () => {
      window.open(`mailto:${email}`, '_blank');
    };
    copyOnClick = () => {
      copyToClipboard(email, t`Email copied to clipboard`);
    };
    openInAppOnClick = () => {
      openEmail(email);
    };
  }

  if (isFieldLinks(fieldDefinition)) {
    const url = (fieldValue as FieldLinksValue).primaryLinkUrl ?? '';
    openLinkOnClick = () => {
      window.open(ensureAbsoluteUrl(url), '_blank');
    };
    copyOnClick = () => {
      copyToClipboard(url, t`Link copied to clipboard`);
    };
  }

  const onClickByAction: Record<
    FieldMetadataSettingsOnClickAction,
    () => void
  > = {
    [FieldMetadataSettingsOnClickAction.OPEN_LINK]: openLinkOnClick,
    [FieldMetadataSettingsOnClickAction.COPY]: copyOnClick,
    [FieldMetadataSettingsOnClickAction.OPEN_IN_APP]: openInAppOnClick,
  };

  const iconByAction = {
    [FieldMetadataSettingsOnClickAction.OPEN_LINK]: IconArrowUpRight,
    [FieldMetadataSettingsOnClickAction.COPY]: IconCopy,
    [FieldMetadataSettingsOnClickAction.OPEN_IN_APP]: isPersonPhoneField
      ? IconBrandWhatsapp
      : IconMail,
  };

  return [
    {
      onClick: onClickByAction[secondaryActionOnClick],
      Icon: iconByAction[secondaryActionOnClick],
    },
  ];
};
