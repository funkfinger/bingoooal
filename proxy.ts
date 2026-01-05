import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuth = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isProtectedRoute =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/board");

  // Check if this is a shared board access (has ?share= parameter)
  const hasShareToken = req.nextUrl.searchParams.has("share");
  const isBoardRoute = req.nextUrl.pathname.startsWith("/board");

  // Handle invite token in URL - store it in a cookie for the OAuth flow
  const inviteToken = req.nextUrl.searchParams.get("invite");
  if (inviteToken && isAuthPage) {
    const response = NextResponse.next();
    // Set cookie with invite token that expires in 1 hour
    response.cookies.set("invite_token", inviteToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
      path: "/",
    });
    return response;
  }

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Allow unauthenticated access to boards with share token
  if (!isAuth && isProtectedRoute) {
    if (isBoardRoute && hasShareToken) {
      // Let the board page handle share token validation
      return NextResponse.next();
    }

    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/board/:path*", "/login"],
};
