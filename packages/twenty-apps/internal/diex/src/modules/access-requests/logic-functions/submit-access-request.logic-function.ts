import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  ACCESS_REQUEST_FIELD_MAX_LENGTH,
  ACCESS_REQUEST_GOAL_MAX_LENGTH,
  ACCESS_REQUEST_MAX_SUBMISSIONS_PER_EMAIL,
  SUBMIT_ACCESS_REQUEST_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  SUBMIT_ACCESS_REQUEST_ROUTE,
} from 'src/modules/access-requests/constants/access-request.constants';
import { AccessRequestStatus } from 'src/modules/access-requests/objects/access-request.object';

export type SubmitAccessRequestResult = {
  accepted: boolean;
  message: string;
};

type AccessRequestInput = {
  companyName?: unknown;
  contactName?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  teamSize?: unknown;
  desiredSubdomain?: unknown;
  goal?: unknown;
  // Hidden input a human never sees. Anything filled here is a bot.
  website?: unknown;
};

const readText = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const readEmail = (value: unknown): string | null => {
  const text = readText(value, ACCESS_REQUEST_FIELD_MAX_LENGTH);

  if (!text) {
    return null;
  }

  const normalized = text.toLowerCase();

  return EMAIL_PATTERN.test(normalized) ? normalized : null;
};

// Stored the way the inbox stores contactHandle, so an approved lead's future
// WhatsApp conversation lines up with the request that created it.
const readWhatsapp = (value: unknown): string | null => {
  const text = readText(value, ACCESS_REQUEST_FIELD_MAX_LENGTH);

  if (!text) {
    return null;
  }

  const digits = text.replace(/\D/g, '');

  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  // A Brazilian number typed without the country code is the common case and
  // would otherwise be stored unreachable.
  const withCountryCode =
    digits.length <= 11 && !text.trim().startsWith('+') ? `55${digits}` : digits;

  return `+${withCountryCode}`;
};

const readSubdomain = (value: unknown): string | null => {
  const text = readText(value, 30);

  if (!text) {
    return null;
  }

  const normalized = text.toLowerCase().replace(/[^a-z0-9-]/g, '');

  return normalized.length >= 3 ? normalized : null;
};

const handler = async (
  routePayload: RoutePayload<AccessRequestInput>,
): Promise<SubmitAccessRequestResult> => {
  const input = routePayload.body ?? {};

  // Answer the bot exactly like a human so it learns nothing from the response.
  if (readText(input.website, 10) !== null) {
    return {
      accepted: true,
      message: 'Recebemos sua solicitação.',
    };
  }

  const companyName = readText(input.companyName, ACCESS_REQUEST_FIELD_MAX_LENGTH);
  const email = readEmail(input.email);
  const whatsapp = readWhatsapp(input.whatsapp);

  if (!companyName || !email || !whatsapp) {
    return {
      accepted: false,
      message:
        'Informe o nome da empresa, um e-mail válido e um WhatsApp com DDD.',
    };
  }

  const client = new CoreApiClient();
  const existingResult = (await client.query({
    diexAccessRequests: {
      __args: { filter: { email: { eq: email } }, first: 1 },
      edges: { node: { id: true, status: true, submissionCount: true } },
    },
  } as never)) as unknown as {
    diexAccessRequests?: {
      edges?: Array<{
        node?: {
          id?: string;
          status?: string | null;
          submissionCount?: number | null;
        } | null;
      }>;
    };
  };
  const existing = existingResult.diexAccessRequests?.edges?.[0]?.node;
  const contactName = readText(input.contactName, ACCESS_REQUEST_FIELD_MAX_LENGTH);
  const teamSize = readText(input.teamSize, ACCESS_REQUEST_FIELD_MAX_LENGTH);
  const desiredSubdomain = readSubdomain(input.desiredSubdomain);
  const goal = readText(input.goal, ACCESS_REQUEST_GOAL_MAX_LENGTH);

  if (existing?.id) {
    const submissionCount = (existing.submissionCount ?? 1) + 1;

    if (submissionCount > ACCESS_REQUEST_MAX_SUBMISSIONS_PER_EMAIL) {
      return {
        accepted: true,
        message: 'Recebemos sua solicitação.',
      };
    }

    // A decided request is never reopened by a public form; the operator owns
    // that transition.
    const shouldPreserveDecision =
      existing.status === AccessRequestStatus.APPROVED ||
      existing.status === AccessRequestStatus.REJECTED;

    await client.mutation({
      updateDiexAccessRequest: {
        __args: {
          id: existing.id,
          data: {
            name: companyName,
            contactName,
            whatsapp,
            teamSize,
            desiredSubdomain,
            goal,
            submissionCount,
            ...(shouldPreserveDecision
              ? {}
              : { requestedAt: new Date().toISOString() }),
          },
        },
        id: true,
      },
    } as never);

    return {
      accepted: true,
      message: 'Atualizamos sua solicitação. Entraremos em contato pelo WhatsApp.',
    };
  }

  await client.mutation({
    createDiexAccessRequest: {
      __args: {
        data: {
          name: companyName,
          status: AccessRequestStatus.NEW,
          contactName,
          email,
          whatsapp,
          teamSize,
          desiredSubdomain,
          goal,
          submissionCount: 1,
          requestedAt: new Date().toISOString(),
        },
      },
      id: true,
    },
  } as never);

  return {
    accepted: true,
    message: 'Solicitação recebida. Entraremos em contato pelo WhatsApp.',
  };
};

export default defineLogicFunction({
  universalIdentifier: SUBMIT_ACCESS_REQUEST_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'submit-diex-access-request',
  description:
    'Recebe o formulário público de solicitação de acesso e registra o lead. Não cria workspace, não reserva subdomínio e não provisiona WhatsApp.',
  timeoutSeconds: 20,
  handler,
  // Deliberately no toolTriggerSettings: this writes from unauthenticated
  // input and must never be reachable as an agent or MCP tool.
  httpRouteTriggerSettings: {
    path: SUBMIT_ACCESS_REQUEST_ROUTE,
    httpMethod: 'POST',
    isAuthRequired: false,
  },
});
