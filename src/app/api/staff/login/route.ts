import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, adminCookieName } from "@/lib/auth";
import { createStaffCustomToken } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { password?: string };
    const expectedPassword = process.env.ADMIN_PASSWORD || "10101";
    const staffPasscode = process.env.STAFF_PASSCODE || "7777";

    // 10101 でも 7777 でも、設定された環境変数でもログインを許可
    const isValidPassword =
      Boolean(body.password) &&
      (body.password === expectedPassword ||
        body.password === "10101" ||
        body.password === staffPasscode ||
        body.password === "7777");

    if (!isValidPassword) {
      return NextResponse.json({ error: "パスワードが正しくありません。" }, { status: 401 });
    }

    // Firebase Auth トークンの生成を試みるが、失敗しても管理者Cookieでログインを継続
    let firebaseToken: string | undefined;
    try {
      firebaseToken = await createStaffCustomToken();
    } catch (authError) {
      console.warn("createStaffCustomToken failed (proceeding with session cookie):", authError);
    }

    const response = NextResponse.json({ authenticated: true, firebaseToken: firebaseToken || null });
    response.cookies.set(adminCookieName, createAdminToken(), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8, // 8時間
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Staff login error:", error);
    return NextResponse.json({ error: "ログイン処理中にエラーが発生しました。" }, { status: 500 });
  }
}
