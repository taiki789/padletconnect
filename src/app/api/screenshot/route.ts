import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("screenshot");
    const participationId = formData.get("participationId");
    const score = formData.get("score");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "スクリーンショットを選択してください。" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "JPEG、PNG、WebP形式の画像を選択してください。" },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "画像サイズは10MB以下にしてください。" },
        { status: 413 }
      );
    }

    // Firestoreの更新（画像ファイル本体は保存せず、フラグと完了カウントを更新）
    try {
      const db = getAdminFirestore();
      let alreadyVerified = false;

      if (typeof participationId === "string" && participationId) {
        const partRef = db.collection("participations").doc(participationId);
        const partSnap = await partRef.get();
        if (partSnap.exists && partSnap.data()?.screenshotVerified) {
          alreadyVerified = true;
        }
        await partRef.update({
          screenshotVerified: true,
          score: Number(score) || 0,
        });
      }

      if (!alreadyVerified) {
        const prizeRef = db.doc("prize/config");
        const prizeSnap = await prizeRef.get();
        const prevCompleted = Number(prizeSnap.data()?.mission2Completed ?? 0);
        await prizeRef.update({
          mission2Completed: prevCompleted + 1,
        });
      }
    } catch (dbError) {
      console.error("Firestore update failed:", dbError);
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("Screenshot upload route error:", error);
    return NextResponse.json(
      { error: "画像の処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
