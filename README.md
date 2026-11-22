# Rewards consumers

Pub/Sub consumers for the rewards platform. Each consumer is a Cloud Function (2nd gen) that a Pub/Sub subscription triggers.

## Run

```bash
nvm use
npm install
npm test
npm run lint
```

## Layout

| Path | Contents |
|---|---|
| `src/lib/` | Shared code: logging, message decoding, idempotency, API clients. |
| `src/functions/<name>/handler.ts` | The consumer's logic. A factory function takes the dependencies and returns the handler. |
| `src/functions/<name>/index.ts` | Wires the real dependencies and registers the Cloud Function. |
| `test/` | Tests. In-memory fakes are in `test/fakes/`. |

## Conventions

1. **Idempotency.** Pub/Sub delivers each message at least once, so a consumer can receive the same message more than once. Wrap every external side effect (an API call, an email) in `withIdempotency` from `src/lib/idempotency.ts`, keyed on a business identifier from the payload.
2. **Validation.** Decode and validate every payload with a Zod schema through `decodeMessage`. Log and acknowledge an invalid message, because a retry cannot fix it.
3. **Logging.** Use the structured logger in `src/lib/logger.ts`. Log identifiers (the message ID and business IDs), never the full payload.
4. **Errors.** Throw to make Pub/Sub redeliver the message. Return normally to acknowledge it.
5. **Tests.** Test behaviour through the handler, with the fakes in `test/fakes/`. Every consumer has a test for a redelivered message.
