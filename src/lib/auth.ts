import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "machikanefes-admin";
const getSecret = () => process.env.SESSION_SECRET ?? "development-only-secret";

export function createAdminToken() {
  const payload = `${Date.now()}:${process.env.ADMIN_SECRET_PATH ?? ""}`;
  const signature = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function isValidAdminToken(token: string | undefined) {
  if (!token) return false;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return false;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
  if (signature.length !== expected.length) return false;
  const validSignature = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  const timestamp = Number(payload.split(":")[0]);
  return validSignature && Number.isFinite(timestamp) && Date.now() - timestamp < 8 * 60 * 60 * 1000;
}

export async function isAdminAuthenticated(request?: NextRequest) {
  if (request) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token && isValidAdminToken(token)) return true;
  }
  try {
    const cookieStore = await cookies();
    return isValidAdminToken(cookieStore.get(COOKIE_NAME)?.value);
  } catch {
    return false;
  }
}

export const adminCookieName = COOKIE_NAME;
