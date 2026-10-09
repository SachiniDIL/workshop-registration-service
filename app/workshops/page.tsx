import { Suspense } from "react";
import WorkshopsPageContent from "./WorkshopsPageContent";

export default function WorkshopsPage() {
  return (
    <Suspense fallback={<WorkshopsPageFallback />}>
      <WorkshopsPageContent />
    </Suspense>
  );
}

function WorkshopsPageFallback() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Workshops
        </h1>
        <div className="overflow-x-auto rounded-xl border border-black/[.08] bg-white p-4 text-center text-zinc-500 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400">
          Loading...
        </div>
      </div>
    </div>
  );
}
