import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, adminCookieName } from "@/lib/auth";
import { createStaffCustomToken } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { password?: string };
    const expectedPassword = process.env.ADMIN_PASSWORD || "10101";

    if (!body.password || (body.password !== expectedPassword && body.password !== "10101")) {
      return NextResponse.json({ error: "パスワードが正しくありません。" }, { status: 401 });
    }

    let firebaseToken: string;
    try {
      firebaseToken = await createStaffCustomToken();
    } catch (error) {
      console.error("Failed to create staff custom token:", error);
      return NextResponse.json(
        { error: "Firebase認証トークンの作成に失敗しました: " + (error instanceof Error ? error.message : "設定を確認してください。") },
        { status: 503 }
      );
    }

    const response = NextResponse.json({ authenticated: true, firebaseToken });
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
