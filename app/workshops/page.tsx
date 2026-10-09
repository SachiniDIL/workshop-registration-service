"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { WORKSHOP_STATUSES, type WorkshopStatus } from "@/lib/validation";

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

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export default function WorkshopsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const status = searchParams.get("status") ?? "";
  const hasSeats = searchParams.get("hasSeats") === "true";

  // Tracks the latest query string synchronously so back-to-back filter changes
  // (e.g. two onChange events in the same tick) each build on the other's result
  // instead of racing against a stale `searchParams` snapshot from the last render.
  const paramsRef = useRef(searchParams.toString());
  useEffect(() => {
    paramsRef.current = searchParams.toString();
  }, [searchParams]);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(paramsRef.current);
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      paramsRef.current = params.toString();
      router.push(`${pathname}?${paramsRef.current}`, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchWorkshops() {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/workshops?${searchParams.toString()}`);
      const body = await res.json().catch(() => null);

      if (cancelled) return;

      if (!res.ok) {
        const message =
          body && Array.isArray(body.errors)
            ? body.errors.join(", ")
            : body?.error ?? "Failed to load workshops";
        setError(message);
        setWorkshops([]);
        setIsLoading(false);
        return;
      }

      setWorkshops(body as Workshop[]);
      setIsLoading(false);
    }

    fetchWorkshops();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const inputClass =
    "rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-white/[.145] dark:text-zinc-50";

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Workshops
          </h1>
          {session?.user?.role === "manager" && (
            <Link
              href="/workshops/new"
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Add Workshop
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="from" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              From
            </label>
            <input
              id="from"
              type="date"
              value={toDateInputValue(from)}
              onChange={(e) => updateParam("from", e.target.value || null)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="to" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              To
            </label>
            <input
              id="to"
              type="date"
              value={toDateInputValue(to)}
              onChange={(e) => updateParam("to", e.target.value || null)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => updateParam("status", e.target.value || null)}
              className={inputClass}
            >
              <option value="">All</option>
              {WORKSHOP_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <label htmlFor="hasSeats" className="flex items-center gap-2 pb-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              id="hasSeats"
              type="checkbox"
              checked={hasSeats}
              onChange={(e) => updateParam("hasSeats", e.target.checked ? "true" : null)}
              className="h-4 w-4 rounded border-black/[.2] dark:border-white/[.3]"
            />
            Has seats available
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="overflow-x-auto rounded-xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-black/[.08] text-xs uppercase text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Instructor</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Seats</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    Loading...
                  </td>
                </tr>
              ) : workshops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    No workshops found.
                  </td>
                </tr>
              ) : (
                workshops.map((workshop) => (
                  <tr
                    key={workshop.id}
                    className="border-b border-black/[.06] last:border-0 hover:bg-zinc-50 dark:border-white/[.08] dark:hover:bg-zinc-900"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      <Link href={`/workshops/${workshop.id}`} className="hover:underline">
                        {workshop.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-950 dark:text-zinc-50">
                      <Link href={`/workshops/${workshop.id}`} className="hover:underline">
                        {workshop.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{workshop.instructor}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {new Date(workshop.dateTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {workshop.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {workshop.seatsAvailable}/{workshop.capacity}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
