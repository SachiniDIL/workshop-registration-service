"use client";

import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import InlineError from "@/components/ui/InlineError";
import { fieldInputClass, fieldLabelClass, primaryButtonClass } from "@/components/ui/styles";

function landingPageForRole(role: string | undefined): string {
  switch (role) {
    case "admin":
      return "/admin/users";
    case "manager":
    case "staff":
    default:
      return "/workshops";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setError("Invalid email or password");
      return;
    }

    const session = await getSession();
    router.push(landingPageForRole(session?.user?.role));
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-600 dark:bg-slate-800">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-50">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          Workshop Registration Service
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={fieldLabelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldInputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={fieldLabelClass}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldInputClass}
            />
          </div>

          {error && <InlineError>{error}</InlineError>}

          <button type="submit" disabled={isSubmitting} className={`mt-2 ${primaryButtonClass}`}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
