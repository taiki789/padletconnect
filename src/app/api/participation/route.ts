import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST() {
  try {
    const reference = getAdminFirestore().collection("participations").doc();
    await reference.set({
      score: 0,
      screenshotVerified: false,
      redeemed: false,
      createdAt: new Date(),
    });
    return NextResponse.json({ participationId: reference.id });
  } catch (e) {
    console.error("Failed to create participation:", e);
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `参加記録の作成に失敗しました (${detail})` },
      { status: 500 }
    );
  }
}
