import { Injectable } from '@nestjs/common';

import { type ToolSet } from 'ai';

import { CustomerSuccessService } from 'src/modules/customer-success/services/customer-success.service';
import { createAssessCustomerHealthTool } from 'src/modules/customer-success/tools/assess-customer-health.tool';
import { createReviewCustomerSuccessTool } from 'src/modules/customer-success/tools/review-customer-success.tool';

@Injectable()
export class CustomerSuccessToolWorkspaceService {
  constructor(
    private readonly customerSuccessService: CustomerSuccessService,
  ) {}

  generateCustomerSuccessTools(workspaceId: string): ToolSet {
    const assess = createAssessCustomerHealthTool();
    const review = createReviewCustomerSuccessTool(
      this.customerSuccessService,
      workspaceId,
    );

    return {
      [assess.name]: assess,
      [review.name]: review,
    };
  }
}
