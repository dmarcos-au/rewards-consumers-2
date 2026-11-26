import * as functions from "@google-cloud/functions-framework";
import { requireEnv } from "../../lib/config";
import { logger } from "../../lib/logger";
import { httpPointsApiClient } from "../../lib/points-api";
import type { MessagePublishedData } from "../../lib/pubsub";
import { createPurchaseRecordedHandler } from "./handler";

const handler = createPurchaseRecordedHandler({
  pointsApi: httpPointsApiClient(requireEnv("POINTS_API_URL"), requireEnv("POINTS_API_KEY")),
  logger,
});

functions.cloudEvent<MessagePublishedData>("purchaseRecorded", handler);
