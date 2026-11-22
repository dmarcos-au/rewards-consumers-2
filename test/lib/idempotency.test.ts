import { ClaimInProgressError, withIdempotency } from "../../src/lib/idempotency";
import { InMemoryIdempotencyStore } from "../fakes/in-memory-idempotency-store";

describe("withIdempotency", () => {
  let store: InMemoryIdempotencyStore;

  beforeEach(() => {
    store = new InMemoryIdempotencyStore();
  });

  it("runs the work the first time it sees a key", async () => {
    const work = jest.fn().mockResolvedValue(undefined);

    await expect(withIdempotency(store, "key-1", work)).resolves.toBe("processed");
    expect(work).toHaveBeenCalledTimes(1);
  });

  it("does not run the work again for a completed key", async () => {
    const work = jest.fn().mockResolvedValue(undefined);

    await withIdempotency(store, "key-1", work);

    await expect(withIdempotency(store, "key-1", work)).resolves.toBe("duplicate");
    expect(work).toHaveBeenCalledTimes(1);
  });

  it("releases the claim when the work fails, so that a redelivery can retry it", async () => {
    const work = jest.fn().mockRejectedValueOnce(new Error("API unavailable")).mockResolvedValueOnce(undefined);

    await expect(withIdempotency(store, "key-1", work)).rejects.toThrow("API unavailable");

    await expect(withIdempotency(store, "key-1", work)).resolves.toBe("processed");
    expect(work).toHaveBeenCalledTimes(2);
  });

  it("throws while another delivery holds the claim", async () => {
    await store.claim("key-1");

    await expect(withIdempotency(store, "key-1", jest.fn())).rejects.toThrow(ClaimInProgressError);
  });
});
