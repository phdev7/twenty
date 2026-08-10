export const INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER =
  'b9ec457e-7da0-47b2-a3f5-3d9608e66331';
export const INBOX_MESSAGE_UNIVERSAL_IDENTIFIER =
  '7f598a57-08b2-4cc4-a4fa-a5c66f00da7b';

export const INBOX_CONVERSATION_FIELD_IDS = {
  name: '675dd863-f5b0-4940-8b73-2ec9a6cc4044',
  providerThreadKey: '5804f460-e9c5-4984-80c9-37febe4e6f88',
  channel: 'f4f1ec0a-10f8-414a-876d-bd1d81cbd27a',
  provider: '1d111b61-6fa2-44af-9c36-abd00dbd6dfc',
  status: 'a5778fff-384c-465b-ba0d-9435ee4fb9c7',
  priority: '8eb74450-5629-40be-95dc-09c73d3bb9f9',
  contactHandle: '8377260f-3d70-4867-ae70-07f757016aea',
  unreadCount: '6b7db0f7-b18f-4344-93db-9ccc72cd6af6',
  lastMessagePreview: 'e0852d9c-4440-4af1-aec4-49aea8724513',
  lastMessageDirection: '2bea18ca-7470-4610-9a63-7bede6f1e4e8',
  lastMessageAt: 'c0f91514-6800-4db4-987d-c2a79363fa4c',
  firstResponseDueAt: '226f26ac-d15b-43b3-9ff3-b88b7d609d71',
  firstRespondedAt: 'f857e357-549a-47f0-8be1-be25b4b25000',
  followUpDueAt: 'dc6ddb6b-f9a7-4df2-b4b1-601053c49e80',
  snoozedUntil: '89db4794-99f8-418c-a0a9-526e99ef1d03',
  slaBreachedAt: '90d8368f-b1ad-404f-a484-3ece1ae8439b',
  metadata: '43d5ed6a-a102-4c12-8b31-f6e98f54996a',
} as const;

export const INBOX_MESSAGE_FIELD_IDS = {
  name: 'f060bf2e-d788-4d87-baf0-c3f84bafd99c',
  providerMessageKey: '980b8d7f-3581-4b7f-8e89-e79ec42eba4d',
  direction: '5d42b22c-0d8a-4a29-b238-28cae3998598',
  type: '1dc7d24d-e98c-4596-b4dc-48d2ca41a90a',
  body: 'fb24ed24-cd12-4616-9bee-2f84bcb17c9c',
  deliveryStatus: 'c244bcc7-fba4-45f6-bd74-7968100aa15e',
  sentAt: '4a03759e-56bf-4398-8590-b8798ea035ee',
  senderHandle: '1dff9c8b-cd46-4c92-af5d-4959f0b94c27',
  senderDisplayName: '86bf7021-4111-498b-a37c-ce3c43403d25',
  mediaUrl: '5ae9a680-3c8a-42c4-b6fa-5f6cb73c0f41',
  isInternalNote: '1a74a4c8-1011-4d0f-bfb0-7dd599320865',
  metadata: 'd5b186f2-8c5d-42d4-93e7-15041a534364',
  providerPayloadFingerprint: 'e93d4f7a-68f3-458f-997f-6243e86a5415',
  transcription: 'edd08bf7-ebe3-4a60-ae2d-c17fde469c8a',
  transcriptionStatus: '2de5e977-37ad-4ec1-8114-8c690083d353',
} as const;

export const INBOX_OPTION_IDS = {
  transcriptionStatus: {
    pending: 'e618c038-c15c-4252-9831-5b38abba0757',
    done: '64b3a750-6861-4ca5-b514-59ba044975a5',
    failed: '8c3bad49-cbcc-48fe-b4a2-3e4d41517e7a',
    unavailable: '8cb7a680-39d3-4c48-8626-5735c373302a',
  },
  conversationChannel: {
    whatsapp: 'bb11d44f-1eae-4a89-9e20-c870f2b01d18',
    email: 'c3aa967f-9705-43bc-811c-e4a851d2d881',
  },
  conversationProvider: {
    evolution: 'f0f895a0-ac03-420d-b44b-8486718e04c5',
    diexEmail: 'ce6f82c4-d75c-4ef3-8d50-0b5ef6285791',
    manual: '2a710f8d-7513-4703-a8a0-9d7bdb7d5024',
  },
  conversationStatus: {
    open: '4410f3ab-04df-4237-86ee-26fb57014dcc',
    pending: 'b0031cda-81b6-4f97-871c-1790d90ad671',
    snoozed: '48951e76-ed68-4648-983b-6190361c1923',
    resolved: '83a01bcd-f58e-4a9b-b294-29a5fc8c2cc9',
  },
  conversationPriority: {
    low: 'b1a03aaf-2454-4d63-b724-0e765d6f682b',
    normal: 'a52daa14-5db0-4fe4-8c60-af01a2d3703d',
    high: '92772ba3-95dc-44da-8f20-4f8d3ae38162',
    urgent: 'f4fe526c-b7b3-4b84-b311-eb1c3ff4472d',
  },
  conversationDirection: {
    inbound: '9b70d16b-1dfa-46bd-9754-f97f6c280891',
    outbound: '8c933dc4-3039-423b-8d0c-ae8ab49d9dfa',
  },
  messageDirection: {
    inbound: 'dd0fa366-dd4c-40fa-bbf1-5df89b67517a',
    outbound: '33c36761-c24c-405b-b546-6e49a8400a47',
  },
  messageType: {
    text: 'a2987bbb-65ad-4cd5-a416-dc6a5d7dd0ea',
    audio: 'f2e08202-eac8-4cc7-b945-b9fc2d600a67',
    image: 'aeb7a28f-e280-400b-a42b-eba5cf12a589',
    video: '0f9f4418-d64e-4e07-a3c5-b5c42e0e2c77',
    document: '367c118c-b01b-4357-b2f3-be7536a72b7a',
    reaction: '72f87384-ffa0-45df-974b-b1f1dc4a2a8f',
    system: 'f4958236-97ad-4884-bb03-860e11ce8978',
  },
  deliveryStatus: {
    received: '5e630ede-71ad-4604-bfe4-3834901850ab',
    queued: 'e9406844-5e0c-40e0-a5c1-d4b5ffac1392',
    sent: 'd15452e3-a095-490a-bdd8-5d14da91b533',
    delivered: '40c3aca5-afac-479c-bc9b-d1e7fb6800f9',
    read: '5fa29477-4162-4e85-a194-807d0e86e681',
    failed: '91a62c5d-9e28-42b3-ad35-156fefa1b94f',
  },
} as const;

