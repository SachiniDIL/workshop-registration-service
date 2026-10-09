import type { ReactNode } from "react";

interface InlineErrorProps {
  children: ReactNode;
  className?: string;
}

/** Single-line error message under a form, announced to assistive tech via role="alert". */
export default function InlineError({ children, className }: InlineErrorProps) {
  return (
    <p className={`text-sm text-red-600 dark:text-red-400 ${className ?? ""}`} role="alert">
      {children}
    </p>
  );
}
