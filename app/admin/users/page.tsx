"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { USER_ROLES, type UserRole } from "@/lib/validation";
import ErrorBanner from "@/components/ui/ErrorBanner";
import PageMessage from "@/components/ui/PageMessage";
import { fieldErrorClass, fieldInputClass as inputClass, fieldLabelClass as labelClass, primaryButtonClass } from "@/components/ui/styles";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

const CREATE_USER_FIELDS = ["name", "email", "password", "role"] as const;
type CreateUserField = (typeof CREATE_USER_FIELDS)[number];

function mapErrorsToFields(errors: string[]): {
  fieldErrors: Partial<Record<CreateUserField, string[]>>;
  generalErrors: string[];
} {
  const fieldErrors: Partial<Record<CreateUserField, string[]>> = {};
  const generalErrors: string[] = [];

  for (const message of errors) {
    const field = CREATE_USER_FIELDS.find((name) => message.startsWith(`${name} `));
    if (field) {
      fieldErrors[field] = [...(fieldErrors[field] ?? []), message];
    } else {
      generalErrors.push(message);
    }
  }

  return { fieldErrors, generalErrors };
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("staff");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CreateUserField, string[]>>>({});
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const isAuthorized = status === "authenticated" && session?.user?.role === "admin";

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    const res = await fetch("/api/users", { cache: "no-store" });
    const body = await res.json().catch(() => null);

    if (!res.ok) {
      setUsersError(body?.error ?? "Failed to load users");
      setUsers([]);
      setIsLoadingUsers(false);
      return;
    }

    setUsersError(null);
    setUsers(body as UserRecord[]);
    setIsLoadingUsers(false);
  }, []);

  // Mirrors the self-contained-effect pattern used elsewhere in the app: the initial
  // load stays inline rather than calling the memoized fetchUsers above, since invoking
  // an externally-defined function that sets state synchronously from inside an effect
  // reads identically to setState-in-effect to React's analysis.
  useEffect(() => {
    if (!isAuthorized) return;

    let cancelled = false;

    async function load() {
      setIsLoadingUsers(true);
      const res = await fetch("/api/users", { cache: "no-store" });
      const body = await res.json().catch(() => null);

      if (cancelled) return;

      if (!res.ok) {
        setUsersError(body?.error ?? "Failed to load users");
        setUsers([]);
      } else {
        setUsersError(null);
        setUsers(body as UserRecord[]);
      }
      setIsLoadingUsers(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [isAuthorized]);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setGeneralErrors([]);
    setIsSubmitting(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const body = await res.json().catch(() => null);

    setIsSubmitting(false);

    if (!res.ok) {
      const errors =
        body && Array.isArray(body.errors)
          ? body.errors
          : [body?.error ?? "Failed to create user"];
      const { fieldErrors: mapped, generalErrors: general } = mapErrorsToFields(errors);
      setFieldErrors(mapped);
      setGeneralErrors(general);
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRole("staff");
    await fetchUsers();
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    setUpdatingUserId(userId);

    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    const body = await res.json().catch(() => null);

    setUpdatingUserId(null);

    if (!res.ok) {
      const message =
        body && Array.isArray(body.errors)
          ? body.errors.join(", ")
          : body?.error ?? "Failed to update role";
      setRowErrors((prev) => ({ ...prev, [userId]: message }));
      return;
    }

    await fetchUsers();
  }

  if (status === "loading") {
    return <PageMessage>Loading...</PageMessage>;
  }

  if (!isAuthorized) {
    return (
      <PageMessage tone="error">
        You are not authorized to view this page. Only admins can manage users.
      </PageMessage>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50 px-6 py-8 dark:bg-slate-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-50">
          Users
        </h1>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-600 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-50">Create user</h2>

          <form onSubmit={handleCreateUser} className="mt-4 flex flex-col gap-4">
            <ErrorBanner errors={generalErrors} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className={labelClass}>
                  Name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                />
                {fieldErrors.name?.map((message) => (
                  <p key={message} className={fieldErrorClass}>
                    {message}
                  </p>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
                {fieldErrors.email?.map((message) => (
                  <p key={message} className={fieldErrorClass}>
                    {message}
                  </p>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  required
                />
                {fieldErrors.password?.map((message) => (
                  <p key={message} className={fieldErrorClass}>
                    {message}
                  </p>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="role" className={labelClass}>
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className={inputClass}
                >
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {fieldErrors.role?.map((message) => (
                  <p key={message} className={fieldErrorClass}>
                    {message}
                  </p>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className={`mt-2 w-fit ${primaryButtonClass}`}>
              {isSubmitting ? "Creating..." : "Create user"}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-600">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-50">All users</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-6 text-center text-slate-500 dark:text-slate-300">
                      Loading...
                    </td>
                  </tr>
                ) : usersError ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-6 text-center text-red-600 dark:text-red-400">
                      {usersError}
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-6 text-center text-slate-500 dark:text-slate-300">
                      No users yet.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-700"
                    >
                      <td className="px-6 py-3 text-slate-800 dark:text-slate-50">{user.name}</td>
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{user.email}</td>
                      <td className="px-6 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          disabled={updatingUserId === user.id}
                          className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {USER_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        {rowErrors[user.id] && (
                          <p className={`mt-1 ${fieldErrorClass}`}>{rowErrors[user.id]}</p>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
