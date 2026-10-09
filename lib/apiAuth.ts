import { NextResponse } from "next/server";

export function unauthorizedResponse(status: 401 | 403) {
  const error = status === 401 ? "Unauthorized" : "Forbidden";
  return NextResponse.json({ error }, { status });
}
