import { createPurchaseRecordedHandler } from "../../../src/functions/purchase-recorded/handler";
import { PointsStrategyFactory, StandardPointsStrategy } from "../../../src/functions/purchase-recorded/points-strategy";
import type { PointsApiClient } from "../../../src/lib/points-api";
import { fakeLogger, pubSubEvent } from "../../helpers";

describe("purchase-recorded handler", () => {
  const purchase = {
    purchaseId: "P-2001",
    memberId: "M-1001",
    amount: 42.75,
    storeId: "S-17",
    purchasedAt: "2026-11-01T12:15:00.000Z",
  };

  let pointsApi: jest.Mocked<PointsApiClient>;
  let logger: ReturnType<typeof fakeLogger>;

  beforeEach(() => {
    pointsApi = { allocate: jest.fn().mockResolvedValue({ allocationId: "A-1" }) };
    logger = fakeLogger();
  });

  it("allocates one point for each whole dollar", async () => {
    const handler = createPurchaseRecordedHandler({ pointsApi, logger });

    await handler(pubSubEvent(purchase));

    expect(pointsApi.allocate).toHaveBeenCalledWith({ memberId: "M-1001", points: 42, reason: "purchase:P-2001" });
  });

  it("does not call the points API when the purchase earns no points", async () => {
    const handler = createPurchaseRecordedHandler({ pointsApi, logger });

    await handler(pubSubEvent({ ...purchase, amount: 0.5 }));

    expect(pointsApi.allocate).not.toHaveBeenCalled();
  });

  it("acknowledges an invalid message without allocating points", async () => {
    const handler = createPurchaseRecordedHandler({ pointsApi, logger });

    await handler(pubSubEvent({ purchaseId: "P-2001" }));

    expect(pointsApi.allocate).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it("uses the standard points strategy by default", () => {
    const create = jest.spyOn(PointsStrategyFactory, "create");

    createPurchaseRecordedHandler({ pointsApi, logger });

    expect(create).toHaveBeenCalledWith("standard");
    expect(PointsStrategyFactory.create()).toBeInstanceOf(StandardPointsStrategy);
  });
});
