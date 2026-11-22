import type { CloudEvent } from "@google-cloud/functions-framework";
import type { z } from "zod";

/** The CloudEvent data that Pub/Sub sends to a 2nd gen Cloud Function. */
export interface MessagePublishedData {
  message: {
    messageId: string;
    /** Base64-encoded JSON. */
    data: string;
    attributes?: Record<string, string>;
    publishTime: string;
  };
  subscription: string;
}

export class InvalidMessageError extends Error {}

/** Decodes the JSON payload of a Pub/Sub message and validates it against the schema. */
export function decodeMessage<T>(
  event: CloudEvent<MessagePublishedData>,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
): T {
  const encoded = event.data?.message.data;
  if (!encoded) {
    throw new InvalidMessageError(`Message ${event.id} has no data`);
  }

  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    throw new InvalidMessageError(`Message ${event.id} is not valid JSON`);
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new InvalidMessageError(`Message ${event.id} failed validation: ${result.error.message}`);
  }
  return result.data;
}
