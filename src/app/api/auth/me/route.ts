import { isAuthenticatedFromCookies } from "@/lib/auth";
import { unauthorized, ok } from "@/lib/http";

export async function GET() {
  const auth = await isAuthenticatedFromCookies();
  if (!auth) return unauthorized();
  return ok({ authenticated: true });
}
