import type { CloudEvent } from "@google-cloud/functions-framework";
import type { Logger } from "../src/lib/logger";
import type { MessagePublishedData } from "../src/lib/pubsub";

/**
 * Builds the CloudEvent that Pub/Sub sends to a Cloud Function.
 * Call it twice with the same payload to simulate a redelivered message.
 */
export function pubSubEvent(payload: unknown, messageId = "msg-1"): CloudEvent<MessagePublishedData> {
  return {
    specversion: "1.0",
    id: messageId,
    source: "//pubsub.googleapis.com/projects/test/topics/test",
    type: "google.cloud.pubsub.topic.v1.messagePublished",
    data: {
      message: {
        messageId,
        data: Buffer.from(JSON.stringify(payload)).toString("base64"),
        publishTime: "2026-11-01T00:00:00.000Z",
      },
      subscription: "projects/test/subscriptions/test",
    },
  };
}

export function fakeLogger(): jest.Mocked<Logger> {
  return { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
}
