import { buildDiexStandardObjectSystemFields } from '@/metadata/utils/internal/build-standard-object-system-fields.util';
import { INBOX_STANDARD_RELATION_FIELDS } from '@/metadata/constants/inbox-standard-relation-fields.constant';
import { DIEX_STANDARD_RELATION_FIELDS } from '@/metadata/constants/diex-standard-relation-fields.constant';
import { DIEX_STANDARD_EXTENSION_RELATION_FIELDS } from '@/metadata/constants/diex-standard-object-extension-relation-fields.constant';

export const INBOX_STANDARD_OBJECTS = {
  inboxConversation: {
    universalIdentifier: 'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
    fields: {
      ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.inboxConversation,
      ...DIEX_STANDARD_RELATION_FIELDS.inboxConversation,
      ...INBOX_STANDARD_RELATION_FIELDS.inboxConversation,
      ...buildDiexStandardObjectSystemFields(
        'b9ec457e-7da0-47b2-a3f5-3d9608e66331',
      ),
      name: { universalIdentifier: '675dd863-f5b0-4940-8b73-2ec9a6cc4044' },
      providerThreadKey: {
        universalIdentifier: '5804f460-e9c5-4984-80c9-37febe4e6f88',
      },
      channel: { universalIdentifier: 'f4f1ec0a-10f8-414a-876d-bd1d81cbd27a' },
      provider: { universalIdentifier: '1d111b61-6fa2-44af-9c36-abd00dbd6dfc' },
      status: { universalIdentifier: 'a5778fff-384c-465b-ba0d-9435ee4fb9c7' },
      priority: { universalIdentifier: '8eb74450-5629-40be-95dc-09c73d3bb9f9' },
      contactHandle: {
        universalIdentifier: '8377260f-3d70-4867-ae70-07f757016aea',
      },
      unreadCount: {
        universalIdentifier: '6b7db0f7-b18f-4344-93db-9ccc72cd6af6',
      },
      lastMessagePreview: {
        universalIdentifier: 'e0852d9c-4440-4af1-aec4-49aea8724513',
      },
      lastMessageDirection: {
        universalIdentifier: '2bea18ca-7470-4610-9a63-7bede6f1e4e8',
      },
      lastMessageAt: {
        universalIdentifier: 'c0f91514-6800-4db4-987d-c2a79363fa4c',
      },
      firstResponseDueAt: {
        universalIdentifier: '226f26ac-d15b-43b3-9ff3-b88b7d609d71',
      },
      firstRespondedAt: {
        universalIdentifier: 'f857e357-549a-47f0-8be1-be25b4b25000',
      },
      followUpDueAt: {
        universalIdentifier: 'dc6ddb6b-f9a7-4df2-b4b1-601053c49e80',
      },
      snoozedUntil: {
        universalIdentifier: '89db4794-99f8-418c-a0a9-526e99ef1d03',
      },
      slaBreachedAt: {
        universalIdentifier: '90d8368f-b1ad-404f-a484-3ece1ae8439b',
      },
      metadata: { universalIdentifier: '43d5ed6a-a102-4c12-8b31-f6e98f54996a' },
    },
    indexes: {
      providerThreadKeyUniqueIndex: {
        universalIdentifier: 'c4c227e8-3d28-5bc3-a3fe-33f46785b823',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'e5d0b76c-f65b-5509-a6aa-7a3c890dbd0f',
      },
    },
  },
  inboxMessage: {
    universalIdentifier: '7f598a57-08b2-4cc4-a4fa-a5c66f00da7b',
    fields: {
      ...INBOX_STANDARD_RELATION_FIELDS.inboxMessage,
      ...buildDiexStandardObjectSystemFields(
        '7f598a57-08b2-4cc4-a4fa-a5c66f00da7b',
      ),
      name: { universalIdentifier: 'f060bf2e-d788-4d87-baf0-c3f84bafd99c' },
      providerMessageKey: {
        universalIdentifier: '980b8d7f-3581-4b7f-8e89-e79ec42eba4d',
      },
      direction: {
        universalIdentifier: '5d42b22c-0d8a-4a29-b238-28cae3998598',
      },
      messageType: {
        universalIdentifier: '1dc7d24d-e98c-4596-b4dc-48d2ca41a90a',
      },
      body: { universalIdentifier: 'fb24ed24-cd12-4616-9bee-2f84bcb17c9c' },
      deliveryStatus: {
        universalIdentifier: 'c244bcc7-fba4-45f6-bd74-7968100aa15e',
      },
      sentAt: { universalIdentifier: '4a03759e-56bf-4398-8590-b8798ea035ee' },
      senderHandle: {
        universalIdentifier: '1dff9c8b-cd46-4c92-af5d-4959f0b94c27',
      },
      senderDisplayName: {
        universalIdentifier: '86bf7021-4111-498b-a37c-ce3c43403d25',
      },
      mediaUrl: { universalIdentifier: '5ae9a680-3c8a-42c4-b6fa-5f6cb73c0f41' },
      transcription: {
        universalIdentifier: 'edd08bf7-ebe3-4a60-ae2d-c17fde469c8a',
      },
      transcriptionStatus: {
        universalIdentifier: '2de5e977-37ad-4ec1-8114-8c690083d353',
      },
      isInternalNote: {
        universalIdentifier: '1a74a4c8-1011-4d0f-bfb0-7dd599320865',
      },
      metadata: { universalIdentifier: 'd5b186f2-8c5d-42d4-93e7-15041a534364' },
      providerPayloadFingerprint: {
        universalIdentifier: 'e93d4f7a-68f3-458f-997f-6243e86a5415',
      },
    },
    indexes: {
      providerMessageKeyUniqueIndex: {
        universalIdentifier: '7ea9536c-3aac-539d-86f0-9d79e8e1f739',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'bcd7632e-2ac3-500f-bfd2-d1c1f810e33a',
      },
    },
  },
  inboxConversationEvent: {
    universalIdentifier: 'd1e0fc00-0000-4000-8000-000000000001',
    fields: {
      ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.inboxConversationEvent,
      ...INBOX_STANDARD_RELATION_FIELDS.inboxConversationEvent,
      ...buildDiexStandardObjectSystemFields(
        'd1e0fc00-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e0fc10-0000-4000-8000-000000000001' },
      eventType: {
        universalIdentifier: 'd1e0fc10-0000-4000-8000-000000000002',
      },
      summary: { universalIdentifier: 'd1e0fc10-0000-4000-8000-000000000003' },
      details: { universalIdentifier: 'd1e0fc10-0000-4000-8000-000000000004' },
      occurredAt: {
        universalIdentifier: 'd1e0fc10-0000-4000-8000-000000000005',
      },
    },
    indexes: {
      nameUniqueIndex: {
        universalIdentifier: 'ebee77ac-acc7-5133-9815-6e4c4f0e1d9b',
      },
      searchVectorGinIndex: {
        universalIdentifier: '22d14b77-16c2-522e-8d9f-d0d2bf4d337a',
      },
    },
  },
  inboxLabel: {
    universalIdentifier: 'd1e0e000-0000-4000-8000-000000000001',
    fields: {
      ...INBOX_STANDARD_RELATION_FIELDS.inboxLabel,
      ...buildDiexStandardObjectSystemFields(
        'd1e0e000-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e0e100-0000-4000-8000-000000000001' },
      slug: { universalIdentifier: 'd1e0e100-0000-4000-8000-000000000002' },
      color: { universalIdentifier: 'd1e0e100-0000-4000-8000-000000000003' },
      description: {
        universalIdentifier: 'd1e0e100-0000-4000-8000-000000000004',
      },
      status: { universalIdentifier: 'd1e0e100-0000-4000-8000-000000000005' },
      usageCount: {
        universalIdentifier: 'd1e0e100-0000-4000-8000-000000000006',
      },
    },
    indexes: {
      slugUniqueIndex: {
        universalIdentifier: '1f6f5dae-a884-586c-856b-51be512b4a90',
      },
      searchVectorGinIndex: {
        universalIdentifier: '02f68e24-9e3d-5210-8453-d37fec6ec746',
      },
    },
  },
  inboxConversationLabel: {
    universalIdentifier: 'd1e0f000-0000-4000-8000-000000000001',
    fields: {
      ...INBOX_STANDARD_RELATION_FIELDS.inboxConversationLabel,
      ...buildDiexStandardObjectSystemFields(
        'd1e0f000-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e0f100-0000-4000-8000-000000000001' },
      isActive: { universalIdentifier: 'd1e0f100-0000-4000-8000-000000000002' },
      assignedAt: {
        universalIdentifier: 'd1e0f100-0000-4000-8000-000000000003',
      },
      removedAt: {
        universalIdentifier: 'd1e0f100-0000-4000-8000-000000000004',
      },
    },
    indexes: {
      nameUniqueIndex: {
        universalIdentifier: '3e372aa5-e406-5bfd-b3fb-e74aed145068',
      },
    },
  },
  inboxTeam: {
    universalIdentifier: 'd1e0f400-0000-4000-8000-000000000001',
    fields: {
      ...INBOX_STANDARD_RELATION_FIELDS.inboxTeam,
      ...buildDiexStandardObjectSystemFields(
        'd1e0f400-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e0f410-0000-4000-8000-000000000001' },
      key: { universalIdentifier: 'd1e0f410-0000-4000-8000-000000000002' },
      description: {
        universalIdentifier: 'd1e0f410-0000-4000-8000-000000000003',
      },
      status: { universalIdentifier: 'd1e0f410-0000-4000-8000-000000000004' },
      routingStrategy: {
        universalIdentifier: 'd1e0f410-0000-4000-8000-000000000005',
      },
      defaultResponseSlaMinutes: {
        universalIdentifier: 'd1e0f410-0000-4000-8000-000000000006',
      },
      isDefault: {
        universalIdentifier: 'd1e0f410-0000-4000-8000-000000000007',
      },
    },
    indexes: {
      keyUniqueIndex: {
        universalIdentifier: '7316fca4-8f18-50c0-858f-ab85dbd3f732',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'dace8440-fe90-5fe5-8027-9161ab2cd55c',
      },
    },
  },
  inboxTeamMember: {
    universalIdentifier: 'd1e0f500-0000-4000-8000-000000000001',
    fields: {
      ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.inboxTeamMember,
      ...INBOX_STANDARD_RELATION_FIELDS.inboxTeamMember,
      ...buildDiexStandardObjectSystemFields(
        'd1e0f500-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e0f510-0000-4000-8000-000000000001' },
      memberRole: {
        universalIdentifier: 'd1e0f510-0000-4000-8000-000000000002',
      },
      isActive: { universalIdentifier: 'd1e0f510-0000-4000-8000-000000000003' },
      joinedAt: { universalIdentifier: 'd1e0f510-0000-4000-8000-000000000004' },
    },
    indexes: {
      nameUniqueIndex: {
        universalIdentifier: '5553e997-7cb3-5bec-aaa7-e2b607938a2a',
      },
    },
  },
  inboxMacro: {
    universalIdentifier: 'd1e0fb00-0000-4000-8000-000000000001',
    fields: {
      ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.inboxMacro,
      ...INBOX_STANDARD_RELATION_FIELDS.inboxMacro,
      ...buildDiexStandardObjectSystemFields(
        'd1e0fb00-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e0fb10-0000-4000-8000-000000000001' },
      shortcut: { universalIdentifier: 'd1e0fb10-0000-4000-8000-000000000002' },
      description: {
        universalIdentifier: 'd1e0fb10-0000-4000-8000-000000000003',
      },
      status: { universalIdentifier: 'd1e0fb10-0000-4000-8000-000000000004' },
      channel: { universalIdentifier: 'd1e0fb10-0000-4000-8000-000000000005' },
      targetConversationStatus: {
        universalIdentifier: 'd1e0fb10-0000-4000-8000-000000000006',
      },
      targetPriority: {
        universalIdentifier: 'd1e0fb10-0000-4000-8000-000000000007',
      },
      internalNoteTemplate: {
        universalIdentifier: 'd1e0fb10-0000-4000-8000-000000000008',
      },
      usageCount: {
        universalIdentifier: 'd1e0fb10-0000-4000-8000-000000000009',
      },
      lastUsedAt: {
        universalIdentifier: 'd1e0fb10-0000-4000-8000-00000000000a',
      },
    },
    indexes: {
      shortcutUniqueIndex: {
        universalIdentifier: 'f0da6c17-4c57-574a-b7e3-93ed9a96483d',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'fe45de39-67f4-5f58-af9f-64bcc185a87a',
      },
    },
  },
  inboxSavedReply: {
    universalIdentifier: 'd1e0d000-0000-4000-8000-000000000001',
    fields: {
      ...INBOX_STANDARD_RELATION_FIELDS.inboxSavedReply,
      ...buildDiexStandardObjectSystemFields(
        'd1e0d000-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e0d100-0000-4000-8000-000000000001' },
      shortcut: { universalIdentifier: 'd1e0d100-0000-4000-8000-000000000002' },
      body: { universalIdentifier: 'd1e0d100-0000-4000-8000-000000000003' },
      status: { universalIdentifier: 'd1e0d100-0000-4000-8000-000000000004' },
      channel: { universalIdentifier: 'd1e0d100-0000-4000-8000-000000000005' },
      category: { universalIdentifier: 'd1e0d100-0000-4000-8000-000000000006' },
      usageCount: {
        universalIdentifier: 'd1e0d100-0000-4000-8000-000000000007',
      },
      lastUsedAt: {
        universalIdentifier: 'd1e0d100-0000-4000-8000-000000000008',
      },
    },
    indexes: {
      shortcutUniqueIndex: {
        universalIdentifier: '255c2431-6c23-52ca-b936-d488e95b3132',
      },
      searchVectorGinIndex: {
        universalIdentifier: '94bd4084-fb70-5864-9843-920c37baa427',
      },
    },
  },
  inboxMention: {
    universalIdentifier: 'd1e0fa00-0000-4000-8000-000000000001',
    fields: {
      ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.inboxMention,
      ...INBOX_STANDARD_RELATION_FIELDS.inboxMention,
      ...buildDiexStandardObjectSystemFields(
        'd1e0fa00-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e0fa10-0000-4000-8000-000000000001' },
      excerpt: { universalIdentifier: 'd1e0fa10-0000-4000-8000-000000000002' },
      status: { universalIdentifier: 'd1e0fa10-0000-4000-8000-000000000003' },
      mentionedAt: {
        universalIdentifier: 'd1e0fa10-0000-4000-8000-000000000004',
      },
      readAt: { universalIdentifier: 'd1e0fa10-0000-4000-8000-000000000005' },
      resolvedAt: {
        universalIdentifier: 'd1e0fa10-0000-4000-8000-000000000006',
      },
    },
    indexes: {
      nameUniqueIndex: {
        universalIdentifier: 'e26ba073-0aa0-503b-bbdd-5eec6c045f87',
      },
      searchVectorGinIndex: {
        universalIdentifier: '182d6a93-2583-599c-be2e-ed2e3fbe3bd9',
      },
    },
  },
  inboxAutomation: {
    universalIdentifier: 'd1e0fd00-0000-4000-8000-000000000001',
    fields: {
      ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.inboxAutomation,
      ...INBOX_STANDARD_RELATION_FIELDS.inboxAutomation,
      ...buildDiexStandardObjectSystemFields(
        'd1e0fd00-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000001' },
      key: { universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000002' },
      description: {
        universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000003',
      },
      status: { universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000004' },
      trigger: { universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000005' },
      channel: { universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000006' },
      keywords: { universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000007' },
      crmCondition: {
        universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000008',
      },
      onlyIfUnassigned: {
        universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000009',
      },
      targetConversationStatus: {
        universalIdentifier: 'd1e0fd10-0000-4000-8000-00000000000a',
      },
      targetPriority: {
        universalIdentifier: 'd1e0fd10-0000-4000-8000-00000000000b',
      },
      followUpDelayMinutes: {
        universalIdentifier: 'd1e0fd10-0000-4000-8000-00000000000c',
      },
      taskTitleTemplate: {
        universalIdentifier: 'd1e0fd10-0000-4000-8000-00000000000d',
      },
      taskDueDelayMinutes: {
        universalIdentifier: 'd1e0fd10-0000-4000-8000-00000000000e',
      },
      internalNoteTemplate: {
        universalIdentifier: 'd1e0fd10-0000-4000-8000-00000000000f',
      },
      stopAfterMatch: {
        universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000010',
      },
      executionOrder: {
        universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000011',
      },
      runCount: { universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000012' },
      lastRunAt: {
        universalIdentifier: 'd1e0fd10-0000-4000-8000-000000000013',
      },
    },
    indexes: {
      keyUniqueIndex: {
        universalIdentifier: 'a9b6e7db-a732-5daf-bc94-755a9c89fef6',
      },
      searchVectorGinIndex: {
        universalIdentifier: '4df6ae72-6cc3-5ede-b7c7-7b11bfaa6557',
      },
    },
  },
} as const;
