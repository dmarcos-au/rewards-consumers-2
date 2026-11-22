import { Firestore } from "@google-cloud/firestore";
import * as functions from "@google-cloud/functions-framework";
import { requireEnv } from "../../lib/config";
import { httpEmailClient } from "../../lib/email-client";
import { firestoreIdempotencyStore } from "../../lib/firestore-idempotency-store";
import { logger } from "../../lib/logger";
import type { MessagePublishedData } from "../../lib/pubsub";
import { createMemberRegisteredHandler } from "./handler";

const handler = createMemberRegisteredHandler({
  email: httpEmailClient(requireEnv("EMAIL_API_URL"), requireEnv("EMAIL_API_KEY")),
  idempotency: firestoreIdempotencyStore(new Firestore()),
  logger,
});

functions.cloudEvent<MessagePublishedData>("memberRegistered", handler);
