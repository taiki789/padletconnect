import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    participationId?: string;
    passcode?: string;
    score?: number;
  };
  const validPasscode = process.env.STAFF_PASSCODE || "7777";

  if (body.passcode !== validPasscode) {
    return NextResponse.json(
      { error: "スタッフ用パスコードが正しくありません。" },
      { status: 401 }
    );
  }

  try {
    const db = getAdminFirestore();
    const result = await db.runTransaction(async (transaction) => {
      const participationReference = body.participationId
        ? db.collection("participations").doc(body.participationId)
        : db.collection("participations").doc();
      const prizeReference = db.doc("prize/config");
      const participationSnapshot = await transaction.get(participationReference);
      const prizeSnapshot = await transaction.get(prizeReference);

      const participation = participationSnapshot.exists
        ? participationSnapshot.data()
        : {
            score: typeof body.score === "number" ? body.score : 0,
            screenshotVerified: true,
            redeemed: false,
          };
      const prize = prizeSnapshot.data();

      if (participation?.redeemed) {
        throw new Error("ALREADY_REDEEMED");
      }

      if (!prize?.isAccepting || (prize.currentStock ?? 0) <= 0) {
        throw new Error("PRIZE_UNAVAILABLE");
      }

      const effectiveScore =
        typeof body.score === "number" && body.score > 0
          ? body.score
          : (participation?.score ?? 0);

      const stockField =
        effectiveScore === 3
          ? "stock3"
          : effectiveScore === 2
            ? "stock2"
            : "stock1";

      // 該当ランクの在庫がない場合は、在庫がある他のランクから減算するか、全体在庫があれば許可するフォールバック
      const fieldStock = Number(prize[stockField] ?? 0);
      const actualStockField =
        fieldStock > 0
          ? stockField
          : Number(prize.stock1 ?? 0) > 0
            ? "stock1"
            : Number(prize.stock2 ?? 0) > 0
              ? "stock2"
              : Number(prize.stock3 ?? 0) > 0
                ? "stock3"
                : null;

      const nextStock = Math.max(0, Number(prize.currentStock ?? 0) - 1);
      const updateData: Record<string, unknown> = {
        currentStock: nextStock,
        distributed: Number(prize.distributed ?? 0) + 1,
        isAccepting: nextStock === 0 ? false : prize.isAccepting,
      };
      if (actualStockField) {
        updateData[actualStockField] = Math.max(
          0,
          Number(prize[actualStockField] ?? 0) - 1
        );
      }

      transaction.update(prizeReference, updateData);

      if (participationSnapshot.exists) {
        transaction.update(participationReference, {
          score: effectiveScore,
          redeemed: true,
          screenshotVerified: true,
          redeemedAt: new Date(),
        });
      } else {
        transaction.set(participationReference, {
          score: effectiveScore,
          redeemed: true,
          screenshotVerified: true,
          createdAt: new Date(),
          redeemedAt: new Date(),
        });
      }

      transaction.set(db.collection("prizeLogs").doc(), {
        action: "REDEEM",
        beforeStock: prize.currentStock,
        afterStock: nextStock,
        note: participationReference.id,
        createdAt: new Date(),
      });

      return { currentStock: nextStock };
    });

    return NextResponse.json({
      redeemed: true,
      currentStock: result.currentStock,
    });
  } catch (error) {
    console.error("Redeem error:", error);
    let message = "引換処理中にエラーが発生しました。";
    if (error instanceof Error) {
      if (error.message === "PRIZE_UNAVAILABLE") {
        message = "景品の受付は終了しています（在庫切れまたは停止中）。";
      } else if (error.message === "ALREADY_REDEEMED") {
        message = "この参加記録はすでに引換済みです。";
      } else {
        message = `引換処理中にエラーが発生しました (${error.message})`;
      }
    }
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
