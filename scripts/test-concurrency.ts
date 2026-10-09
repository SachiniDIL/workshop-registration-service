import "dotenv/config";
import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db";
import { User } from "../models/User";
import { Workshop } from "../models/Workshop";
import { Registration } from "../models/Registration";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const STAFF_EMAIL = "staff@workshop.test";
const STAFF_PASSWORD = "Staff1234!";
const CONCURRENT_REQUESTS = 5;

async function getAuthCookie(): Promise<string> {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfSetCookie = csrfRes.headers.get("set-cookie") ?? "";
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const csrfCookie = csrfSetCookie.split(";")[0];

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookie,
    },
    body: new URLSearchParams({
      email: STAFF_EMAIL,
      password: STAFF_PASSWORD,
      csrfToken,
      json: "true",
    }),
    redirect: "manual",
  });

  const setCookies = loginRes.headers.getSetCookie
    ? loginRes.headers.getSetCookie()
    : [loginRes.headers.get("set-cookie") ?? ""];

  const sessionCookie = setCookies
    .map((cookie) => cookie.split(";")[0])
    .filter((cookie) => cookie.includes("next-auth.session-token"))
    .join("; ");

  if (!sessionCookie) {
    throw new Error(
      "Failed to authenticate as staff user. Make sure the dev server is running and the DB is seeded (npm run seed)."
    );
  }

  return sessionCookie;
}

async function createNearlyFullWorkshop(): Promise<{ workshopId: string; adminId: string }> {
  await connectToDatabase();

  const admin = await User.findOne({ email: "admin@workshop.test" });
  if (!admin) {
    throw new Error("Seeded admin user not found. Run `npm run seed` first.");
  }

  const code = `TEST-CONCURRENCY-${Date.now()}`;
  const capacity = 5;
  const activeCount = capacity - 1; // exactly 1 seat remaining

  const workshop = await Workshop.create({
    code,
    title: "Concurrency Test Workshop",
    instructor: "Test Harness",
    dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    capacity,
    activeCount,
    status: "scheduled",
    createdBy: admin._id,
  });

  return { workshopId: String(workshop._id), adminId: String(admin._id) };
}

async function cleanup(workshopId: string) {
  await Registration.deleteMany({ workshopId });
  await Workshop.deleteOne({ _id: workshopId });
}

async function main() {
  console.log(`Authenticating as ${STAFF_EMAIL}...`);
  const cookie = await getAuthCookie();

  console.log("Creating a workshop with exactly 1 seat remaining...");
  const { workshopId } = await createNearlyFullWorkshop();
  console.log(`Workshop created: ${workshopId} (capacity 5, activeCount 4, 1 seat left)`);

  console.log(`\nFiring ${CONCURRENT_REQUESTS} simultaneous POST /api/registrations requests...\n`);

  const requests = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
    fetch(`${BASE_URL}/api/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        workshopId,
        attendeeName: `Concurrent Attendee ${i + 1}`,
        attendeeEmail: `concurrent.attendee.${i + 1}@example.com`,
      }),
    }).then(async (res) => ({ status: res.status, body: await res.json().catch(() => null) }))
  );

  const results = await Promise.all(requests);

  const succeeded = results.filter((r) => r.status === 201);
  const conflicted = results.filter((r) => r.status === 409);
  const other = results.filter((r) => r.status !== 201 && r.status !== 409);

  console.log("=".repeat(60));
  console.log("CONCURRENCY TEST RESULTS");
  console.log("=".repeat(60));
  results.forEach((r, i) => {
    console.log(`  Request ${i + 1}: HTTP ${r.status}`);
  });
  console.log("-".repeat(60));
  console.log(`  Succeeded (201): ${succeeded.length}  (expected: 1)`);
  console.log(`  Rejected  (409): ${conflicted.length}  (expected: ${CONCURRENT_REQUESTS - 1})`);
  if (other.length > 0) {
    console.log(`  Unexpected statuses: ${other.length} ->`, other);
  }
  console.log("=".repeat(60));

  const pass = succeeded.length === 1 && conflicted.length === CONCURRENT_REQUESTS - 1;
  console.log(pass ? "\nPASS: capacity enforcement held under concurrent load.\n" : "\nFAIL: capacity was not enforced correctly.\n");

  console.log("Cleaning up test workshop and registrations...");
  await cleanup(workshopId);

  if (!pass) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Test script failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
