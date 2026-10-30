import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

const SCREEN_FIELD_MAP: Record<string, string> = {
  mission1: "stepMission1",
  quiz: "stepQuiz",
  result: "stepResult",
  mission2: "stepMission2",
  upload: "stepUpload",
  final: "stepFinal",
};

export async function POST(request: NextRequest) {
  try {
    let body: {
      action?:
        | "start"
        | "track_screen"
        | "track_answer"
        | "mission2_reach"
        | "mission2_complete";
      screen?: string;
      quizId?: string;
      correct?: boolean;
      participationId?: string;
      score?: number;
    } = {};
    try {
      body = await request.json();
    } catch {
      // Bodyが空の場合は通常の参加記録作成として扱う
    }

    const db = getAdminFirestore();

    if (body.action === "track_screen" && body.screen) {
      const fieldName = SCREEN_FIELD_MAP[body.screen];
      if (!fieldName) {
        return NextResponse.json({ ok: true });
      }
      const prizeRef = db.doc("prize/config");
      const prizeSnap = await prizeRef.get();
      const prize = prizeSnap.data() ?? {};

      const updates: Record<string, unknown> = {
        [fieldName]: Number(prize[fieldName] ?? 0) + 1,
      };
      if (body.screen === "mission2") {
        updates.mission2Reached = Number(prize.mission2Reached ?? 0) + 1;
      }
      if (body.screen === "final") {
        updates.mission2Completed = Number(prize.mission2Completed ?? 0) + 1;
      }

      await prizeRef.update(updates);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "track_answer" && body.quizId) {
      const prizeRef = db.doc("prize/config");
      const prizeSnap = await prizeRef.get();
      const prize = prizeSnap.data() ?? {};

      const quizStats =
        (prize.quizStats as Record<
          string,
          { attempts?: number; correct?: number }
        >) ?? {};
      const currentStat = quizStats[body.quizId] ?? { attempts: 0, correct: 0 };
      const nextQuizStats = {
        ...quizStats,
        [body.quizId]: {
          attempts: Number(currentStat.attempts ?? 0) + 1,
          correct:
            Number(currentStat.correct ?? 0) + (body.correct ? 1 : 0),
        },
      };

      await prizeRef.update({ quizStats: nextQuizStats });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "mission2_reach") {
      const prizeRef = db.doc("prize/config");
      const prizeSnap = await prizeRef.get();
      const prize = prizeSnap.data() ?? {};
      const prevReached = Number(prize.mission2Reached ?? 0);
      const prevStepM2 = Number(prize.stepMission2 ?? prevReached);

      await prizeRef.update({
        mission2Reached: prevReached + 1,
        stepMission2: prevStepM2 + 1,
      });

      return NextResponse.json({ ok: true });
    }

    // 通常の参加記録作成（スタート時）
    const reference = db.collection("participations").doc();
    const prizeRef = db.doc("prize/config");
    const prizeSnap = await prizeRef.get();
    const prize = prizeSnap.data() ?? {};

    await Promise.all([
      reference.set({
        score: 0,
        mission2Reached: false,
        screenshotVerified: false,
        redeemed: false,
        createdAt: new Date(),
      }),
      prizeRef.update({
        stepMission1: Number(prize.stepMission1 ?? 0) + 1,
      }),
    ]);

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
