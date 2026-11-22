import type { Firestore } from "@google-cloud/firestore";
import type { ClaimResult, IdempotencyStore } from "./idempotency";

const COLLECTION = "idempotency-keys";

/**
 * A claim older than this is treated as abandoned (for example, the function timed out),
 * so a redelivery can claim the key again.
 */
const CLAIM_TTL_MS = 10 * 60 * 1000;

export function firestoreIdempotencyStore(db: Firestore): IdempotencyStore {
  const keyDoc = (key: string) => db.collection(COLLECTION).doc(key);

  return {
    claim: (key) =>
      db.runTransaction(async (tx): Promise<ClaimResult> => {
        const existing = (await tx.get(keyDoc(key))).data();
        if (existing?.status === "completed") {
          return "completed";
        }
        if (existing?.status === "claimed" && Date.now() - existing.claimedAt < CLAIM_TTL_MS) {
          return "in-progress";
        }
        tx.set(keyDoc(key), { status: "claimed", claimedAt: Date.now() });
        return "claimed";
      }),

    complete: async (key) => {
      await keyDoc(key).update({ status: "completed", completedAt: Date.now() });
    },

    release: async (key) => {
      await keyDoc(key).delete();
    },
  };
}
