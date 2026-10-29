import { NextRequest, NextResponse } from "next/server";
import { getAdminApp, getAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const app = getAdminApp();

    // ビルド時のダミー初期化時は安全にデフォルト値を返す
    if (app.options.projectId === "placeholder-build") {
      return NextResponse.json({ currentStock: 0, isAccepting: false });
    }

    const db = getAdminFirestore();
    const snapshot = await db.doc("prize/config").get();
    const prize = snapshot.data();

    return NextResponse.json({
      currentStock: prize?.currentStock ?? 0,
      isAccepting: prize?.isAccepting ?? false,
    });
  } catch (error) {
    console.error("Failed to fetch prize config:", error);
    return NextResponse.json(
      { currentStock: 0, isAccepting: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
