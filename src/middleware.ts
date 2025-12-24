import { NextRequest, NextResponse } from "next/server";

const protectedPaths = [
  "/home",
  "/schedule",
  "/upload",
  "/manual",
  "/settings",
  "/account",
  "/company_edit",
  "/selectcompany",
  "/newcompany",
  "/rating",
];

function isProtected(pathname: string) {
  for (const p of protectedPaths) {
    if (pathname === p || pathname.startsWith(p + "/")) return true;
  }
  return false;
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const r = NextResponse.redirect(url);
    r.headers.set("x-mw-hit", "1");
    r.headers.set("x-mw-path", pathname);
    return r;
  }

  // next internals / static / auth api / debug api are not protected
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/debug")
  ) {
    const res = NextResponse.next();
    res.headers.set("x-mw-hit", "1");
    res.headers.set("x-mw-path", pathname);
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("x-mw-hit", "1");
  res.headers.set("x-mw-path", pathname);

  if (!isProtected(pathname)) return res;

  const hasCookie =
    !!req.cookies.get("clasz_session")?.value ||
    !!req.cookies.get("__Host-clasz_session")?.value;

  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const r = NextResponse.redirect(url);
    r.headers.set("x-mw-hit", "1");
    r.headers.set("x-mw-path", pathname);
    return r;
  }

  return res;
}

export const config = {
  matcher: ["/:path*"],
};
