"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { WorkshopStatus } from "@/lib/validation";
import InlineError from "@/components/ui/InlineError";
import PageMessage from "@/components/ui/PageMessage";
import StatusBadge from "@/components/ui/StatusBadge";
import { fieldInputClass, fieldLabelClass, primaryButtonClass } from "@/components/ui/styles";

interface Workshop {
  id: string;
  code: string;
  title: string;
  instructor: string;
  dateTime: string;
  capacity: number;
  activeCount: number;
  seatsAvailable: number;
  status: WorkshopStatus;
  location?: string;
  description?: string;
}

interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface RegistrationRecord {
  id: string;
  workshopId: string;
  attendeeName: string;
  attendeeEmail: string;
  status: "active" | "cancelled";
  registeredBy: PopulatedUser | null;
  registeredAt: string;
  cancelledBy?: PopulatedUser | null;
  cancelledAt?: string;
}

const inputClass = fieldInputClass;
const labelClass = fieldLabelClass;

export default function WorkshopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canRegister = role === "manager" || role === "staff";

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [workshopError, setWorkshopError] = useState<string | null>(null);
  const [isLoadingWorkshop, setIsLoadingWorkshop] = useState(true);

  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [registrationsError, setRegistrationsError] = useState<string | null>(null);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(true);

  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchWorkshop = useCallback(async () => {
    setIsLoadingWorkshop(true);
    const res = await fetch(`/api/workshops/${id}`, { cache: "no-store" });
    const body = await res.json().catch(() => null);

    if (!res.ok) {
      setWorkshopError(body?.error ?? "Failed to load workshop");
      setWorkshop(null);
      setIsLoadingWorkshop(false);
      return;
    }

    setWorkshopError(null);
    setWorkshop(body as Workshop);
    setIsLoadingWorkshop(false);
  }, [id]);

  const fetchRegistrations = useCallback(async () => {
    setIsLoadingRegistrations(true);
    const res = await fetch(`/api/registrations?workshopId=${id}`, { cache: "no-store" });
    const body = await res.json().catch(() => null);

    if (!res.ok) {
      setRegistrationsError(body?.error ?? "Failed to load registration history");
      setRegistrations([]);
      setIsLoadingRegistrations(false);
      return;
    }

    setRegistrationsError(null);
    setRegistrations(body as RegistrationRecord[]);
    setIsLoadingRegistrations(false);
  }, [id]);

  // Deliberately not calling fetchWorkshop()/fetchRegistrations() here: invoking an
  // externally-defined function that sets state synchronously from inside an effect
  // reads identically to setState-in-effect to React's analysis, so the initial load
  // is self-contained instead and the memoized fetchers above are reserved for the
  // post-action refetches in the event handlers below.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoadingWorkshop(true);
      setIsLoadingRegistrations(true);

      const [workshopRes, registrationsRes] = await Promise.all([
        fetch(`/api/workshops/${id}`, { cache: "no-store" }),
        fetch(`/api/registrations?workshopId=${id}`, { cache: "no-store" }),
      ]);
      const [workshopBody, registrationsBody] = await Promise.all([
        workshopRes.json().catch(() => null),
        registrationsRes.json().catch(() => null),
      ]);

      if (cancelled) return;

      if (!workshopRes.ok) {
        setWorkshopError(workshopBody?.error ?? "Failed to load workshop");
        setWorkshop(null);
      } else {
        setWorkshopError(null);
        setWorkshop(workshopBody as Workshop);
      }
      setIsLoadingWorkshop(false);

      if (!registrationsRes.ok) {
        setRegistrationsError(registrationsBody?.error ?? "Failed to load registration history");
        setRegistrations([]);
      } else {
        setRegistrationsError(null);
        setRegistrations(registrationsBody as RegistrationRecord[]);
      }
      setIsLoadingRegistrations(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workshopId: id, attendeeName, attendeeEmail }),
    });
    const body = await res.json().catch(() => null);

    setIsSubmitting(false);

    if (res.status === 409) {
      setFormError("This workshop just filled up — no seats remaining.");
      await fetchWorkshop();
      return;
    }

    if (!res.ok) {
      const message =
        body && Array.isArray(body.errors)
          ? body.errors.join(", ")
          : body?.error ?? "Failed to register attendee";
      setFormError(message);
      return;
    }

    setAttendeeName("");
    setAttendeeEmail("");
    await Promise.all([fetchWorkshop(), fetchRegistrations()]);
  }

  async function handleCancel(registrationId: string) {
    setCancelError(null);
    setCancellingId(registrationId);

    const res = await fetch(`/api/registrations/${registrationId}/cancel`, {
      method: "PATCH",
    });
    const body = await res.json().catch(() => null);

    setCancellingId(null);

    if (!res.ok) {
      setCancelError(body?.error ?? "Failed to cancel registration");
      return;
    }

    // Cancelling can free up a seat, so clear any stale "workshop is full" message
    // left over from an earlier registration attempt.
    setFormError(null);
    await Promise.all([fetchRegistrations(), fetchWorkshop()]);
  }

  if (isLoadingWorkshop) {
    return <PageMessage>Loading...</PageMessage>;
  }

  if (workshopError || !workshop) {
    return <PageMessage tone="error">{workshopError ?? "Workshop not found"}</PageMessage>;
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div>
          <Link
            href="/workshops"
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
          >
            &larr; Back to workshops
          </Link>
        </div>

        <div className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{workshop.code}</p>
              <h1 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                {workshop.title}
              </h1>
            </div>
            <StatusBadge status={workshop.status} size="md" />
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between sm:block">
              <dt className="text-zinc-500 dark:text-zinc-400">Instructor</dt>
              <dd className="text-zinc-950 dark:text-zinc-50">{workshop.instructor}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-zinc-500 dark:text-zinc-400">Date &amp; time</dt>
              <dd className="text-zinc-950 dark:text-zinc-50">
                {new Date(workshop.dateTime).toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-zinc-500 dark:text-zinc-400">Capacity</dt>
              <dd className="text-zinc-950 dark:text-zinc-50">{workshop.capacity}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-zinc-500 dark:text-zinc-400">Seats available</dt>
              <dd className="text-zinc-950 dark:text-zinc-50">{workshop.seatsAvailable}</dd>
            </div>
            {workshop.location && (
              <div className="flex justify-between sm:block">
                <dt className="text-zinc-500 dark:text-zinc-400">Location</dt>
                <dd className="text-zinc-950 dark:text-zinc-50">{workshop.location}</dd>
              </div>
            )}
          </dl>

          {workshop.description && (
            <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">{workshop.description}</p>
          )}
        </div>

        {canRegister && (
          <div className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Register an attendee
            </h2>
            <form onSubmit={handleRegister} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor="attendeeName" className={labelClass}>
                  Attendee name
                </label>
                <input
                  id="attendeeName"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor="attendeeEmail" className={labelClass}>
                  Attendee email
                </label>
                <input
                  id="attendeeEmail"
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
                {isSubmitting ? "Registering..." : "Register"}
              </button>
            </form>
            {formError && <InlineError className="mt-3">{formError}</InlineError>}
          </div>
        )}

        <div className="rounded-xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
          <div className="border-b border-black/[.08] px-6 py-4 dark:border-white/[.145]">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Registration history
            </h2>
          </div>

          {cancelError && <InlineError className="px-6 pt-4">{cancelError}</InlineError>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-black/[.08] text-xs uppercase text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Attendee</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Registered</th>
                  <th className="px-6 py-3 font-medium">Cancelled</th>
                  {canRegister && <th className="px-6 py-3 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {isLoadingRegistrations ? (
                  <tr>
                    <td
                      colSpan={canRegister ? 5 : 4}
                      className="px-6 py-6 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : registrationsError ? (
                  <tr>
                    <td
                      colSpan={canRegister ? 5 : 4}
                      className="px-6 py-6 text-center text-red-600 dark:text-red-400"
                    >
                      {registrationsError}
                    </td>
                  </tr>
                ) : registrations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canRegister ? 5 : 4}
                      className="px-6 py-6 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      No registrations yet.
                    </td>
                  </tr>
                ) : (
                  registrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className="border-b border-black/[.06] last:border-0 dark:border-white/[.08]"
                    >
                      <td className="px-6 py-3">
                        <div className="text-zinc-950 dark:text-zinc-50">{registration.attendeeName}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {registration.attendeeEmail}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge
                          status={registration.status}
                          tone={registration.status === "active" ? "positive" : "neutral"}
                        />
                      </td>
                      <td className="px-6 py-3 text-zinc-700 dark:text-zinc-300">
                        <div>{registration.registeredBy?.name ?? "Unknown"}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(registration.registeredAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-zinc-700 dark:text-zinc-300">
                        {registration.status === "cancelled" ? (
                          <>
                            <div>{registration.cancelledBy?.name ?? "Unknown"}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {registration.cancelledAt
                                ? new Date(registration.cancelledAt).toLocaleString()
                                : ""}
                            </div>
                          </>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600">—</span>
                        )}
                      </td>
                      {canRegister && (
                        <td className="px-6 py-3 text-right">
                          {registration.status === "active" && (
                            <button
                              type="button"
                              onClick={() => handleCancel(registration.id)}
                              disabled={cancellingId === registration.id}
                              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                            >
                              {cancellingId === registration.id ? "Cancelling..." : "Cancel"}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
