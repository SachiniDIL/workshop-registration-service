"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import PageMessage from "@/components/ui/PageMessage";
import StatusBadge from "@/components/ui/StatusBadge";
import type { AuditAction, AuditEntityType } from "@/models/AuditLog";

interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuditLogRecord {
  id: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  performedBy: PopulatedUser | null;
  performedAt: string;
  details?: Record<string, unknown>;
}

function formatDetails(details: Record<string, unknown> | undefined): string {
  if (!details) return "—";

  const before = details.before as Record<string, unknown> | undefined;
  const after = details.after as Record<string, unknown> | undefined;
  if (!before || !after) return JSON.stringify(details);

  const changedFields = Object.keys(after);
  return changedFields
    .map((field) => `${field}: ${JSON.stringify(before[field])} → ${JSON.stringify(after[field])}`)
    .join(", ");
}

export default function AdminAuditPage() {
  const { data: session, status } = useSession();

  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  const isAuthorized = status === "authenticated" && session?.user?.role === "admin";

  // Self-contained effect (not calling an outside memoized fetcher): see the same
  // pattern elsewhere in the app for why this avoids a setState-in-effect false positive.
  useEffect(() => {
    if (!isAuthorized) return;

    let cancelled = false;

    async function load() {
      setIsLoadingLogs(true);
      const res = await fetch("/api/audit-logs", { cache: "no-store" });
      const body = await res.json().catch(() => null);

      if (cancelled) return;

      if (!res.ok) {
        setLogsError(body?.error ?? "Failed to load audit log");
        setLogs([]);
      } else {
        setLogsError(null);
        setLogs(body as AuditLogRecord[]);
      }
      setIsLoadingLogs(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [isAuthorized]);

  if (status === "loading") {
    return <PageMessage>Loading...</PageMessage>;
  }

  if (!isAuthorized) {
    return (
      <PageMessage tone="error">
        You are not authorized to view this page. Only admins can view the audit log.
      </PageMessage>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Audit Log</h1>

        <div className="overflow-x-auto rounded-xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-black/[.08] text-xs uppercase text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Performed by</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingLogs ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    Loading...
                  </td>
                </tr>
              ) : logsError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-red-600 dark:text-red-400">
                    {logsError}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    No audit log entries yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-black/[.06] last:border-0 dark:border-white/[.08]"
                  >
                    <td className="px-4 py-3">
                      <StatusBadge status={log.action} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      {log.entityType} / {log.entityId}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {log.performedBy?.name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {new Date(log.performedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {formatDetails(log.details)}
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
