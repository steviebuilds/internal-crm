import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { signAuthToken, verifyPassword } from "@/lib/auth";

const schema = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const ok = await verifyPassword(body.password);

    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signAuthToken();

    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
