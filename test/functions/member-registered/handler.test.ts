import { createMemberRegisteredHandler } from "../../../src/functions/member-registered/handler";
import type { EmailClient } from "../../../src/lib/email-client";
import { InMemoryIdempotencyStore } from "../../fakes/in-memory-idempotency-store";
import { fakeLogger, pubSubEvent } from "../../helpers";

describe("member-registered handler", () => {
  const member = {
    memberId: "M-1001",
    email: "alex@example.com",
    firstName: "Alex",
    registeredAt: "2026-11-01T09:30:00.000Z",
  };

  let email: jest.Mocked<EmailClient>;
  let logger: ReturnType<typeof fakeLogger>;
  let handler: ReturnType<typeof createMemberRegisteredHandler>;

  beforeEach(() => {
    email = { send: jest.fn().mockResolvedValue(undefined) };
    logger = fakeLogger();
    handler = createMemberRegisteredHandler({ email, idempotency: new InMemoryIdempotencyStore(), logger });
  });

  it("sends the welcome email", async () => {
    await handler(pubSubEvent(member));

    expect(email.send).toHaveBeenCalledWith({
      to: "alex@example.com",
      template: "welcome",
      variables: { firstName: "Alex" },
    });
  });

  it("sends the welcome email once when the message is delivered twice", async () => {
    await handler(pubSubEvent(member));
    await handler(pubSubEvent(member));

    expect(email.send).toHaveBeenCalledTimes(1);
  });

  it("throws when the email API fails, so that Pub/Sub redelivers the message", async () => {
    email.send.mockRejectedValueOnce(new Error("Email API request failed: HTTP 503"));

    await expect(handler(pubSubEvent(member))).rejects.toThrow("HTTP 503");
  });

  it("acknowledges an invalid message without sending an email", async () => {
    await expect(handler(pubSubEvent({ memberId: "M-1001" }))).resolves.toBeUndefined();

    expect(email.send).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
