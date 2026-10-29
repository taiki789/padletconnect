import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminApp, getAdminFirestore } from "@/lib/firebase-admin";

const prizePath = "prize/config";
const emptyPrize = { initialStock: 0, currentStock: 0, distributed: 0, isAccepting: false, measurementStarted: false, initialStock3: 0, initialStock2: 0, initialStock1: 0, stock3: 0, stock2: 0, stock1: 0 };

async function getPrize() {
  const app = getAdminApp();
  if (app.options.projectId === "placeholder-build") {
    throw new Error("Firebaseが初期化されていません。環境変数 FIREBASE_SERVICE_ACCOUNT_KEY を設定してください。");
  }
  const db = getAdminFirestore();
  const reference = db.doc(prizePath);
  const snapshot = await reference.get();
  if (!snapshot.exists) await reference.set(emptyPrize);
  return { ...emptyPrize, ...(snapshot.exists ? snapshot.data() : {}) };
}

export async function GET(request: NextRequest) {
  try {
    if (!await isAdminAuthenticated(request)) {
      return NextResponse.json({ error: "認証されていません。再度ログインしてください。" }, { status: 401 });
    }
    const data = await getPrize();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/staff/prize error:", error);
    const message = error instanceof Error ? error.message : "景品情報の取得に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleUpdate(request: NextRequest) {
  try {
    if (!await isAdminAuthenticated(request)) {
      return NextResponse.json({ error: "認証されていません。再度ログインしてください。" }, { status: 401 });
    }

    const app = getAdminApp();
    if (app.options.projectId === "placeholder-build") {
      throw new Error("Firebaseが初期化されていません。環境変数 FIREBASE_SERVICE_ACCOUNT_KEY を設定してください。");
    }

    let body: { action?: string; stock3?: number; stock2?: number; stock1?: number; note?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "リクエストデータが正しくありません。" }, { status: 400 });
    }

    const db = getAdminFirestore();
    const prizeReference = db.doc(prizePath);
    const logReference = db.collection("prizeLogs").doc();

    const snapshot = await prizeReference.get();
    const current = { ...emptyPrize, ...(snapshot.exists ? snapshot.data() : {}) } as typeof emptyPrize;

    let next = { ...current };
    let logAction = "";
    let beforeStock = current.currentStock;
    let afterStock = current.currentStock;

    if (body.action === "stock") {
      const values = [body.stock3, body.stock2, body.stock1];
      if (values.some((value) => !Number.isInteger(value) || (value ?? -1) < 0)) {
        return NextResponse.json({ error: "景品数は0以上の整数で入力してください。" }, { status: 400 });
      }
      const stock3 = body.stock3 ?? 0;
      const stock2 = body.stock2 ?? 0;
      const stock1 = body.stock1 ?? 0;
      const total = stock3 + stock2 + stock1;
      next = {
        ...current,
        initialStock: total,
        currentStock: total,
        initialStock3: stock3,
        initialStock2: stock2,
        initialStock1: stock1,
        stock3,
        stock2,
        stock1,
        isAccepting: total === 0 ? false : current.isAccepting,
      };
      logAction = "STOCK_CHANGE";
      beforeStock = current.currentStock;
      afterStock = total;
    } else if (body.action === "start" || body.action === "stop") {
      if (body.action === "start" && current.currentStock === 0) {
        return NextResponse.json({ error: "景品数0または受付終了中です。" }, { status: 400 });
      }
      next = {
        ...current,
        isAccepting: body.action === "start",
        measurementStarted: body.action === "start",
      };
      logAction = body.action === "start" ? "ACCEPT_START" : "ACCEPT_STOP";
      beforeStock = current.currentStock;
      afterStock = current.currentStock;
    } else if (body.action === "manual_redeem") {
      const stockField = current.stock3 > 0 ? "stock3" : current.stock2 > 0 ? "stock2" : "stock1";
      if (!current.isAccepting || current.currentStock <= 0 || current[stockField] <= 0) {
        return NextResponse.json({ error: "景品数0または受付終了中です。" }, { status: 400 });
      }
      const nextStock = current.currentStock - 1;
      next = {
        ...current,
        currentStock: nextStock,
        distributed: current.distributed + 1,
        [stockField]: current[stockField] - 1,
        isAccepting: nextStock === 0 ? false : current.isAccepting,
      };
      logAction = "MANUAL_REDEEM";
      beforeStock = current.currentStock;
      afterStock = nextStock;
    } else {
      return NextResponse.json({ error: "無効な操作です。" }, { status: 400 });
    }

    // トランザクションのオーバーヘッドを避け、直接ドキュメントを更新
    await Promise.all([
      prizeReference.set(next),
      logReference.set({
        action: logAction,
        beforeStock,
        afterStock,
        note: body.note ?? "",
        createdAt: new Date(),
      }),
    ]);

    return NextResponse.json(next);
  } catch (error) {
    console.error("Update /api/staff/prize error:", error);
    const message = error instanceof Error ? error.message : "操作処理中にエラーが発生しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  return handleUpdate(request);
}

export async function POST(request: NextRequest) {
  return handleUpdate(request);
}
