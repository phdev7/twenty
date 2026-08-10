import { z } from 'zod';

import { type CustomerSuccessService } from 'src/modules/customer-success/services/customer-success.service';

const reviewCustomerSuccessSchema = z.object({
  successPlanId: z.string().min(1),
  updateSuccessPlan: z.boolean().optional(),
  proposeAction: z.boolean().optional(),
});

export const createReviewCustomerSuccessTool = (
  service: CustomerSuccessService,
  workspaceId: string,
) => ({
  name: 'review_diex_customer_success' as const,
  description:
    'Revisa um plano de sucesso no workspace, calcula saúde com evidências e opcionalmente registra uma proposta governada para aprovação humana.',
  inputSchema: reviewCustomerSuccessSchema,
  execute: async (parameters: z.infer<typeof reviewCustomerSuccessSchema>) =>
    service.review({
      workspaceId,
      successPlanId: parameters.successPlanId.trim(),
      updateSuccessPlan: parameters.updateSuccessPlan === true,
      proposeAction: parameters.proposeAction === true,
    }),
});
