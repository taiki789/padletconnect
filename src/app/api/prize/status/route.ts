import { connection, NextRequest, NextResponse } from "next/server";
import { getAdminApp, getAdminFirestore } from "@/lib/firebase-admin";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

// Firestore Quota 枯渇防止のためのメモリキャッシュ (TTL: 30秒)
type PrizeStatusData = {
  currentStock: number;
  isAccepting: boolean;
  stock3: number;
  stock2: number;
  stock1: number;
  stock0: number;
  mission2Reached: number;
  mission2Completed: number;
  dropoffRate: number;
  isSimpleMission2: boolean;
  error?: string;
};

let cachedStatus: { data: PrizeStatusData; timestamp: number } | null = null;
const CACHE_TTL_MS = 30 * 1000;

export function updateStatusCache(data: Partial<PrizeStatusData>) {
  if (cachedStatus) {
    cachedStatus.data = { ...cachedStatus.data, ...data };
    cachedStatus.timestamp = Date.now();
  }
}

export function invalidateStatusCache() {
  cachedStatus = null;
}

export async function GET(_request: NextRequest) {
  await connection();
  const now = Date.now();

  // キャッシュが有効な場合は Firestore を叩かずに即座に返す（Quota保護）
  if (cachedStatus && now - cachedStatus.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedStatus.data, { headers: NO_STORE_HEADERS });
  }

  try {
    const app = getAdminApp();

    if (app.options.projectId === "placeholder-build") {
      const fallback: PrizeStatusData = {
        currentStock: 100,
        isAccepting: true,
        stock3: 25,
        stock2: 25,
        stock1: 25,
        stock0: 25,
        mission2Reached: 0,
        mission2Completed: 0,
        dropoffRate: 0,
        isSimpleMission2: false,
      };
      return NextResponse.json(fallback, { headers: NO_STORE_HEADERS });
    }

    const db = getAdminFirestore();
    const snapshot = await db.doc("prize/config").get();
    const prize = snapshot.data();

    const mission2Reached = Number(prize?.mission2Reached ?? 0);
    const mission2Completed = Number(prize?.mission2Completed ?? 0);
    const dropoffCount = Math.max(0, mission2Reached - mission2Completed);
    const dropoffRate =
      mission2Reached > 0
        ? Math.round((dropoffCount / mission2Reached) * 100)
        : 0;
    const isSimpleMission2 = mission2Reached > 0 && dropoffRate >= 40;

    const result: PrizeStatusData = {
      currentStock: Number(prize?.currentStock ?? 100),
      isAccepting: prize?.isAccepting ?? true,
      stock3: Number(prize?.stock3 ?? 25),
      stock2: Number(prize?.stock2 ?? 25),
      stock1: Number(prize?.stock1 ?? 25),
      stock0: Number(prize?.stock0 ?? 25),
      mission2Reached,
      mission2Completed,
      dropoffRate,
      isSimpleMission2,
    };

    cachedStatus = { data: result, timestamp: now };
    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Failed to fetch prize config (using fallback to keep service running):", error);

    // Firestore が Quota Exceeded (429) またはエラーの場合でも、
    // 過去のキャッシュがあればそれを返し、無ければ安全な受付中フォールバックを 200 OK で返す！
    if (cachedStatus) {
      return NextResponse.json(cachedStatus.data, { headers: NO_STORE_HEADERS });
    }

    const fallback: PrizeStatusData = {
      currentStock: 100,
      isAccepting: true,
      stock3: 25,
      stock2: 25,
      stock1: 25,
      stock0: 25,
      mission2Reached: 0,
      mission2Completed: 0,
      dropoffRate: 0,
      isSimpleMission2: false,
      error: "quota_fallback",
    };
    cachedStatus = { data: fallback, timestamp: now };
    return NextResponse.json(fallback, { headers: NO_STORE_HEADERS });
  }
}
