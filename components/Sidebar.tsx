"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;

  const navItems: NavItem[] = [{ href: "/workshops", label: "Workshops" }];
  if (role === "manager") {
    navItems.push({ href: "/workshops/new", label: "Add Workshop" });
  }
  if (role === "admin") {
    navItems.push({ href: "/admin/users", label: "Users" });
    navItems.push({ href: "/admin/audit", label: "Audit Log" });
  }

  function isActive(href: string) {
    return href === "/workshops" ? pathname === href : pathname?.startsWith(href);
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-black/[.08] bg-white px-4 py-6 dark:border-white/[.145] dark:bg-zinc-950">
      <div className="flex flex-col gap-6">
        <Link
          href="/workshops"
          className="px-2 text-base font-semibold text-zinc-950 dark:text-zinc-50"
        >
          Workshop Registration
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-3 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
        <div className="px-2">
          <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
            {session?.user?.name}
          </p>
          <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400">{role}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md border border-black/[.08] px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
