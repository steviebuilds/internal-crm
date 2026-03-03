import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  return encoder.encode(secret);
}

function safeEquals(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function verifyPassword(input: string) {
  const hash = process.env.CRM_PASSWORD_HASH;
  const plain = process.env.CRM_PASSWORD;

  if (hash) {
    return bcrypt.compare(input, hash);
  }

  if (!plain) {
    throw new Error("Configure CRM_PASSWORD_HASH or CRM_PASSWORD");
  }

  return safeEquals(input, plain);
}

export async function signAuthToken() {
  return new SignJWT({ role: "internal" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifyAuthToken(token: string) {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function isAuthenticatedFromRequest(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAuthToken(token);
}

export async function isAuthenticatedFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAuthToken(token);
}
