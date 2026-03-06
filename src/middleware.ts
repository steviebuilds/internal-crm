import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

const publicPaths = ["/login", "/api/auth/login"];
const encoder = new TextEncoder();

async function verify(token: string) {
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) return false;
    await jwtVerify(token, encoder.encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/v1")
  ) {
    return NextResponse.next();
  }

  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthed = token ? await verify(token) : false;

  if (!isAuthed) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$).*)"],
};
