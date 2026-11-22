import type { ClaimResult, IdempotencyStore } from "../../src/lib/idempotency";

/** An in-memory IdempotencyStore for tests. It behaves like the Firestore store, without claim expiry. */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly keys = new Map<string, "claimed" | "completed">();

  async claim(key: string): Promise<ClaimResult> {
    const status = this.keys.get(key);
    if (status === "completed") {
      return "completed";
    }
    if (status === "claimed") {
      return "in-progress";
    }
    this.keys.set(key, "claimed");
    return "claimed";
  }

  async complete(key: string): Promise<void> {
    this.keys.set(key, "completed");
  }

  async release(key: string): Promise<void> {
    this.keys.delete(key);
  }
}
