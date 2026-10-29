import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  const body = await request.json() as { participationId?: string; passcode?: string };
  const validPasscode = process.env.STAFF_PASSCODE || "7777";

  if (!body.participationId || body.passcode !== validPasscode) {
    return NextResponse.json({ error: "スタッフ用パスコードが正しくありません。" }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();
    const result = await db.runTransaction(async (transaction) => {
      const participationReference = db.collection("participations").doc(body.participationId as string);
      const prizeReference = db.doc("prize/config");
      const participationSnapshot = await transaction.get(participationReference);
      const prizeSnapshot = await transaction.get(prizeReference);

      if (!participationSnapshot.exists) {
        throw new Error("PARTICIPATION_NOT_FOUND");
      }

      const participation = participationSnapshot.data();
      const prize = prizeSnapshot.data();

      if (participation?.redeemed) {
        throw new Error("ALREADY_REDEEMED");
      }

      if (!prize?.isAccepting || (prize.currentStock ?? 0) <= 0) {
        throw new Error("PRIZE_UNAVAILABLE");
      }

      const stockField = participation?.score === 3 ? "stock3" : participation?.score === 2 ? "stock2" : "stock1";
      if ((prize[stockField] ?? 0) <= 0) {
        throw new Error("PRIZE_UNAVAILABLE");
      }

      const nextStock = (prize.currentStock as number) - 1;
      transaction.update(prizeReference, {
        currentStock: nextStock,
        distributed: (prize.distributed as number) + 1,
        [stockField]: (prize[stockField] as number) - 1,
        isAccepting: nextStock === 0 ? false : prize.isAccepting,
      });

      transaction.update(participationReference, {
        redeemed: true,
        screenshotVerified: true,
        redeemedAt: new Date(),
      });

      transaction.set(db.collection("prizeLogs").doc(), {
        action: "REDEEM",
        beforeStock: prize.currentStock,
        afterStock: nextStock,
        note: body.participationId,
        createdAt: new Date(),
      });

      return { currentStock: nextStock };
    });

    return NextResponse.json({ redeemed: true, currentStock: result.currentStock });
  } catch (error) {
    let message = "引換処理中にエラーが発生しました。";
    if (error instanceof Error) {
      if (error.message === "PRIZE_UNAVAILABLE") {
        message = "景品の受付は終了しています（在庫切れまたは停止中）。";
      } else if (error.message === "ALREADY_REDEEMED") {
        message = "この参加記録はすでに引換済みです。";
      } else if (error.message === "PARTICIPATION_NOT_FOUND") {
        message = "参加記録が見つかりません。最初からやり直してください。";
      }
    }
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
