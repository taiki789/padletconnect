import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    let body: {
      action?: "start" | "mission2_reach" | "mission2_complete";
      participationId?: string;
      score?: number;
    } = {};
    try {
      body = await request.json();
    } catch {
      // Bodyが空の場合は通常の参加記録作成として扱う
    }

    const db = getAdminFirestore();

    if (body.action === "mission2_reach") {
      const prizeRef = db.doc("prize/config");
      const prizeSnap = await prizeRef.get();
      const prize = prizeSnap.data() ?? {};

      // この参加者が到達する前の時点での離脱率を判定する
      const prevReached = Number(prize.mission2Reached ?? 0);
      const prevCompleted = Number(prize.mission2Completed ?? 0);
      const prevDropoff = Math.max(0, prevReached - prevCompleted);
      const dropoffRate =
        prevReached > 0 ? Math.round((prevDropoff / prevReached) * 100) : 0;
      const isSimpleMission2 = prevReached > 0 && dropoffRate >= 40;

      let alreadyReached = false;
      if (body.participationId) {
        const partRef = db.collection("participations").doc(body.participationId);
        const partSnap = await partRef.get();
        if (partSnap.exists && partSnap.data()?.mission2Reached) {
          alreadyReached = true;
        }
        await partRef.update({
          mission2Reached: true,
          score: typeof body.score === "number" ? body.score : 0,
        });
      }

      if (!alreadyReached) {
        await prizeRef.update({
          mission2Reached: prevReached + 1,
        });
      }

      return NextResponse.json({
        ok: true,
        dropoffRate,
        isSimpleMission2,
      });
    }

    if (body.action === "mission2_complete") {
      const prizeRef = db.doc("prize/config");
      const prizeSnap = await prizeRef.get();
      const prize = prizeSnap.data() ?? {};
      const prevCompleted = Number(prize.mission2Completed ?? 0);

      let alreadyCompleted = false;
      if (body.participationId) {
        const partRef = db.collection("participations").doc(body.participationId);
        const partSnap = await partRef.get();
        if (partSnap.exists && partSnap.data()?.screenshotVerified) {
          alreadyCompleted = true;
        }
        await partRef.update({
          screenshotVerified: true,
          score: typeof body.score === "number" ? body.score : 0,
        });
      }

      if (!alreadyCompleted) {
        await prizeRef.update({
          mission2Completed: prevCompleted + 1,
        });
      }

      return NextResponse.json({ ok: true });
    }

    const reference = db.collection("participations").doc();
    await reference.set({
      score: 0,
      mission2Reached: false,
      screenshotVerified: false,
      redeemed: false,
      createdAt: new Date(),
    });
    return NextResponse.json({ participationId: reference.id });
  } catch (e) {
    console.error("Failed to handle participation:", e);
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `参加記録の処理に失敗しました (${detail})` },
      { status: 500 }
    );
  }
}
