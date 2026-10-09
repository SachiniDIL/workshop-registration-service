# Workshop Registration Service

[Live deployment](https://workshop-registration-service-sable.vercel.app/)

A Next.js (App Router) + TypeScript app for managing workshops and attendee registrations, with role-based access for Admins, Managers, and Staff. There is no public signup — the first Admin account is seeded, and Admins create every other account.

## Prerequisites

- **Node.js 20.9 or later** (required by Next.js 16)
- **MongoDB** — either:
  - A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster, or
  - A local MongoDB instance (`mongodb://localhost:27017/...`)

## Environment setup

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

`.env` needs three variables:

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | Your MongoDB connection string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/workshop-registration` (Atlas) or `mongodb://localhost:27017/workshop-registration` (local) |
| `NEXTAUTH_SECRET` | A random secret NextAuth uses to sign session tokens |
| `NEXTAUTH_URL` | The app's base URL in this environment, e.g. `http://localhost:3000` |

**Generating `NEXTAUTH_SECRET`:**

```bash
openssl rand -base64 32
```

(No `openssl`? Any sufficiently random 32+ byte string works, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.)

## Install and run

Run these in order:

```bash
npm install
npm run seed
npm run dev
```

- `npm install` — installs dependencies
- `npm run seed` — connects to `MONGODB_URI`, wipes Users/Workshops/Registrations/AuditLogs, and creates the seed data described below (refuses to run if `NODE_ENV=production`)
- `npm run dev` — starts the dev server at [http://localhost:3000](http://localhost:3000)

## Seeded credentials

Per the assignment, **only one Admin account is seeded** — there is no public signup, so this is the sole entry point into the app:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@workshop.test` | `Admin1234!` |

Log in as Admin and use `/admin/users` to create Manager and Staff accounts to exercise those roles.

The seed also creates 6 sample workshops (past/this-week/future, varying statuses and capacities, including one near-full and one completely full) with a mix of active and cancelled registrations attached.

## Running the concurrency test

`scripts/test-concurrency.ts` is a standalone proof that the capacity-enforcement logic holds under a real race condition. Since only an Admin account is seeded but registering requires a Manager/Staff session, the script creates its own throwaway Staff user directly in the database for the duration of the test (and deletes it again in cleanup): it authenticates as that user, creates a workshop with exactly 1 seat remaining, fires 5 simultaneous `POST /api/registrations` requests at it, and reports how many succeeded vs. were rejected.

1. Make sure the dev server is running (`npm run dev` in one terminal)
2. In another terminal:

```bash
npm run test:concurrency
```

Expected output: exactly **1** request succeeds (`201`) and the other **4** are rejected (`409`). See [DESIGN.md](./DESIGN.md) for why this is guaranteed rather than merely likely.
