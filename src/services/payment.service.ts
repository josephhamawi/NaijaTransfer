/**
 * Payments in Firestore.
 *
 * Stored as a subcollection of the user — `users/{uid}/payments/{ref}` —
 * because a payment is only ever read in the context of one account,
 * and keying by the Paystack reference makes the webhook's update
 * idempotent: a replayed `charge.success` writes the same document
 * instead of creating a second row.
 */

import { getDb } from "@/lib/firebase-admin";
import { USERS } from "@/services/user.service";

export const PAYMENTS = "payments";

export interface PaymentDoc {
  id: string;
  type: "SUBSCRIPTION" | "ONE_TIME";
  amount: number;
  currency: string;
  paystackRef: string;
  paystackSubCode: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

type Db = ReturnType<typeof getDb>;

function db(injected?: unknown): Db {
  return (injected as Db) ?? getDb();
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  const maybe = value as { toDate?: () => Date };
  return typeof maybe?.toDate === "function" ? maybe.toDate() : new Date(String(value));
}

/** Document id is the Paystack reference: unique, and idempotent to rewrite. */
function paymentRef(database: Db, uid: string, reference: string) {
  return database.collection(USERS).doc(uid).collection(PAYMENTS).doc(reference);
}

export async function recordPendingPayment(
  uid: string,
  input: { amount: number; currency: string; paystackRef: string },
  injected?: unknown
): Promise<void> {
  const now = new Date();
  await paymentRef(db(injected), uid, input.paystackRef).set({
    type: "SUBSCRIPTION",
    amount: input.amount,
    currency: input.currency,
    paystackRef: input.paystackRef,
    paystackSubCode: null,
    status: "PENDING",
    metadata: null,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Mark a payment settled.
 *
 * Runs in a transaction so a webhook that arrives BEFORE the checkout
 * response was written still produces a complete record. A plain merge
 * was not enough: the document it created had no `createdAt`, and
 * `listUserPayments` orders by that field — Firestore drops documents
 * missing the ordered field, so the payment existed but was invisible
 * to the customer forever.
 */
export async function markPaymentStatus(
  uid: string,
  reference: string,
  status: PaymentDoc["status"],
  injected?: unknown
): Promise<void> {
  const database = db(injected);
  const ref = paymentRef(database, uid, reference);

  await database.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = new Date();

    if (snap.exists) {
      tx.update(ref, { status, updatedAt: now });
      return;
    }

    // Webhook first: write a complete record rather than a fragment.
    tx.set(ref, {
      type: "SUBSCRIPTION",
      amount: 0,
      currency: "NGN",
      paystackRef: reference,
      paystackSubCode: null,
      status,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    });
  });
}

export async function listUserPayments(
  uid: string,
  injected?: unknown
): Promise<PaymentDoc[]> {
  const snap = await db(injected)
    .collection(USERS)
    .doc(uid)
    .collection(PAYMENTS)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => {
    const data = d.data() ?? {};
    return {
      id: d.id,
      type: (data.type as PaymentDoc["type"]) ?? "SUBSCRIPTION",
      amount: Number(data.amount ?? 0),
      currency: String(data.currency ?? "NGN"),
      paystackRef: String(data.paystackRef ?? d.id),
      paystackSubCode: (data.paystackSubCode as string) ?? null,
      status: (data.status as PaymentDoc["status"]) ?? "PENDING",
      metadata: (data.metadata as Record<string, unknown>) ?? null,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  });
}
