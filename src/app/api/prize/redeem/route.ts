import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  const body = await request.json() as { participationId?: string; passcode?: string };
  if (!body.participationId || body.passcode !== process.env.STAFF_PASSCODE) {
    return NextResponse.json({ error: "スタッフ用パスコードが正しくありません。" }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();
    const result = await db.runTransaction(async (transaction) => {
      const participationReference = db.collection("participations").doc(body.participationId as string);
      const prizeReference = db.doc("prize/config");
      const participationSnapshot = await transaction.get(participationReference);
      const prizeSnapshot = await transaction.get(prizeReference);
      const participation = participationSnapshot.data();
      const prize = prizeSnapshot.data();
      if (!participation?.screenshotVerified || participation.redeemed) throw new Error("PARTICIPATION_NOT_AVAILABLE");
      if (!prize?.isAccepting || (prize.currentStock ?? 0) <= 0) throw new Error("PRIZE_UNAVAILABLE");
      const stockField = participation.score === 3 ? "stock3" : participation.score === 2 ? "stock2" : "stock1";
      if ((prize[stockField] ?? 0) <= 0) throw new Error("PRIZE_UNAVAILABLE");
      const nextStock = (prize.currentStock as number) - 1;
      transaction.update(prizeReference, { currentStock: nextStock, distributed: (prize.distributed as number) + 1, [stockField]: (prize[stockField] as number) - 1, isAccepting: nextStock === 0 ? false : prize.isAccepting });
      transaction.update(participationReference, { redeemed: true, redeemedAt: new Date() });
      transaction.set(db.collection("prizeLogs").doc(), { action: "REDEEM", beforeStock: prize.currentStock, afterStock: nextStock, note: body.participationId, createdAt: new Date() });
      return { currentStock: nextStock };
    });
    return NextResponse.json({ redeemed: true, currentStock: result.currentStock });
  } catch (error) {
    const message = error instanceof Error && error.message === "PRIZE_UNAVAILABLE" ? "景品の受付は終了しています。" : "この参加記録はすでに引換済みか、スクショ確認が完了していません。";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
