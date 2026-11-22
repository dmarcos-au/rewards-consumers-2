/**
 * Runs a side effect at most once per key, so that a redelivered message does not repeat it.
 *
 * Pub/Sub delivers each message at least once. Wrap every external side effect in a consumer
 * (an API call, an email) in withIdempotency, keyed on a business identifier from the payload.
 */

export type ClaimResult = "claimed" | "completed" | "in-progress";

export interface IdempotencyStore {
  /**
   * Claims the key. Returns "completed" if the work for the key is already done, or
   * "in-progress" if another delivery holds a current claim on the key.
   */
  claim(key: string): Promise<ClaimResult>;
  /** Records that the work for a claimed key is done. */
  complete(key: string): Promise<void>;
  /** Removes the claim after a failure, so that a redelivery can retry the work. */
  release(key: string): Promise<void>;
}

export class ClaimInProgressError extends Error {}

export type IdempotencyOutcome = "processed" | "duplicate";

export async function withIdempotency(
  store: IdempotencyStore,
  key: string,
  work: () => Promise<void>,
): Promise<IdempotencyOutcome> {
  const claim = await store.claim(key);
  if (claim === "completed") {
    return "duplicate";
  }
  if (claim === "in-progress") {
    // Another delivery of the same work is still running. Throw so that Pub/Sub redelivers later.
    throw new ClaimInProgressError(`Work for key ${key} is in progress`);
  }

  try {
    await work();
  } catch (err) {
    await store.release(key);
    throw err;
  }

  await store.complete(key);
  return "processed";
}
