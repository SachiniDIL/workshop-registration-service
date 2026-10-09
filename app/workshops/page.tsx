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
    <div className="flex flex-1 flex-col bg-slate-50 px-6 py-8 dark:bg-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-50">
          Workshops
        </h1>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 text-center text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Loading...
        </div>
      </div>
    </div>
  );
}
