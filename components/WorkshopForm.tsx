"use client";

import { useState, type FormEvent } from "react";
import { WORKSHOP_STATUSES, type WorkshopStatus } from "@/lib/validation";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { fieldErrorClass, fieldInputClass, fieldLabelClass, primaryButtonClass } from "@/components/ui/styles";

export interface WorkshopFormValues {
  code: string;
  title: string;
  instructor: string;
  dateTime: string; // datetime-local input value, e.g. "2026-10-10T14:30"
  capacity: string; // kept as a string for a controlled input; coerced by the API
  status: WorkshopStatus;
  location: string;
  description: string;
}

export const DEFAULT_WORKSHOP_FORM_VALUES: WorkshopFormValues = {
  code: "",
  title: "",
  instructor: "",
  dateTime: "",
  capacity: "",
  status: "scheduled",
  location: "",
  description: "",
};

export type WorkshopSubmitResult = { ok: true } | { ok: false; errors: string[] };

const FIELD_NAMES = [
  "code",
  "title",
  "instructor",
  "dateTime",
  "capacity",
  "status",
  "location",
  "description",
] as const;

type FieldName = (typeof FIELD_NAMES)[number];

function mapErrorsToFields(errors: string[]): {
  fieldErrors: Partial<Record<FieldName, string[]>>;
  generalErrors: string[];
} {
  const fieldErrors: Partial<Record<FieldName, string[]>> = {};
  const generalErrors: string[] = [];

  for (const message of errors) {
    const field = FIELD_NAMES.find((name) => message.startsWith(`${name} `));
    if (field) {
      fieldErrors[field] = [...(fieldErrors[field] ?? []), message];
    } else {
      generalErrors.push(message);
    }
  }

  return { fieldErrors, generalErrors };
}

export function toDateTimeLocalValue(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface WorkshopFormProps {
  mode: "create" | "edit";
  initialValues: WorkshopFormValues;
  onSubmit: (values: WorkshopFormValues) => Promise<WorkshopSubmitResult>;
}

const inputClass = fieldInputClass;
const labelClass = fieldLabelClass;

export default function WorkshopForm({ mode, initialValues, onSubmit }: WorkshopFormProps) {
  const [values, setValues] = useState<WorkshopFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string[]>>>({});
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof WorkshopFormValues>(key: K, value: WorkshopFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setGeneralErrors([]);
    setIsSubmitting(true);

    const result = await onSubmit(values);

    setIsSubmitting(false);

    if (!result.ok) {
      const { fieldErrors: mappedFieldErrors, generalErrors: mappedGeneralErrors } = mapErrorsToFields(
        result.errors
      );
      setFieldErrors(mappedFieldErrors);
      setGeneralErrors(mappedGeneralErrors);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ErrorBanner errors={generalErrors} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="code" className={labelClass}>
            Code
          </label>
          <input
            id="code"
            value={values.code}
            onChange={(e) => updateField("code", e.target.value)}
            className={inputClass}
            required
          />
          {fieldErrors.code?.map((message) => (
            <p key={message} className={fieldErrorClass}>
              {message}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className={labelClass}>
            Title
          </label>
          <input
            id="title"
            value={values.title}
            onChange={(e) => updateField("title", e.target.value)}
            className={inputClass}
            required
          />
          {fieldErrors.title?.map((message) => (
            <p key={message} className={fieldErrorClass}>
              {message}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="instructor" className={labelClass}>
            Instructor
          </label>
          <input
            id="instructor"
            value={values.instructor}
            onChange={(e) => updateField("instructor", e.target.value)}
            className={inputClass}
            required
          />
          {fieldErrors.instructor?.map((message) => (
            <p key={message} className={fieldErrorClass}>
              {message}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="dateTime" className={labelClass}>
            Date &amp; time
          </label>
          <input
            id="dateTime"
            type="datetime-local"
            value={values.dateTime}
            onChange={(e) => updateField("dateTime", e.target.value)}
            className={inputClass}
            required
          />
          {fieldErrors.dateTime?.map((message) => (
            <p key={message} className={fieldErrorClass}>
              {message}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="capacity" className={labelClass}>
            Capacity
          </label>
          <input
            id="capacity"
            type="number"
            min={1}
            value={values.capacity}
            onChange={(e) => updateField("capacity", e.target.value)}
            className={inputClass}
            required
          />
          {fieldErrors.capacity?.map((message) => (
            <p key={message} className={fieldErrorClass}>
              {message}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            value={values.status}
            onChange={(e) => updateField("status", e.target.value as WorkshopStatus)}
            className={inputClass}
          >
            {WORKSHOP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {fieldErrors.status?.map((message) => (
            <p key={message} className={fieldErrorClass}>
              {message}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="location" className={labelClass}>
            Location
          </label>
          <input
            id="location"
            value={values.location}
            onChange={(e) => updateField("location", e.target.value)}
            className={inputClass}
          />
          {fieldErrors.location?.map((message) => (
            <p key={message} className={fieldErrorClass}>
              {message}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            value={values.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={4}
            className={inputClass}
          />
          {fieldErrors.description?.map((message) => (
            <p key={message} className={fieldErrorClass}>
              {message}
            </p>
          ))}
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className={`mt-2 w-fit ${primaryButtonClass}`}>
        {isSubmitting
          ? mode === "create"
            ? "Creating..."
            : "Saving..."
          : mode === "create"
            ? "Create Workshop"
            : "Save Changes"}
      </button>
    </form>
  );
}
