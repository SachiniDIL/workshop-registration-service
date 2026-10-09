"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { WORKSHOP_STATUSES, type WorkshopStatus } from "@/lib/validation";
import InlineError from "@/components/ui/InlineError";
import StatusBadge from "@/components/ui/StatusBadge";
import { fieldInputClass, primaryButtonClass } from "@/components/ui/styles";

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

export default function WorkshopsPageContent() {
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

      const res = await fetch(`/api/workshops?${searchParams.toString()}`, { cache: "no-store" });
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

  const inputClass = fieldInputClass;

  return (
    <div className="flex flex-1 flex-col bg-slate-50 px-6 py-8 dark:bg-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-50">
            Workshops
          </h1>
          {session?.user?.role === "manager" && (
            <Link href="/workshops/new" className={primaryButtonClass}>
              Add Workshop
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-800">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="from" className="text-xs font-medium text-slate-600 dark:text-slate-300">
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
            <label htmlFor="to" className="text-xs font-medium text-slate-600 dark:text-slate-300">
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
            <label htmlFor="status" className="text-xs font-medium text-slate-600 dark:text-slate-300">
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

          <label htmlFor="hasSeats" className="flex items-center gap-2 pb-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              id="hasSeats"
              type="checkbox"
              checked={hasSeats}
              onChange={(e) => updateParam("hasSeats", e.target.checked ? "true" : null)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-500"
            />
            Has seats available
          </label>
        </div>

        {error && <InlineError>{error}</InlineError>}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-600 dark:text-slate-300">
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
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500 dark:text-slate-300">
                    Loading...
                  </td>
                </tr>
              ) : workshops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500 dark:text-slate-300">
                    No workshops found.
                  </td>
                </tr>
              ) : (
                workshops.map((workshop) => (
                  <tr
                    key={workshop.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                      <Link href={`/workshops/${workshop.id}`} className="hover:underline">
                        {workshop.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-50">
                      <Link href={`/workshops/${workshop.id}`} className="hover:underline">
                        {workshop.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{workshop.instructor}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {new Date(workshop.dateTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={workshop.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
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
