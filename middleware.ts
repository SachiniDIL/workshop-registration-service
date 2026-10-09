import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const WORKSHOP_EDIT_PATTERN = /^\/workshops\/[^/]+\/edit$/;

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/workshops", req.url));
    }

    const isManagerOnlyWorkshopRoute =
      pathname === "/workshops/new" || WORKSHOP_EDIT_PATTERN.test(pathname);

    if (isManagerOnlyWorkshopRoute && role !== "manager") {
      return NextResponse.redirect(new URL("/workshops", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
