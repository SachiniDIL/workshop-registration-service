interface StatusBadgeProps {
  status: string;
  tone?: "neutral" | "positive";
  size?: "sm" | "md";
}

/** Capitalized pill badge used for workshop and registration statuses. */
export default function StatusBadge({ status, tone = "neutral", size = "sm" }: StatusBadgeProps) {
  const toneClass =
    tone === "positive"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  const sizeClass = size === "md" ? "px-3 py-1" : "px-2 py-0.5";

  return (
    <span className={`rounded-full text-xs font-medium capitalize ${sizeClass} ${toneClass}`}>
      {status}
    </span>
  );
}
