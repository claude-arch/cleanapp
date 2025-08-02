import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Client-side Stripe instance
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

// Payment Intent helpers
export const createPaymentIntent = async (
  amount: number,
  customerId: string,
  providerId: string,
  bookingId: string,
  paymentMethodId?: string
) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    customer: customerId,
    payment_method: paymentMethodId,
    confirmation_method: 'manual',
    confirm: paymentMethodId ? true : false,
    metadata: {
      bookingId,
      providerId,
      customerId,
    },
    transfer_data: {
      destination: providerId, // Provider's Stripe Connect account
    },
    application_fee_amount: Math.round(amount * 0.18 * 100), // 18% commission
  });

  return paymentIntent;
};

export const confirmPaymentIntent = async (
  paymentIntentId: string,
  paymentMethodId: string
) => {
  const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId,
  });

  return paymentIntent;
};

export const cancelPaymentIntent = async (paymentIntentId: string) => {
  const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
  return paymentIntent;
};

// Customer helpers
export const createStripeCustomer = async (
  email: string,
  name: string,
  phone?: string
) => {
  const customer = await stripe.customers.create({
    email,
    name,
    phone,
  });

  return customer;
};

export const updateStripeCustomer = async (
  customerId: string,
  data: Partial<Stripe.CustomerUpdateParams>
) => {
  const customer = await stripe.customers.update(customerId, data);
  return customer;
};

export const getStripeCustomer = async (customerId: string) => {
  const customer = await stripe.customers.retrieve(customerId);
  return customer;
};

// Payment Method helpers
export const attachPaymentMethod = async (
  paymentMethodId: string,
  customerId: string
) => {
  const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  return paymentMethod;
};

export const detachPaymentMethod = async (paymentMethodId: string) => {
  const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
  return paymentMethod;
};

export const listPaymentMethods = async (customerId: string) => {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  return paymentMethods;
};

export const setDefaultPaymentMethod = async (
  customerId: string,
  paymentMethodId: string
) => {
  const customer = await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  return customer;
};

// Stripe Connect helpers (for service providers)
export const createConnectAccount = async (
  email: string,
  businessName: string,
  businessType: 'individual' | 'company' = 'individual'
) => {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    email,
    business_type: businessType,
    company: businessType === 'company' ? {
      name: businessName,
    } : undefined,
    individual: businessType === 'individual' ? {
      email,
    } : undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return account;
};

export const createAccountLink = async (
  accountId: string,
  refreshUrl: string,
  returnUrl: string
) => {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return accountLink;
};

export const getConnectAccount = async (accountId: string) => {
  const account = await stripe.accounts.retrieve(accountId);
  return account;
};

export const updateConnectAccount = async (
  accountId: string,
  data: Stripe.AccountUpdateParams
) => {
  const account = await stripe.accounts.update(accountId, data);
  return account;
};

// Transfer helpers (for payouts)
export const createTransfer = async (
  amount: number,
  destination: string,
  metadata?: Record<string, string>
) => {
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    destination,
    metadata,
  });

  return transfer;
};

export const listTransfers = async (destination?: string) => {
  const transfers = await stripe.transfers.list({
    destination,
    limit: 100,
  });

  return transfers;
};

// Refund helpers
export const createRefund = async (
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
) => {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
    reason,
  });

  return refund;
};

// Webhook helpers
export const constructWebhookEvent = (
  payload: string | Buffer,
  signature: string,
  secret: string
) => {
  return stripe.webhooks.constructEvent(payload, signature, secret);
};

// Pricing helpers
export const calculateCommission = (amount: number, rate: number = 0.18) => {
  return Math.round(amount * rate * 100) / 100;
};

export const calculateProcessingFee = (amount: number) => {
  // Stripe's standard fee: 2.9% + $0.30
  return Math.round((amount * 0.029 + 0.30) * 100) / 100;
};

export const calculateNetAmount = (
  amount: number,
  commission: number,
  processingFee: number
) => {
  return Math.round((amount - commission - processingFee) * 100) / 100;
};

export const calculateTotalWithFees = (
  subtotal: number,
  commission: number = 0.18
) => {
  const commissionAmount = calculateCommission(subtotal, commission);
  const processingFee = calculateProcessingFee(subtotal + commissionAmount);
  const total = subtotal + commissionAmount + processingFee;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    commission: commissionAmount,
    processingFee,
    total: Math.round(total * 100) / 100,
    netAmount: calculateNetAmount(subtotal, commissionAmount, processingFee),
  };
};

// Error handling
export const handleStripeError = (error: Stripe.StripeError) => {
  console.error('Stripe error:', error);
  
  switch (error.type) {
    case 'StripeCardError':
      return {
        message: error.message || 'Your card was declined.',
        type: 'card_error',
      };
    case 'StripeRateLimitError':
      return {
        message: 'Too many requests made to the API too quickly.',
        type: 'rate_limit_error',
      };
    case 'StripeInvalidRequestError':
      return {
        message: error.message || 'Invalid parameters were supplied to Stripe\'s API.',
        type: 'invalid_request_error',
      };
    case 'StripeAPIError':
      return {
        message: 'An error occurred internally with Stripe\'s API.',
        type: 'api_error',
      };
    case 'StripeConnectionError':
      return {
        message: 'Some kind of error occurred during the HTTPS communication.',
        type: 'connection_error',
      };
    case 'StripeAuthenticationError':
      return {
        message: 'You probably used an incorrect API key.',
        type: 'authentication_error',
      };
    default:
      return {
        message: 'An unknown error occurred.',
        type: 'unknown_error',
      };
  }
};

// Subscription helpers (for future premium features)
export const createSubscription = async (
  customerId: string,
  priceId: string,
  paymentMethodId: string
) => {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    default_payment_method: paymentMethodId,
    expand: ['latest_invoice.payment_intent'],
  });

  return subscription;
};

export const cancelSubscription = async (subscriptionId: string) => {
  const subscription = await stripe.subscriptions.del(subscriptionId);
  return subscription;
};
