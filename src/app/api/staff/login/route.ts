import { NextResponse } from "next/server";
import { createAdminToken, adminCookieName } from "@/lib/auth";
import { createStaffCustomToken } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  const body = await request.json() as { password?: string };
  if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "パスワードが正しくありません。" }, { status: 401 });
  }
  let firebaseToken: string;
  try {
    firebaseToken = await createStaffCustomToken();
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Firebase認証の設定が必要です。" }, { status: 503 });
  }
  const response = NextResponse.json({ authenticated: true, firebaseToken });
  response.cookies.set(adminCookieName, createAdminToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return response;
}
