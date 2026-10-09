"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import WorkshopForm, {
  DEFAULT_WORKSHOP_FORM_VALUES,
  type WorkshopFormValues,
  type WorkshopSubmitResult,
} from "@/components/WorkshopForm";

export default function NewWorkshopPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  async function handleSubmit(values: WorkshopFormValues): Promise<WorkshopSubmitResult> {
    const res = await fetch("/api/workshops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: values.code,
        title: values.title,
        instructor: values.instructor,
        dateTime: values.dateTime,
        capacity: values.capacity,
        status: values.status,
        location: values.location || undefined,
        description: values.description || undefined,
      }),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      const errors =
        body && Array.isArray(body.errors)
          ? body.errors
          : [body?.error ?? "Failed to create workshop"];
      return { ok: false, errors };
    }

    router.push(`/workshops/${body.id}`);
    return { ok: true };
  }

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (session?.user?.role !== "manager") {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          You are not authorized to view this page. Only managers can create workshops.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Add Workshop
        </h1>
        <WorkshopForm
          mode="create"
          initialValues={DEFAULT_WORKSHOP_FORM_VALUES}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
