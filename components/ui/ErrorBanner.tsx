interface ErrorBannerProps {
  errors: string[];
}

/** Boxed list of general (non-field-mapped) error messages, e.g. a 409 conflict. */
export default function ErrorBanner({ errors }: ErrorBannerProps) {
  if (errors.length === 0) return null;

  return (
    <ul className="list-disc rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      {errors.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}
