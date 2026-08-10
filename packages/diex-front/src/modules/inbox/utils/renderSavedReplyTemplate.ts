import { type InboxConversation } from '@/inbox/types/inboxEntityTypes';
import { type SavedReplyRenderResult } from '@/inbox/types/inboxMacroTypes';
import { getRecordName } from '@/inbox/utils/getRecordName';

const TEMPLATE_VARIABLE_PATTERN =
  /{{\s*([a-zA-Z0-9_.]+)(?:\s*\|\|\s*(['"])(.*?)\2)?\s*}}/g;

const getNamePart = (
  conversation: InboxConversation,
  part: 'firstName' | 'lastName',
): string => {
  const name = conversation.person?.name;

  return typeof name === 'object' ? (name?.[part]?.trim() ?? '') : '';
};

const getTemplateVariables = (
  conversation: InboxConversation,
): Record<string, string> => {
  const contactName =
    getRecordName(conversation.person) || conversation.name.trim();

  return {
    'conversation.id': conversation.id,
    'conversation.contact_handle': conversation.contactHandle?.trim() ?? '',
    'contact.id': conversation.person?.id ?? '',
    'contact.name': contactName,
    'contact.first_name':
      getNamePart(conversation, 'firstName') ||
      contactName.split(/\s+/)[0] ||
      '',
    'contact.last_name': getNamePart(conversation, 'lastName'),
    'contact.phone': conversation.contactHandle?.trim() ?? '',
    'company.id': conversation.company?.id ?? '',
    'company.name': getRecordName(conversation.company),
    'opportunity.id': conversation.opportunity?.id ?? '',
    'opportunity.name':
      typeof conversation.opportunity?.name === 'string'
        ? conversation.opportunity.name.trim()
        : '',
    'opportunity.stage': conversation.opportunity?.stage?.trim() ?? '',
  };
};

export const getUnresolvedSavedReplyVariables = (text: string): string[] => {
  const variables = new Set<string>();

  for (const match of text.matchAll(TEMPLATE_VARIABLE_PATTERN)) {
    if (match[1]) {
      variables.add(match[1]);
    }
  }

  return [...variables];
};

export const renderSavedReplyTemplate = (
  template: string,
  conversation: InboxConversation,
): SavedReplyRenderResult => {
  const values = getTemplateVariables(conversation);
  const unresolvedVariables = new Set<string>();
  const text = template.replace(
    TEMPLATE_VARIABLE_PATTERN,
    (placeholder, rawVariable: string, _quote?: string, fallback?: string) => {
      const variable = rawVariable.toLowerCase();
      const value = values[variable]?.trim();

      if (value) {
        return value;
      }

      if (typeof fallback === 'string') {
        return fallback;
      }

      unresolvedVariables.add(rawVariable);

      return placeholder;
    },
  );

  return {
    text,
    unresolvedVariables: [...unresolvedVariables],
  };
};