export const INBOX_RELATION_FIELD_IDS = {
  personOnConversation: 'ad36d6ef-df23-4c50-8704-124ac3da6973',
  conversationsOnPerson: 'b59f1b65-40f9-4607-8da7-3010960ff2f0',
  companyOnConversation: 'a93d3f74-dad6-4a40-90b6-d5ef72a18a12',
  conversationsOnCompany: '8f49a1c0-8e0d-4794-a98f-5dbdec1e9b33',
  opportunityOnConversation: '14e32618-aeb9-4282-9e98-8b8aea4721e9',
  conversationsOnOpportunity: '4daced73-aa5e-4d6c-9e70-80b97fe28f97',
  assigneeOnConversation: 'b14d36db-332b-40a2-8217-b395be47a39a',
  conversationsOnWorkspaceMember: '9ae28763-02f7-44b6-aaf0-4a1d0d52be0f',
  conversationOnMessage: '1b017ced-89f2-4358-a166-fa62e486e361',
  messagesOnConversation: '34bb2d1c-17c0-435f-a00d-4a30224a054c',
  conversationOnTask: 'eba85d8a-4525-4aaf-8a2c-7c51825deb84',
  tasksOnConversation: '074097e0-d250-47d6-b90d-6cf60fdb8030',
} as const;

export const INBOX_VIEW_IDS = {
  activeConversations: '2007bfab-939f-4512-a7d3-324d22fe96a8',
  activeConversationsFields: {
    name: '143c3b65-6625-40ef-8530-f81c968ac0aa',
    status: '24d78571-b091-4b8a-adf1-70bf966de0a9',
    priority: '3ee782c3-73f4-4507-ac57-a32326c26b56',
    person: '0f5ca83e-d2b4-4a1b-9edd-8d82c17d6f86',
    company: '7692045a-63a6-4196-a858-db01e56cdd84',
    opportunity: '8eac3d1b-ea14-41ac-8a92-9607533c05b7',
    team: 'd1e0f900-0000-4000-8000-000000000001',
    assignee: '17c052e5-2b03-4335-a673-e49535a7a96a',
    unreadCount: 'a9692c16-28ed-4ebe-ad97-ed6e6ac88992',
    lastMessagePreview: '6b0b66d7-a282-4360-ba8c-2f2376eab334',
    lastMessageAt: 'dc640df6-b174-4c9e-936f-14cb4808a488',
    followUpDueAt: '9ab146db-e7c4-4e64-99a9-f4e52778595b',
  },
  activeConversationsFilter: '3da4e1ad-d947-41f8-ba94-8d56d261f2dc',
  activeConversationsSort: '6deb7c34-ec35-440a-a004-d007f5e52a76',
  allMessages: '3302fd1e-c4ff-4929-8375-9b4331dfa544',
  allMessagesFields: {
    name: '525e4658-e77a-41be-ab91-7ea1df23ed73',
    conversation: '2b436cf8-cf8d-4fb3-a519-39056fdc481c',
    direction: 'd1be39d4-e360-4357-aa56-7b7e782e05e9',
    type: '1101d296-4ed0-48d2-a96f-893601d49b41',
    deliveryStatus: '0fc9c242-c31c-4dda-90fb-ba4401313983',
    senderDisplayName: '9af06bbb-1689-4c3c-b149-425c76017a28',
    body: 'c46245ed-0831-486b-a949-588fcaf57831',
    sentAt: '9cce9532-1523-464f-a847-93c6db21b1d9',
    isInternalNote: '2875fc6e-10a5-4941-a160-7a7aca721d32',
  },
  allMessagesSort: 'cd905db0-f3b9-4d02-93fa-f2e417682b17',
} as const;

export const INBOX_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  'c86baac4-eea9-4464-8de7-fe07ecf44b6b';
export const INBOX_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER =
  '36d54cc2-c839-4b50-8efe-d4f9e724d20f';
export const INBOX_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER =
  '675f8b5a-0ebb-424e-a191-9ce656ed7818';
export const INBOX_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER =
  'd45a91c3-9159-4229-ae56-673e3e2d1193';
export const INBOX_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER =
  'c07d3567-a2f3-4b86-b538-5d05ae2d0801';
