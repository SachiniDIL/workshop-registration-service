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
    <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-600 dark:bg-slate-800">
      <div className="flex flex-col gap-6">
        <Link
          href="/workshops"
          className="px-2 text-base font-semibold text-slate-800 dark:text-slate-50"
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
                  ? "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-600">
        <div className="px-2">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-50">
            {session?.user?.name}
          </p>
          <p className="text-xs capitalize text-slate-500 dark:text-slate-300">{role}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
