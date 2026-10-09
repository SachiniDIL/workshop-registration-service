import type { ReactNode } from "react";

interface PageMessageProps {
  tone?: "muted" | "error";
  children: ReactNode;
}

/** Centered full-height message used for a page's loading / error / not-authorized states. */
export default function PageMessage({ tone = "muted", children }: PageMessageProps) {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
      {tone === "error" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {children}
        </p>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-300">{children}</p>
      )}
    </div>
  );
}
