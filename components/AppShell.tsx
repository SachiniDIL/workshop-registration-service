"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();

  // Never show the sidebar on /login, even if a stale session is still
  // authenticated (e.g. the user navigated back to it manually).
  if (status !== "authenticated" || pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
