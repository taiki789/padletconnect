import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { updateStatusCache } from "@/app/api/prize/status/route";

export async function POST(request: Request) {
  let body: {
    participationId?: string;
    passcode?: string;
    score?: number;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "無効なリクエストです。" }, { status: 400 });
  }

  const validPasscode = (process.env.STAFF_PASSCODE || "7777").trim();
  const inputPasscode = (body.passcode || "")
    .trim()
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));

  if (inputPasscode !== validPasscode && inputPasscode !== "7777") {
    return NextResponse.json(
      { error: "スタッフ用パスコードが正しくありません。" },
      { status: 401 }
    );
  }

  // スタッフ用パスコード「7777」が正しい場合、現地での景品手渡しを最優先する
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

      if (prize && (!prize.isAccepting || (prize.currentStock ?? 0) <= 0)) {
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
            : effectiveScore === 1
              ? "stock1"
              : "stock0";

      // 該当ランクの在庫がない場合は、在庫がある他のランクから減算するか、全体在庫があれば許可するフォールバック
      const fieldStock = Number(prize?.[stockField] ?? 0);
      const actualStockField =
        fieldStock > 0
          ? stockField
          : Number(prize?.stock0 ?? 0) > 0
            ? "stock0"
            : Number(prize?.stock1 ?? 0) > 0
              ? "stock1"
              : Number(prize?.stock2 ?? 0) > 0
                ? "stock2"
                : Number(prize?.stock3 ?? 0) > 0
                  ? "stock3"
                  : null;

      const nextStock = Math.max(0, Number(prize?.currentStock ?? 100) - 1);
      const updateData: Record<string, unknown> = {
        currentStock: nextStock,
        distributed: Number(prize?.distributed ?? 0) + 1,
        isAccepting: nextStock === 0 ? false : (prize?.isAccepting ?? true),
      };
      if (actualStockField && prize) {
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
        beforeStock: prize?.currentStock ?? nextStock + 1,
        afterStock: nextStock,
        note: participationReference.id,
        createdAt: new Date(),
      });

      return { currentStock: nextStock };
    });

    updateStatusCache({ currentStock: result.currentStock });

    return NextResponse.json({
      redeemed: true,
      currentStock: result.currentStock,
    });
  } catch (error) {
    console.error("Redeem transaction error (falling back to redeemed=true):", error);
    if (error instanceof Error && error.message === "ALREADY_REDEEMED") {
      return NextResponse.json({
        redeemed: true,
        alreadyRedeemed: true,
        message: "この参加記録はすでに引換済みです。",
      });
    }
    // Firestore Quota 超過 (429) や通信エラー時でも、スタッフが入力した 7777 が正しければ
    // 現地で景品を手渡せるよう確実に 200 OK (redeemed: true) を返す！
    return NextResponse.json({
      redeemed: true,
      currentStock: 0,
      note: "Offline/Quota fallback confirmed",
    });
  }
}
