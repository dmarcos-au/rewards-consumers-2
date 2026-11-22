import type { CloudEvent } from "@google-cloud/functions-framework";
import { z } from "zod";
import type { Logger } from "../../lib/logger";
import type { PointsApiClient } from "../../lib/points-api";
import { decodeMessage, InvalidMessageError, type MessagePublishedData } from "../../lib/pubsub";
import { PointsStrategyFactory, type PointsStrategyName } from "./points-strategy";

const PurchaseRecorded = z.object({
  purchaseId: z.string().min(1),
  memberId: z.string().min(1),
  amount: z.number().nonnegative(),
  storeId: z.string().min(1),
  purchasedAt: z.string().datetime(),
});

export interface PurchaseRecordedDeps {
  pointsApi: PointsApiClient;
  logger: Logger;
  strategyName?: PointsStrategyName;
}

/** Allocates points to the member for each recorded purchase. */
export function createPurchaseRecordedHandler({ pointsApi, logger, strategyName = "standard" }: PurchaseRecordedDeps) {
  const strategy = PointsStrategyFactory.create(strategyName);

  return async (event: CloudEvent<MessagePublishedData>): Promise<void> => {
    let purchase: z.infer<typeof PurchaseRecorded>;
    try {
      purchase = decodeMessage(event, PurchaseRecorded);
    } catch (err) {
      if (err instanceof InvalidMessageError) {
        logger.error("Invalid purchase-recorded message", { messageId: event.id, error: err.message });
        return;
      }
      throw err;
    }

    logger.info("Processing purchase-recorded message", { messageId: event.id, purchase });

    const points = strategy.calculate({ amount: purchase.amount, storeId: purchase.storeId });
    if (points === 0) {
      logger.info("No points to allocate", { messageId: event.id, purchaseId: purchase.purchaseId });
      return;
    }

    const { allocationId } = await pointsApi.allocate({
      memberId: purchase.memberId,
      points,
      reason: `purchase:${purchase.purchaseId}`,
    });

    logger.info("Points allocated", { messageId: event.id, purchaseId: purchase.purchaseId, allocationId, points });
  };
}
