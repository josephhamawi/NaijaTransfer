import type { PaymentStatus, PaymentType } from "@/types/enums";

/**
 * Paystack webhook event types that we handle.
 */
export type PaystackEventType =
  | "charge.success"
  | "subscription.create"
  | "subscription.not_renew"
  | "subscription.disable"
  | "invoice.payment_failed";

/**
 * Paystack webhook payload.
 */
export interface PaystackWebhookPayload {
  event: PaystackEventType;
  data: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    plan?: {
      id: number;
      plan_code: string;
      name: string;
    };
    subscription_code?: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Payment history item for the dashboard.
 */
export interface PaymentHistoryItem {
  id: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paystackRef: string;
  createdAt: string;
}
