"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import WorkshopForm, {
  toDateTimeLocalValue,
  type WorkshopFormValues,
  type WorkshopSubmitResult,
} from "@/components/WorkshopForm";
import PageMessage from "@/components/ui/PageMessage";

export default function EditWorkshopPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [initialValues, setInitialValues] = useState<WorkshopFormValues | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isAuthorized = status === "authenticated" && session?.user?.role === "manager";

  useEffect(() => {
    if (!isAuthorized) return;

    let cancelled = false;

    async function loadWorkshop() {
      const res = await fetch(`/api/workshops/${id}`, { cache: "no-store" });
      const body = await res.json().catch(() => null);

      if (cancelled) return;

      if (!res.ok) {
        setLoadError(body?.error ?? "Failed to load workshop");
        return;
      }

      setInitialValues({
        code: body.code,
        title: body.title,
        instructor: body.instructor,
        dateTime: toDateTimeLocalValue(body.dateTime),
        capacity: String(body.capacity),
        status: body.status,
        location: body.location ?? "",
        description: body.description ?? "",
      });
    }

    loadWorkshop();

    return () => {
      cancelled = true;
    };
  }, [id, isAuthorized]);

  async function handleSubmit(values: WorkshopFormValues): Promise<WorkshopSubmitResult> {
    const res = await fetch(`/api/workshops/${id}`, {
      method: "PATCH",
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
          : [body?.error ?? "Failed to update workshop"];
      return { ok: false, errors };
    }

    router.push(`/workshops/${id}`);
    return { ok: true };
  }

  if (status === "loading") {
    return <PageMessage>Loading...</PageMessage>;
  }

  if (!isAuthorized) {
    return (
      <PageMessage tone="error">
        You are not authorized to view this page. Only managers can edit workshops.
      </PageMessage>
    );
  }

  if (loadError) {
    return <PageMessage tone="error">{loadError}</PageMessage>;
  }

  if (!initialValues) {
    return <PageMessage>Loading workshop...</PageMessage>;
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Edit Workshop
        </h1>
        <WorkshopForm mode="edit" initialValues={initialValues} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
