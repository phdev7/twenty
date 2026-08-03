import { z } from 'zod';

import { MeetingTranscriptService } from 'src/modules/meetings/services/meeting-transcript.service';

const schema = z.object({
  transcript: z.string().min(80),
  title: z.string().optional(),
  meetingAt: z.string().optional(),
  companyId: z.string().optional(),
  personId: z.string().optional(),
  opportunityId: z.string().optional(),
  companySearch: z.string().optional(),
  participants: z.string().optional(),
});

export const createRegisterMeetingTranscriptTool = (
  service: MeetingTranscriptService,
  workspaceId: string,
) => ({
  name: 'register_diex_meeting_transcript' as const,
  description:
    'Grava uma transcrição como nota ligada a empresa, contato e oportunidade, devolvendo contexto comercial direto do workspace.',
  inputSchema: schema,
  execute: async (parameters: z.infer<typeof schema>) =>
    service.register({ workspaceId, ...parameters }),
});
