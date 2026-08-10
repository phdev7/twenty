/* @license Enterprise */

import { Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'diex-shared/utils';
import type Stripe from 'stripe';

import { BillingCustomerEntity } from 'src/engine/core-modules/billing/entities/billing-customer.entity';
import { StripeSDKService } from 'src/engine/core-modules/billing/stripe/stripe-sdk/services/stripe-sdk.service';
import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';
import { InjectWorkspaceScopedRepository } from 'src/engine/diex-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/diex-orm/workspace-scoped-repository/workspace-scoped-repository';
@Injectable()
export class StripeCustomerService {
  protected readonly logger = new Logger(StripeCustomerService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly diexConfigService: DiexConfigService,
    private readonly stripeSDKService: StripeSDKService,
    @InjectWorkspaceScopedRepository(BillingCustomerEntity)
    private readonly billingCustomerRepository: WorkspaceScopedRepository<BillingCustomerEntity>,
  ) {
    if (!this.diexConfigService.get('IS_BILLING_ENABLED')) {
      return;
    }
    this.stripe = this.stripeSDKService.getStripe(
      this.diexConfigService.get('BILLING_STRIPE_API_KEY'),
    );
  }

  async updateCustomerMetadataWorkspaceId(
    stripeCustomerId: string,
    workspaceId: string,
  ) {
    await this.stripe.customers.update(stripeCustomerId, {
      metadata: { workspaceId: workspaceId },
    });
  }

  async hasPaymentMethod(stripeCustomerId: string) {
    const { data: paymentMethods } =
      await this.stripe.customers.listPaymentMethods(stripeCustomerId);

    return paymentMethods.length > 0;
  }

  async createSetupIntent(
    stripeCustomerId: string,
  ): Promise<Stripe.SetupIntent> {
    return await this.stripe.setupIntents.create({
      customer: stripeCustomerId,
      usage: 'off_session',
      automatic_payment_methods: { enabled: true },
    });
  }

  async ensureDefaultPaymentMethod(stripeCustomerId: string): Promise<void> {
    const customer = await this.stripe.customers.retrieve(stripeCustomerId);

    if ('deleted' in customer && customer.deleted === true) {
      return;
    }

    if (isDefined(customer.invoice_settings?.default_payment_method)) {
      return;
    }

    const { data: paymentMethods } =
      await this.stripe.customers.listPaymentMethods(stripeCustomerId, {
        limit: 1,
      });
    const paymentMethodId = paymentMethods[0]?.id;

    if (!isDefined(paymentMethodId)) {
      return;
    }

    await this.stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  async createStripeCustomer(
    userEmail: string,
    workspaceId: string,
    customerName: string | undefined,
  ) {
    const customer = await this.stripe.customers.create({
      name: customerName,
      email: userEmail,
      metadata: {
        workspaceId,
      },
    });

    await this.billingCustomerRepository.save(workspaceId, {
      stripeCustomerId: customer.id,
      hasPaymentMethod: false,
    });

    return customer;
  }
}
