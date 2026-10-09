# Design Notes

## Stack and why

- **Next.js (App Router), full-stack.** One codebase for UI, API routes, and middleware — no separate backend to stand up or keep in sync for a project this size.
- **MongoDB Atlas + Mongoose.** The domain (workshops, registrations, users) is simple and document-shaped. Mongoose gives typed documents and, critically, `findOneAndUpdate` with `$expr`-based atomic updates — the primitive the capacity check below depends on.
- **NextAuth with a Credentials provider, not a custom JWT implementation.** Token issuance, cookie handling, and CSRF on the login callback are well-trodden ground NextAuth already handles correctly; `authorize()` just does a bcrypt-compare against `User.passwordHash`. The `jwt`/`session` callbacks attach `role` and `id` so every route and page can read them without an extra DB round-trip.
- **Hand-written validators, not a schema library.** Per the brief, validation is plain TypeScript functions returning `{valid: true, data: T} | {valid: false, errors: string[]}` — smaller dependency footprint, and full control over the error strings the UI maps to form fields, at the cost of writing the null-checks by hand.

## Preventing over-registration

The risk: two requests for the last seat both read `activeCount < capacity` as true before either writes, and both succeed — overbooking the workshop. The fix is to never let application code make that decision; the database makes it as one atomic operation:

```ts
const workshop = await Workshop.findOneAndUpdate(
  { _id: workshopId, $expr: { $lt: ["$activeCount", "$capacity"] } },
  { $inc: { activeCount: 1 } },
  { returnDocument: "after" }
);
if (!workshop) return 409; // full, or doesn't exist — no Registration is created
```

MongoDB evaluates the filter (including the capacity comparison) and applies the `$inc` as one indivisible operation, so concurrent requests are serialized by the database, not the application: only one can match-and-increment past the limit; the rest get `null` back. Only after the seat is reserved does the code create the `Registration` row; if that write somehow fails, the reservation is rolled back with a compensating `$inc: -1` and a `500` is returned, so the counter and the actual rows can't drift apart on that path.

This is verified directly: `scripts/test-concurrency.ts` creates a workshop with exactly one seat left and fires five concurrent `POST /api/registrations` requests with `Promise.all`. Run via `npm run test:concurrency`, the observed result is consistently:

```
Succeeded (201): 1  (expected: 1)
Rejected  (409): 4  (expected: 4)
```

## Access control

Every mutating (and most reading) API routes call `requireRole([...])` as their first statement, before touching the body or the database, returning `401`/`403` immediately on failure (`lib/auth.ts`). This is deliberately duplicated at the UI layer — `middleware.ts` redirects unauthenticated users and role-mismatched routes, and pages also check `useSession()` and show a "not authorized" fallback — but the UI layer is pure UX. A stale session or a direct API request can't get past `requireRole()`, which never trusts anything the client claims about itself. The API is the real security boundary; everything else fails closed if skipped.

## Key design decisions

- **Registrations are never deleted, only flipped to `status: "cancelled"`**, recording `cancelledBy`/`cancelledAt`. This preserves who registered and who cancelled, and when, rather than losing that history.
- **`activeCount` is a denormalized counter on `Workshop`**, updated atomically alongside registration/cancellation, instead of counting active `Registration` documents on every read. This keeps `GET /api/workshops` cheap, and — more importantly — it's the exact field the atomic capacity check compares against; counting live on each request would reintroduce the race this design exists to avoid.

## Trade-offs and assumptions

- The counter trades a theoretical drift risk (if a document were ever edited outside the app's own atomic paths) for correctness-under-concurrency and cheap reads; no reconciliation job was built, since every write path keeps it in sync by construction.
- `PATCH /api/workshops/[id]` doesn't re-check code uniqueness on update (only `POST` does on create) — a known gap, not hit by the seeded flows.
- No rate limiting, pagination, or email notifications — out of scope for the time available.

## What was skipped, and why

- **Waitlisting.** The brief's core deliverable was capacity *enforcement*, not overflow handling; a waitlist (ordering, promotion-on-cancel, notification) is a separate feature with its own race conditions, cut to keep the atomic-registration logic the focus.
- **A separate audit-log collection.** Not built as a distinct feature, but effectively covered — `Registration` already records who/when for both registering and cancelling, and rows are never deleted. A general-purpose audit log over every entity (user/workshop edits too) was lower priority than registration integrity given the time constraint.
