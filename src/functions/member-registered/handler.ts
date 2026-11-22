import type { CloudEvent } from "@google-cloud/functions-framework";
import { z } from "zod";
import type { EmailClient } from "../../lib/email-client";
import { type IdempotencyStore, withIdempotency } from "../../lib/idempotency";
import type { Logger } from "../../lib/logger";
import { decodeMessage, InvalidMessageError, type MessagePublishedData } from "../../lib/pubsub";

const MemberRegistered = z.object({
  memberId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().min(1),
  registeredAt: z.string().datetime(),
});

export interface MemberRegisteredDeps {
  email: EmailClient;
  idempotency: IdempotencyStore;
  logger: Logger;
}

/** Sends the welcome email when a member registers. */
export function createMemberRegisteredHandler({ email, idempotency, logger }: MemberRegisteredDeps) {
  return async (event: CloudEvent<MessagePublishedData>): Promise<void> => {
    let member: z.infer<typeof MemberRegistered>;
    try {
      member = decodeMessage(event, MemberRegistered);
    } catch (err) {
      if (err instanceof InvalidMessageError) {
        logger.error("Invalid member-registered message", { messageId: event.id, error: err.message });
        return;
      }
      throw err;
    }

    const outcome = await withIdempotency(idempotency, `welcome-email:${member.memberId}`, () =>
      email.send({ to: member.email, template: "welcome", variables: { firstName: member.firstName } }),
    );

    logger.info("Welcome email handled", { messageId: event.id, memberId: member.memberId, outcome });
  };
}
