import { SESSION_COOKIE, verifySession } from "./session";

/**
 * Auth untuk route API (dipakai extension browser).
 * Terima token sesi via `Authorization: Bearer <jwt>` ATAU cookie `zeus88_session`.
 * Extension membaca cookie sesi lewat chrome.cookies lalu mengirimnya sebagai Bearer.
 */
export async function userIdFromRequest(req: Request): Promise<string | null> {
  const authz = req.headers.get("authorization");
  const bearer =
    authz && authz.toLowerCase().startsWith("bearer ")
      ? authz.slice(7).trim()
      : null;

  const cookieHeader = req.headers.get("cookie") ?? "";
  const m = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`),
  );
  const fromCookie = m ? decodeURIComponent(m[1]) : null;

  const token = bearer ?? fromCookie;
  if (!token) return null;
  return verifySession(token);
}
