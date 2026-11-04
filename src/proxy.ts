import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    // Come back here after signing in
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/brands/:path*",
    "/campaigns/:path*",
    "/invoices/:path*",
    "/settings/:path*",
    "/workspaces/:path*",
  ],
};
